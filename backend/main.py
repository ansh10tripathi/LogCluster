import io
import os
import uuid
import pandas as pd
from typing import Dict, Any, Optional, List
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, StreamingResponse, HTMLResponse
from pydantic import BaseModel

from ml import LogClusterEngine

app = FastAPI(
    title="LogCluster API — Universal Log Pattern Grouping",
    description="Backend API for log parsing, TF-IDF vectorization, unsupervised clustering, and evaluation.",
    version="1.0.0"
)

# Enable CORS for React frontend (Vite default on port 5173 or any dev origin)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory store for uploaded datasets and analysis sessions
DATASETS_STORE: Dict[str, pd.DataFrame] = {}
ANALYSIS_STORE: Dict[str, Dict[str, Any]] = {}

SAMPLE_CSV_PATH = os.path.join(os.path.dirname(__file__), "sample_logs.csv")

class AnalyzeRequest(BaseModel):
    dataset_id: str
    message_col: str
    source_col: Optional[str] = None
    level_col: Optional[str] = None
    device_col: Optional[str] = None
    timestamp_col: Optional[str] = None
    algorithm: str = "kmeans"
    k: int = 6
    eps: float = 0.5
    min_samples: int = 2
    linkage: str = "ward"
    metric: str = "euclidean"
    # Preprocessing variable masking rules
    mask_timestamps: bool = True
    mask_urls: bool = True
    mask_emails: bool = True
    mask_macs: bool = True
    mask_ips: bool = True
    mask_paths: bool = True
    mask_devices: bool = True
    mask_hex: bool = True
    mask_hashes: bool = True
    mask_durations: bool = True
    mask_percentages: bool = True
    mask_numbers: bool = True

@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "LogCluster API", "version": "1.0.0"}

@app.post("/api/sample")
def load_sample_dataset():
    """Loads default heterogeneous sample dataset and runs default K-Means clustering analysis."""
    if not os.path.exists(SAMPLE_CSV_PATH):
        raise HTTPException(status_code=404, detail="Sample dataset file not found.")

    df = pd.read_csv(SAMPLE_CSV_PATH)
    dataset_id = "sample_dataset"
    DATASETS_STORE[dataset_id] = df

    # Auto-run initial default K-Means clustering for instant dashboard display
    analysis_results = LogClusterEngine.run_clustering(
        df=df,
        message_col="message",
        algorithm="kmeans",
        k=6,
        source_col="source",
        level_col="level",
        device_col="device",
        timestamp_col="timestamp"
    )

    analysis_id = "sample_analysis"
    ANALYSIS_STORE[analysis_id] = analysis_results

    return {
        "status": "success",
        "dataset_id": dataset_id,
        "analysis_id": analysis_id,
        "filename": "sample_logs.csv",
        "columns": list(df.columns),
        "detected_message_col": "message",
        "detected_source_col": "source",
        "detected_level_col": "level",
        "detected_device_col": "device",
        "detected_timestamp_col": "timestamp",
        "total_rows": len(df),
        "preview": df.head(5).to_dict(orient="records"),
        "results": analysis_results
    }

