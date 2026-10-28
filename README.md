# LogCluster — Universal Log Pattern Grouping

**LogCluster** is an unsupervised machine learning web application designed to automatically discover, structure, and group heterogeneous enterprise log messages into meaningful event patterns without requiring manually labeled training data.

Built with **React, Vite, Tailwind CSS, Recharts**, and a **Python FastAPI** backend powered by **Scikit-Learn, Pandas, and NumPy**.

---

## 1. Problem Statement

Modern enterprise infrastructures generate gigabytes to terabytes of heterogeneous logs daily across web proxies, database nodes, network routers, authentication gateways, and operating system kernels. 
- Log messages contain dynamic variables (IP addresses, timestamps, UUIDs, process IDs, ports) mixed with static event text.
- Writing manual regex rules or signatures fails to scale as microservices and systems evolve.
- Unsupervised pattern discovery is critical for observability, root cause analysis, anomaly detection, and log volume compression.

---

## 2. Key Features

- **Executive Dashboard**: Real-time metrics overview (total logs processed, cluster counts, unique patterns, outlier statistics, severity distributions).
- **Multi-Format Log Ingestion**: Support for CSV, TXT, and JSON files with automatic schema header detection and column mapping previews.
- **Prebuilt Heterogeneous Dataset**: Built-in 5-source synthetic dataset (PostgreSQL, Nginx, Cisco ASR, AuthService, OS Kernel) ready for instant academic demonstration.
- **Robust Preprocessing & Template Mining**: Regex-based variable masking (`<IP>`, `<NUM>`, `<TIMESTAMP>`, `<UUID>`, `<HASH>`) to isolate true static log signatures.
- **Unsupervised ML Engine**:
  - **TF-IDF Vectorization**: Sparse matrix token representation with stop-word filtering.
  - **K-Means Clustering**: Partitioning log vectors into $K$ distinct clusters minimizing within-cluster variance.
  - **Agglomerative Clustering**: Bottom-up hierarchical merging with configurable distance metrics (Euclidean, Cosine) and linkage criteria (Ward, Complete, Average).
  - **DBSCAN**: Density-based spatial clustering identifying dense log groups and isolating noisy outlier points (Cluster ID `-1`).
- **Clustering Evaluation Metrics**:
  - **Silhouette Score**: Measures cluster cohesion vs. separation in $[-1, +1]$.
  - **Davies-Bouldin Index**: Evaluates average similarity ratio of each cluster with its most similar one (lower is better).
  - **Calinski-Harabasz Index**: Ratio of total between-clusters dispersion to within-cluster dispersion.
- **2D Dimensionality Reduction & Scatter Visualization**: TruncatedSVD components mapping high-dimensional TF-IDF vectors into an interactive 2D scatter plot.
- **Interactive Hierarchical Dendrogram**: Visual representation of agglomerative merge steps.
- **Searchable Log Explorer**: Filter log records by cluster ID or severity level with full-text search and pagination.
- **Multi-Format Export**: Download clustered datasets as CSV, export cluster pattern summaries as CSV, or generate a printable HTML report.

---

## 3. Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend Framework** | React 18 + Vite |
| **Styling & UI** | Tailwind CSS (Dark Observability Theme) |
| **Icons & Charts** | Lucide React, Recharts |
| **Backend Framework** | Python 3.11+ / FastAPI |
| **ML Stack** | Scikit-Learn, Pandas, NumPy |
| **Vector Representation** | TF-IDF (`TfidfVectorizer`) |
| **Clustering Algorithms** | `KMeans`, `AgglomerativeClustering`, `DBSCAN` |
| **Dimensionality Reduction** | `TruncatedSVD` (2D Projection) |

---

## 4. Machine Learning Methodology

```
Raw Log Files (CSV/TXT/JSON)
           │
           ▼
[Regex Preprocessing & Masking] ────► Mask IPs, Timestamps, UUIDs, Ports
           │
           ▼
[TF-IDF Text Representation]    ────► Extract n-gram token features (500 max)
           │
           ▼
[Unsupervised Clustering]       ────► K-Means / Agglomerative / DBSCAN
           │
     ┌─────┴────────────────────────────────┐
     ▼                                      ▼
[Dimensionality Reduction]          [Quality Evaluation]
TruncatedSVD (2D Projection)        Silhouette, Davies-Bouldin, Calinski-Harabasz
```

---

## 5. How to Run LogCluster Locally

### Prerequisites
- Python 3.10+
- Node.js 18+ & npm

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --port 8000 --reload
```
The FastAPI backend will run at `http://localhost:8000`. API docs are available at `http://localhost:8000/docs`.

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 6. Project Architecture

```
logcluster/
├── backend/
│   ├── main.py            # FastAPI API endpoints & file upload handling
│   ├── ml.py              # LogPreprocessor, Vectorizer, Clustering Engine, SVD & Metrics
│   ├── sample_logs.csv    # Heterogeneous log dataset across 5 log sources
│   └── requirements.txt   # FastAPI, Scikit-Learn, Pandas, NumPy, Uvicorn
│
├── frontend/
│   ├── package.json
│   ├── vite.config.js     # Vite dev server with proxy to backend
│   ├── tailwind.config.js # Custom dark observability color palette
│   └── src/
│       ├── api/client.js  # REST API Client wrapper
│       ├── components/    # Sidebar, Topbar, MetricCard, ScatterPlot2D, DendrogramTree, ClusterCard
│       └── pages/         # OverviewPage, AnalyzePage, ClustersPage, ExplorerPage, ReportsPage
│
└── README.md              # Project documentation
```

---

## 7. Future Enhancements & Limitations

- **Streaming Logs**: Real-time log ingestion via WebSocket / Kafka.
- **Online Incremental Clustering**: MiniBatchKMeans or BIRCH for processing infinite streaming logs.
- **Deep Log Embeddings**: Support for Sentence-BERT or FastText dense embeddings alongside TF-IDF.
