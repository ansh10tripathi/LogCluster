import os
import re
import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.cluster import KMeans, AgglomerativeClustering, DBSCAN
from sklearn.decomposition import TruncatedSVD
from sklearn.metrics import silhouette_score, davies_bouldin_score, calinski_harabasz_score

class EnhancedLogPreprocessor:
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

    def preprocess_text(self, text: str) -> str:
        if not isinstance(text, str) or not text.strip():
            return ""

        cleaned = text.strip()

        if self.mask_timestamps:
            cleaned = self.re_http_timestamp.sub('<TIMESTAMP>', cleaned)
            cleaned = self.re_iso_timestamp.sub('<TIMESTAMP>', cleaned)
            cleaned = self.re_syslog_timestamp.sub('<TIMESTAMP>', cleaned)
            cleaned = self.re_time.sub('<TIME>', cleaned)

        if self.mask_urls:
            cleaned = self.re_url.sub('<URL>', cleaned)
            cleaned = self.re_url_query.sub('?<QUERY>', cleaned)

        if self.mask_emails:
            cleaned = self.re_email.sub('<EMAIL>', cleaned)

        if self.mask_macs:
            cleaned = self.re_mac.sub('<MAC>', cleaned)

        if self.mask_ips:
            cleaned = self.re_ipv6.sub('<IP>', cleaned)
            cleaned = self.re_ipv4.sub('<IP>', cleaned)

        if self.mask_paths:
            cleaned = self.re_win_path.sub('<PATH>', cleaned)
            cleaned = self.re_unix_path.sub('<PATH>', cleaned)

        if self.mask_devices:
            cleaned = self.re_net_interface.sub('<INTERFACE>', cleaned)
            cleaned = self.re_disk_device.sub('<DEV>', cleaned)

        if self.mask_hex:
            cleaned = self.re_hex.sub('<HEX>', cleaned)

        if self.mask_hashes:
            cleaned = self.re_uuid.sub('<UUID>', cleaned)
            cleaned = self.re_algo_hash.sub('<HASH>', cleaned)
            cleaned = self.re_long_hash.sub('<HASH>', cleaned)

        if self.mask_durations:
            cleaned = self.re_duration.sub('<DURATION>', cleaned)

        if self.mask_percentages:
            cleaned = self.re_percentage.sub('<PCT>', cleaned)

        if self.mask_numbers:
            cleaned = self.re_pid.sub(r'\1 <PID>', cleaned)
            cleaned = self.re_port.sub('port <PORT>', cleaned)
            cleaned = self.re_number.sub('<NUM>', cleaned)

        cleaned = self.re_whitespace.sub(' ', cleaned)
        return cleaned

def run_ml_benchmark():
    df = pd.read_csv("sample_logs.csv")
    pre = EnhancedLogPreprocessor()
    cleaned_messages = [pre.preprocess_text(m) for m in df['message']]

    vectorizer = TfidfVectorizer(max_features=500, stop_words='english', token_pattern=r'(?u)\b\w+\b', ngram_range=(1, 2))
    tfidf_matrix = vectorizer.fit_transform(cleaned_messages)
    dense_matrix = tfidf_matrix.toarray()

    print("=================================================================")
    print(f"BENCHMARKING CLUSTERING ALGORITHMS ON {len(df)} SAMPLE LOGS")
    print(f"TF-IDF Feature Space Dimensions: {tfidf_matrix.shape}")
    print("=================================================================\n")

    # 1. K-Means
    print("--- 1. K-Means Clustering ---")
    for k in [3, 4, 5, 6, 7]:
        km = KMeans(n_clusters=k, random_state=42, n_init=10)
        labels = km.fit_predict(tfidf_matrix)
        sil = round(silhouette_score(dense_matrix, labels), 4)
        db = round(davies_bouldin_score(dense_matrix, labels), 4)
        ch = round(calinski_harabasz_score(dense_matrix, labels), 4)
        print(f"  k={k:2d} -> Silhouette: {sil:+.4f} | Davies-Bouldin: {db:.4f} | Calinski-Harabasz: {ch:.4f}")

    # 2. Agglomerative Clustering
    print("\n--- 2. Agglomerative (Hierarchical) Clustering (k=5) ---")
    linkage_configs = [
        ("ward", "euclidean"),
        ("complete", "euclidean"),
        ("complete", "cosine"),
        ("average", "euclidean"),
        ("average", "cosine"),
    ]
    for linkage, metric in linkage_configs:
        agg = AgglomerativeClustering(n_clusters=5, linkage=linkage, metric=metric)
        labels = agg.fit_predict(dense_matrix)
        sil = round(silhouette_score(dense_matrix, labels), 4)
        db = round(davies_bouldin_score(dense_matrix, labels), 4)
        ch = round(calinski_harabasz_score(dense_matrix, labels), 4)
        print(f"  Linkage: {linkage:8s} | Metric: {metric:9s} -> Sil: {sil:+.4f} | DB: {db:.4f} | CH: {ch:.4f}")

    # 3. DBSCAN
    print("\n--- 3. DBSCAN (Density-Based Clustering) ---")
    dbscan_configs = [
        (0.3, 2, "euclidean"),
        (0.5, 2, "euclidean"),
        (0.8, 2, "euclidean"),
        (0.3, 2, "cosine"),
        (0.5, 2, "cosine"),
        (0.7, 2, "cosine"),
        (0.5, 3, "cosine"),
    ]
    for eps, min_samples, metric in dbscan_configs:
        db = DBSCAN(eps=eps, min_samples=min_samples, metric=metric)
        labels = db.fit_predict(tfidf_matrix)
        n_clusters = len(set(labels)) - (1 if -1 in labels else 0)
        n_outliers = int((labels == -1).sum())
        if len(set(labels)) > 1 and len(df) > len(set(labels)):
            sil = round(silhouette_score(dense_matrix, labels), 4)
            db_idx = round(davies_bouldin_score(dense_matrix, labels), 4)
        else:
            sil, db_idx = "N/A", "N/A"
        print(f"  eps={eps:.1f}, min_samples={min_samples}, metric={metric:9s} -> Clusters: {n_clusters:2d} | Outliers: {n_outliers:2d} | Sil: {sil} | DB: {db_idx}")

    print("\nAll clustering algorithms evaluated successfully without errors.")

if __name__ == "__main__":
    run_ml_benchmark()
