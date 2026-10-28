import re
import numpy as np
import pandas as pd
from typing import List, Dict, Any, Tuple
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.cluster import KMeans, AgglomerativeClustering, DBSCAN
from sklearn.decomposition import TruncatedSVD
from sklearn.metrics import silhouette_score, davies_bouldin_score, calinski_harabasz_score

class LogPreprocessor:
    """Masks dynamic variable components to extract robust log pattern signatures."""
    def __init__(
        self,
        mask_timestamps: bool = True,
        mask_urls: bool = True,
        mask_emails: bool = True,
        mask_macs: bool = True,
        mask_ips: bool = True,
        mask_paths: bool = True,
        mask_devices: bool = True,
        mask_hex: bool = True,
        mask_hashes: bool = True,
        mask_durations: bool = True,
        mask_percentages: bool = True,
        mask_numbers: bool = True,
    ):
        self.mask_timestamps = mask_timestamps
        self.mask_urls = mask_urls
        self.mask_emails = mask_emails
        self.mask_macs = mask_macs
        self.mask_ips = mask_ips
        self.mask_paths = mask_paths
        self.mask_devices = mask_devices
        self.mask_hex = mask_hex
        self.mask_hashes = mask_hashes
        self.mask_durations = mask_durations
        self.mask_percentages = mask_percentages
        self.mask_numbers = mask_numbers

        # Precompiled regex patterns for optimal extraction speed
        self.re_http_timestamp = re.compile(r'\[\d{2}/\w{3}/\d{4}:\d{2}:\d{2}:\d{2}\s[+\-]\d{4}\]')
        self.re_iso_timestamp = re.compile(r'\b\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+\-]\d{2}:?\d{2})?\b')
        self.re_syslog_timestamp = re.compile(r'\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2}\s+\d{2}:\d{2}:\d{2}\b')
        self.re_time = re.compile(r'\b\d{2}:\d{2}:\d{2}(?:\.\d+)?\b')

        self.re_url = re.compile(r'\bhttps?://[^\s"\'>]+')
        self.re_url_query = re.compile(r'(?<=[a-zA-Z0-9_/])\?[a-zA-Z0-9_=&%.\-]+')
        self.re_email = re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b')
        self.re_mac = re.compile(r'\b(?:[0-9a-fA-F]{2}[:-]){5}[0-9a-fA-F]{2}\b')

        self.re_ipv4 = re.compile(r'\b(?:\d{1,3}\.){3}\d{1,3}(?::\d{1,5})?\b')
        self.re_ipv6 = re.compile(r'(?<![:\w])(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}(?![:\w])|(?<![:\w])(?:[0-9a-fA-F]{1,4}:)*(?:[0-9a-fA-F]{1,4})?::[0-9a-fA-F:]*(?![:\w])|(?<![:\w])::1(?![:\w])')

        self.re_win_path = re.compile(r'\b[a-zA-Z]:\\(?:[a-zA-Z0-9_\-\.]+\\?)+')
        self.re_unix_path = re.compile(r'(?<=[\s"\'\(=:])/(?:var|etc|usr|opt|home|tmp|dev|sys|proc|root|bin|sbin|lib|private)(?:/[a-zA-Z0-9_\-\.]+)+')

        self.re_net_interface = re.compile(r'\b(?:GigabitEthernet|TenGigabitEthernet|FastEthernet|Ethernet|eth|enp\d+s|wlan|lo)\d+(?:[/\.]\d+)*\b')
        self.re_disk_device = re.compile(r'\b(?:sd[a-z]\d*|nvme\d+n\d+(?:p\d+)?|vd[a-z]\d*|hd[a-z]\d*)\b')

        self.re_hex = re.compile(r'\b0x[0-9a-fA-F]+\b')
        self.re_uuid = re.compile(r'\b[0-9a-fA-F]{8}-(?:[0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}\b')
        self.re_algo_hash = re.compile(r'\b(?:SHA256|SHA512|SHA1|MD5):[0-9a-zA-Z+/=]+\b')
        self.re_long_hash = re.compile(r'\b[0-9a-fA-F]{16,}\b')

        self.re_duration = re.compile(r'\b\d+(?:\.\d+)?\s*(?:ms|us|µs|ns|sec|seconds|min|minutes)\b')
        self.re_percentage = re.compile(r'(?<!<)\b\d+(?:\.\d+)?%')

        self.re_pid = re.compile(r'\b(process|pid|PID)\s+\d+\b')
        self.re_port = re.compile(r'\bport\s+\d+\b')
        self.re_number = re.compile(r'(?<!<)\b\d+\b(?!>)')

        self.re_whitespace = re.compile(r'\s+')

    def get_active_rules(self) -> List[str]:
        rules = []
        if self.mask_timestamps: rules.append("Timestamps")
        if self.mask_urls: rules.append("URLs & Endpoints")
        if self.mask_emails: rules.append("Emails")
        if self.mask_macs: rules.append("MAC Addresses")
        if self.mask_ips: rules.append("IP Addresses (IPv4/v6)")
        if self.mask_paths: rules.append("File Paths")
        if self.mask_devices: rules.append("Interfaces & Devices")
        if self.mask_hex: rules.append("Memory/Hex Pointers")
        if self.mask_hashes: rules.append("Hashes & UUIDs")
        if self.mask_durations: rules.append("Latencies/Durations")
        if self.mask_percentages: rules.append("Percentages")
        if self.mask_numbers: rules.append("Numbers & Ports")
        return rules

    def preprocess_text(self, text: str) -> str:
        if not isinstance(text, str) or not text.strip():
            return ""

        cleaned = text.strip()

        # 1. Timestamps & Time
        if self.mask_timestamps:
            cleaned = self.re_http_timestamp.sub('<TIMESTAMP>', cleaned)
            cleaned = self.re_iso_timestamp.sub('<TIMESTAMP>', cleaned)
            cleaned = self.re_syslog_timestamp.sub('<TIMESTAMP>', cleaned)
            cleaned = self.re_time.sub('<TIME>', cleaned)

        # 2. URLs & Query Parameters
        if self.mask_urls:
            cleaned = self.re_url.sub('<URL>', cleaned)
            cleaned = self.re_url_query.sub('?<QUERY>', cleaned)

        # 3. Emails
        if self.mask_emails:
            cleaned = self.re_email.sub('<EMAIL>', cleaned)

        # 4. MAC addresses (Must precede IP to prevent IPv6 collision)
        if self.mask_macs:
            cleaned = self.re_mac.sub('<MAC>', cleaned)

        # 5. IP Addresses (IPv4 and IPv6)
        if self.mask_ips:
            cleaned = self.re_ipv6.sub('<IP>', cleaned)
            cleaned = self.re_ipv4.sub('<IP>', cleaned)

        # 6. File & Directory Paths
        if self.mask_paths:
            cleaned = self.re_win_path.sub('<PATH>', cleaned)
            cleaned = self.re_unix_path.sub('<PATH>', cleaned)

        # 7. Devices & Network Interfaces
        if self.mask_devices:
            cleaned = self.re_net_interface.sub('<INTERFACE>', cleaned)
            cleaned = self.re_disk_device.sub('<DEV>', cleaned)

        # 8. Memory & Hex pointers
        if self.mask_hex:
            cleaned = self.re_hex.sub('<HEX>', cleaned)

        # 9. Hashes & UUIDs
        if self.mask_hashes:
            cleaned = self.re_uuid.sub('<UUID>', cleaned)
            cleaned = self.re_algo_hash.sub('<HASH>', cleaned)
            cleaned = self.re_long_hash.sub('<HASH>', cleaned)

        # 10. Latencies / Durations
        if self.mask_durations:
            cleaned = self.re_duration.sub('<DURATION>', cleaned)

        # 11. Percentages
        if self.mask_percentages:
            cleaned = self.re_percentage.sub('<PCT>', cleaned)

        # 12. PIDs, Ports, and standalone Numbers
        if self.mask_numbers:
            cleaned = self.re_pid.sub(r'\1 <PID>', cleaned)
            cleaned = self.re_port.sub('port <PORT>', cleaned)
            cleaned = self.re_number.sub('<NUM>', cleaned)

        # 13. Normalize whitespace
        cleaned = self.re_whitespace.sub(' ', cleaned)
        return cleaned