@app.post("/api/upload")
async def upload_log_file(file: UploadFile = File(...)):
    """Uploads CSV, TXT, or JSON log file, detects columns, and returns dataset ID and preview."""
    try:
        content = await file.read()
        filename = file.filename or "uploaded_log.txt"

        if filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(content))
        elif filename.endswith(".json"):
            df = pd.read_json(io.BytesIO(content))
        else: # TXT or plain text
            lines = content.decode("utf-8", errors="ignore").splitlines()
            df = pd.DataFrame({"message": [l for l in lines if l.strip()]})

        if df.empty:
            raise HTTPException(status_code=400, detail="Uploaded file is empty or invalid.")

        dataset_id = str(uuid.uuid4())
        DATASETS_STORE[dataset_id] = df

        columns = list(df.columns)

        # Smart column detection heuristics
        msg_col = next((c for c in columns if "msg" in c.lower() or "message" in c.lower() or "text" in c.lower() or "log" in c.lower()), columns[0])
        src_col = next((c for c in columns if "src" in c.lower() or "source" in c.lower() or "service" in c.lower()), None)
        lvl_col = next((c for c in columns if "lvl" in c.lower() or "level" in c.lower() or "severity" in c.lower() or "type" in c.lower()), None)
        dev_col = next((c for c in columns if "dev" in c.lower() or "device" in c.lower() or "host" in c.lower() or "node" in c.lower()), None)
        ts_col = next((c for c in columns if "time" in c.lower() or "date" in c.lower() or "timestamp" in c.lower()), None)

        return {
            "status": "success",
            "dataset_id": dataset_id,
            "filename": filename,
            "columns": columns,
            "detected_message_col": msg_col,
            "detected_source_col": src_col,
            "detected_level_col": lvl_col,
            "detected_device_col": dev_col,
            "detected_timestamp_col": ts_col,
            "total_rows": len(df),
            "preview": df.head(5).to_dict(orient="records")
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to process uploaded file: {str(e)}")

@app.post("/api/analyze")
def analyze_logs(req: AnalyzeRequest):
    """Executes clustering analysis on dataset with selected parameters."""
    if req.dataset_id not in DATASETS_STORE:
        raise HTTPException(status_code=404, detail="Dataset not found. Please upload or load sample data.")

    df = DATASETS_STORE[req.dataset_id].copy()

    try:
        results = LogClusterEngine.run_clustering(
            df=df,
            message_col=req.message_col,
            algorithm=req.algorithm,
            k=req.k,
            eps=req.eps,
            min_samples=req.min_samples,
            linkage=req.linkage,
            metric=req.metric,
            source_col=req.source_col,
            level_col=req.level_col,
            device_col=req.device_col,
            timestamp_col=req.timestamp_col,
            mask_timestamps=req.mask_timestamps,
            mask_urls=req.mask_urls,
            mask_emails=req.mask_emails,
            mask_macs=req.mask_macs,
            mask_ips=req.mask_ips,
            mask_paths=req.mask_paths,
            mask_devices=req.mask_devices,
            mask_hex=req.mask_hex,
            mask_hashes=req.mask_hashes,
            mask_durations=req.mask_durations,
            mask_percentages=req.mask_percentages,
            mask_numbers=req.mask_numbers,
        )

        analysis_id = str(uuid.uuid4())
        ANALYSIS_STORE[analysis_id] = results

        return {
            "status": "success",
            "analysis_id": analysis_id,
            "results": results
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Clustering execution error: {str(e)}")

@app.get("/api/results/{analysis_id}")
def get_analysis_results(analysis_id: str):
    if analysis_id not in ANALYSIS_STORE:
        raise HTTPException(status_code=404, detail="Analysis session not found.")
    return {"status": "success", "results": ANALYSIS_STORE[analysis_id]}

@app.get("/api/export/logs/{analysis_id}")
def export_clustered_logs_csv(analysis_id: str):
    """Exports dataset logs with assigned cluster IDs as CSV."""
    if analysis_id not in ANALYSIS_STORE:
        raise HTTPException(status_code=404, detail="Analysis session not found.")

    results = ANALYSIS_STORE[analysis_id]
    logs_data = results["logs"]
    df = pd.DataFrame(logs_data)

    stream = io.StringIO()
    df.to_csv(stream, index=False)

    response = Response(content=stream.getvalue(), media_type="text/csv")
    response.headers["Content-Disposition"] = f"attachment; filename=logcluster_results_{analysis_id[:8]}.csv"
    return response

@app.get("/api/export/clusters/{analysis_id}")
def export_clusters_summary_csv(analysis_id: str):
    """Exports summary of clusters and log pattern templates as CSV."""
    if analysis_id not in ANALYSIS_STORE:
        raise HTTPException(status_code=404, detail="Analysis session not found.")

    results = ANALYSIS_STORE[analysis_id]
    clusters = results["clusters"]
    
    summary_rows = []
    for c in clusters:
        summary_rows.append({
            "Cluster ID": c["cluster_id"],
            "Cluster Name": c["cluster_name"],
            "Is Outlier": c["is_outlier"],
            "Log Count": c["count"],
            "Percentage (%)": c["percentage"],
            "Pattern Template": c["pattern"],
            "Top Keywords": ", ".join(c["top_keywords"])
        })
    
    df_summary = pd.DataFrame(summary_rows)
    stream = io.StringIO()
    df_summary.to_csv(stream, index=False)

    response = Response(content=stream.getvalue(), media_type="text/csv")
    response.headers["Content-Disposition"] = f"attachment; filename=cluster_patterns_{analysis_id[:8]}.csv"
    return response

@app.get("/api/export/report/{analysis_id}")
def export_html_report(analysis_id: str):
    """Generates printable, executive HTML summary report."""
    if analysis_id not in ANALYSIS_STORE:
        raise HTTPException(status_code=404, detail="Analysis session not found.")

    res = ANALYSIS_STORE[analysis_id]
    metrics = res["metrics"]
    clusters = res["clusters"]
    rules = res.get("active_preprocessing_rules", [])

    rules_html = "".join([f'<span style="background:#0369a1; color:#e0f2fe; padding:4px 10px; border-radius:6px; font-size:12px; font-weight:600;">✓ {r}</span>' for r in rules])

    cluster_rows_html = ""
    for c in clusters:
        keywords = ", ".join(c['top_keywords']) if c['top_keywords'] else "N/A"
        samples = "<br>".join([f"• <code>{s}</code>" for s in c['sample_logs']])
        cluster_rows_html += f"""
        <tr>
            <td style="padding:10px; border-bottom: 1px solid #334155; font-weight:bold; color: #38bdf8;">{c['cluster_name']}</td>
            <td style="padding:10px; border-bottom: 1px solid #334155;">{c['count']} ({c['percentage']}%)</td>
            <td style="padding:10px; border-bottom: 1px solid #334155;"><code style="color:#a7f3d0; background:#064e3b; padding:2px 6px; border-radius:4px;">{c['pattern']}</code></td>
            <td style="padding:10px; border-bottom: 1px solid #334155; color:#cbd5e1;">{keywords}</td>
            <td style="padding:10px; border-bottom: 1px solid #334155; font-size:12px;">{samples}</td>
        </tr>
        """

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>LogCluster Analysis Report - {analysis_id[:8]}</title>
        <style>
            body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #0f172a; color: #f8fafc; margin: 0; padding: 40px; }}
            .card {{ background: #1e293b; border: 1px solid #334155; border-radius: 10px; padding: 24px; margin-bottom: 24px; }}
            h1 {{ color: #38bdf8; margin-top: 0; display:flex; align-items:center; gap:12px; }}
            .grid {{ display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }}
            .stat-box {{ background: #0f172a; padding: 16px; border-radius: 8px; border: 1px solid #334155; }}
            .stat-val {{ font-size: 24px; font-weight: bold; color: #38bdf8; }}
            .stat-lbl {{ font-size: 12px; color: #94a3b8; text-transform: uppercase; margin-top: 4px; }}
            table {{ width: 100%; border-collapse: collapse; margin-top: 16px; }}
            th {{ text-align: left; background: #0f172a; padding: 12px; color: #94a3b8; border-bottom: 2px solid #334155; }}
            code {{ font-family: monospace; }}
            @media print {{ body {{ background: white; color: black; }} .card {{ border: 1px solid #ccc; background: white; }} }}
        </style>
    </head>
    <body>
        <h1>LogCluster Pattern Analysis Report</h1>
        <div style="color: #94a3b8; margin-bottom: 20px;">Session ID: <b>{analysis_id}</b> | Algorithm: <b>{res['algorithm']}</b></div>
        
        <div class="grid">
            <div class="stat-box"><div class="stat-val">{res['total_logs']}</div><div class="stat-lbl">Total Logs Processed</div></div>
            <div class="stat-box"><div class="stat-val">{res['n_clusters']}</div><div class="stat-lbl">Discovered Clusters</div></div>
            <div class="stat-box"><div class="stat-val">{res['unique_patterns_count']}</div><div class="stat-lbl">Unique Templates</div></div>
            <div class="stat-box"><div class="stat-val">{metrics['silhouette_score'] if metrics['silhouette_score'] is not None else 'N/A'}</div><div class="stat-lbl">Silhouette Score</div></div>
        </div>

        <div class="card">
            <h2>Clustering Quality Metrics</h2>
            <p><b>Silhouette Score:</b> {metrics['silhouette_score'] if metrics['silhouette_score'] is not None else 'N/A'} (Higher is better, range -1 to +1)</p>
            <p><b>Davies-Bouldin Index:</b> {metrics['davies_bouldin_score'] if metrics['davies_bouldin_score'] is not None else 'N/A'} (Lower indicates better separation)</p>
            <p><b>Calinski-Harabasz Index:</b> {metrics['calinski_harabasz_score'] if metrics['calinski_harabasz_score'] is not None else 'N/A'} (Higher indicates denser clusters)</p>
        </div>

        <div class="card">
            <h2>Active Preprocessing & Variable Masking Rules</h2>
            <div style="display:flex; flex-wrap:wrap; gap:8px; margin-top:12px;">
                {rules_html}
            </div>
        </div>

        <div class="card">
            <h2>Discovered Log Patterns</h2>
            <table>
                <thead>
                    <tr>
                        <th>Cluster</th>
                        <th>Volume</th>
                        <th>Log Pattern Template</th>
                        <th>Keywords</th>
                        <th>Representative Examples</th>
                    </tr>
                </thead>
                <tbody>
                    {cluster_rows_html}
                </tbody>
            </table>
        </div>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content)