class LogClusterEngine:
    """Core Unsupervised Learning engine for LogCluster."""

    @staticmethod
    def run_clustering(
        df: pd.DataFrame,
        message_col: str,
        algorithm: str = "kmeans",
        k: int = 5,
        eps: float = 0.5,
        min_samples: int = 2,
        linkage: str = "ward",
        metric: str = "euclidean",
        source_col: str = None,
        level_col: str = None,
        device_col: str = None,
        timestamp_col: str = None,
        mask_timestamps: bool = True,
        mask_urls: bool = True,
        mask_emails: bool = True,
        mask_macs: bool = True,
        mask_ips: bool = True,
        mask_paths: bool = True,
        mask_devices: bool = True,
        mask_hex: bool = True,
        mask_hashes: bool = True,
        mask_durations: bool = True,
        mask_percentages: bool = True,
        mask_numbers: bool = True,
    ) -> Dict[str, Any]:
        """
        Executes TF-IDF vectorization, clustering, dimensionality reduction, and metrics evaluation.
        """
        if df.empty or message_col not in df.columns:
            raise ValueError(f"Invalid dataset or message column '{message_col}' not found.")

        # 1. Preprocessing with configured masking rules
        preprocessor = LogPreprocessor(
            mask_timestamps=mask_timestamps,
            mask_urls=mask_urls,
            mask_emails=mask_emails,
            mask_macs=mask_macs,
            mask_ips=mask_ips,
            mask_paths=mask_paths,
            mask_devices=mask_devices,
            mask_hex=mask_hex,
            mask_hashes=mask_hashes,
            mask_durations=mask_durations,
            mask_percentages=mask_percentages,
            mask_numbers=mask_numbers,
        )
        raw_messages = df[message_col].astype(str).tolist()
        cleaned_messages = [preprocessor.preprocess_text(msg) for msg in raw_messages]

        # Handle empty/blank edge cases
        valid_indices = [i for i, msg in enumerate(cleaned_messages) if len(msg.strip()) > 0]
        if not valid_indices:
            raise ValueError("No non-empty log messages found after preprocessing.")

        # 2. Vectorization (TF-IDF)
        vectorizer = TfidfVectorizer(
            max_features=500,
            stop_words='english',
            token_pattern=r'(?u)\b\w+\b',
            ngram_range=(1, 2)
        )
        tfidf_matrix = vectorizer.fit_transform(cleaned_messages)
        feature_names = np.array(vectorizer.get_feature_names_out())

        n_samples = tfidf_matrix.shape[0]
        n_features = tfidf_matrix.shape[1]

        # Edge case: If no features were extracted (e.g. logs contained only symbols/masked tokens)
        if n_features == 0:
            from scipy.sparse import csr_matrix
            lengths = np.array([len(m) for m in cleaned_messages], dtype=float).reshape(-1, 1)
            max_len = max(lengths.max(), 1.0)
            tfidf_matrix = csr_matrix(lengths / max_len)
            feature_names = np.array(["msg_length"])
            n_features = 1

        # 3. Algorithm Selection & Execution
        algo_name_map = {
            "kmeans": "K-Means",
            "agglomerative": "Agglomerative Clustering",
            "dbscan": "DBSCAN"
        }
        display_algo = algo_name_map.get(algorithm.lower(), algorithm)

        if n_samples < 2:
            labels = np.zeros(n_samples, dtype=int)
        elif algorithm.lower() == "kmeans":
            n_clusters = max(1, min(k, n_samples))
            if n_clusters < 2:
                labels = np.zeros(n_samples, dtype=int)
            else:
                model = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
                labels = model.fit_predict(tfidf_matrix)

        elif algorithm.lower() == "agglomerative":
            n_clusters = max(1, min(k, n_samples))
            if n_clusters < 2:
                labels = np.zeros(n_samples, dtype=int)
            else:
                current_metric = "euclidean" if linkage == "ward" else metric
                model = AgglomerativeClustering(
                    n_clusters=n_clusters,
                    linkage=linkage,
                    metric=current_metric
                )
                labels = model.fit_predict(tfidf_matrix.toarray())

        elif algorithm.lower() == "dbscan":
            db_metric = "cosine" if metric == "cosine" else "euclidean"
            model = DBSCAN(eps=eps, min_samples=min_samples, metric=db_metric)
            labels = model.fit_predict(tfidf_matrix)
        else:
            raise ValueError(f"Unsupported clustering algorithm: {algorithm}")

        df['cluster_id'] = labels
        df['cleaned_message'] = cleaned_messages

        # 4. 2D Dimensionality Reduction (TruncatedSVD for visualization)
        if n_samples >= 2 and n_features >= 2:
            svd = TruncatedSVD(n_components=2, random_state=42)
            coords_2d = svd.fit_transform(tfidf_matrix)
        elif n_features == 1 and n_samples > 0:
            dense_col = tfidf_matrix.toarray()
            coords_2d = np.hstack([dense_col, np.zeros((n_samples, 1))])
        else:
            coords_2d = np.zeros((n_samples, 2))

        # 5. Evaluation Metrics
        unique_labels = set(labels)
        non_noise_labels = [lbl for lbl in unique_labels if lbl != -1]
        n_clusters_found = len(non_noise_labels)
        n_outliers = int((labels == -1).sum()) if -1 in unique_labels else 0

        silhouette = None
        davies_bouldin = None
        calinski_harabasz = None
        metric_explanation = None

        # Metrics are mathematically defined when 2 <= n_clusters <= n_samples - 1 and points > 1
        if len(unique_labels) > 1 and n_samples > len(unique_labels):
            try:
                dense_matrix = tfidf_matrix.toarray()
                silhouette = float(round(silhouette_score(dense_matrix, labels), 4))
                davies_bouldin = float(round(davies_bouldin_score(dense_matrix, labels), 4))
                calinski_harabasz = float(round(calinski_harabasz_score(dense_matrix, labels), 4))
            except Exception as e:
                metric_explanation = f"Metrics calculation skipped: {str(e)}"
        else:
            metric_explanation = "Metrics require at least 2 distinct clusters and valid sample sizes."

        # 6. Cluster Summaries & Pattern Mining
        clusters_summary = []
        dense_tfidf = tfidf_matrix.toarray()

        for cluster_id in sorted(list(unique_labels)):
            cluster_mask = (labels == cluster_id)
            cluster_df = df[cluster_mask]
            cluster_size = len(cluster_df)
            pct = round((cluster_size / n_samples) * 100, 2)

            # Top TF-IDF Keywords
            if cluster_size > 0 and dense_tfidf.shape[1] > 0:
                cluster_tfidf_mean = dense_tfidf[cluster_mask].mean(axis=0)
                top_indices = cluster_tfidf_mean.argsort()[::-1][:15]
                raw_keywords = [feature_names[idx] for idx in top_indices if cluster_tfidf_mean[idx] > 0]
                # Filter out redundant bigrams or self-repeating words (e.g. 'interface interface')
                clean_kw = []
                seen_words = set()
                for kw in raw_keywords:
                    words = kw.split()
                    if len(words) == 2 and words[0] == words[1]:
                        continue
                    if kw in seen_words:
                        continue
                    clean_kw.append(kw)
                    seen_words.add(kw)
                    if len(clean_kw) >= 5:
                        break
                top_keywords = clean_kw
            else:
                top_keywords = []

            # Representative Pattern (most common cleaned template)
            most_frequent_pattern = cluster_df['cleaned_message'].mode()[0] if not cluster_df.empty else ""

            # Sample logs (up to 3)
            sample_logs = cluster_df[message_col].head(3).tolist()

            # Metadata distributions
            source_dist = cluster_df[source_col].value_counts().to_dict() if source_col and source_col in cluster_df else {}
            level_dist = cluster_df[level_col].value_counts().to_dict() if level_col and level_col in cluster_df else {}
            device_dist = cluster_df[device_col].value_counts().to_dict() if device_col and device_col in cluster_df else {}

            clusters_summary.append({
                "cluster_id": int(cluster_id),
                "is_outlier": bool(cluster_id == -1),
                "cluster_name": "Outliers / Noise" if cluster_id == -1 else f"Cluster {cluster_id}",
                "count": cluster_size,
                "percentage": pct,
                "pattern": most_frequent_pattern,
                "top_keywords": top_keywords,
                "sample_logs": sample_logs,
                "sources": source_dist,
                "levels": level_dist,
                "devices": device_dist
            })

        # 7. Scatter plot 2D point data
        scatter_points = []
        for idx in range(n_samples):
            row_data = df.iloc[idx]
            scatter_points.append({
                "id": idx,
                "x": float(round(coords_2d[idx, 0], 4)),
                "y": float(round(coords_2d[idx, 1], 4)),
                "cluster_id": int(labels[idx]),
                "message": str(row_data[message_col])[:120],
                "level": str(row_data[level_col]) if level_col and level_col in df else "UNKNOWN",
                "source": str(row_data[source_col]) if source_col and source_col in df else "UNKNOWN"
            })

        # Unique log patterns count
        unique_patterns_count = df['cleaned_message'].nunique()

        # Build final response payload
        results = {
            "algorithm": display_algo,
            "total_logs": n_samples,
            "n_clusters": n_clusters_found,
            "n_outliers": n_outliers,
            "unique_patterns_count": int(unique_patterns_count),
            "metrics": {
                "silhouette_score": silhouette,
                "davies_bouldin_score": davies_bouldin,
                "calinski_harabasz_score": calinski_harabasz,
                "explanation": metric_explanation
            },
            "active_preprocessing_rules": preprocessor.get_active_rules(),
            "clusters": clusters_summary,
            "scatter_points": scatter_points,
            "logs": df.to_dict(orient="records")
        }

        return results
