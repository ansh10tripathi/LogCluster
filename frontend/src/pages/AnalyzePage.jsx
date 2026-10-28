import React, { useState } from 'react';
import { Upload, Database, Sliders, Play, CheckCircle, Info, FileSpreadsheet } from 'lucide-react';
import { api } from '../api/client';

export default function AnalyzePage({ datasetInfo, setDatasetInfo, setAnalysisResults, setActiveTab }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);

  // Column Mappings
  const [messageCol, setMessageCol] = useState(datasetInfo?.detected_message_col || '');
  const [sourceCol, setSourceCol] = useState(datasetInfo?.detected_source_col || '');
  const [levelCol, setLevelCol] = useState(datasetInfo?.detected_level_col || '');
  const [deviceCol, setDeviceCol] = useState(datasetInfo?.detected_device_col || '');
  const [timestampCol, setTimestampCol] = useState(datasetInfo?.detected_timestamp_col || '');

  // ML Hyperparameters
  const [algorithm, setAlgorithm] = useState('kmeans');
  const [k, setK] = useState(6);
  const [eps, setEps] = useState(0.5);
  const [minSamples, setMinSamples] = useState(2);
  const [linkage, setLinkage] = useState('ward');
  const [metric, setMetric] = useState('euclidean');

  // Preprocessing Rules Flags
  const [maskTimestamps, setMaskTimestamps] = useState(true);
  const [maskUrls, setMaskUrls] = useState(true);
  const [maskEmails, setMaskEmails] = useState(true);
  const [maskMacs, setMaskMacs] = useState(true);
  const [maskIps, setMaskIps] = useState(true);
  const [maskPaths, setMaskPaths] = useState(true);
  const [maskDevices, setMaskDevices] = useState(true);
  const [maskHex, setMaskHex] = useState(true);
  const [maskHashes, setMaskHashes] = useState(true);
  const [maskDurations, setMaskDurations] = useState(true);
  const [maskPercentages, setMaskPercentages] = useState(true);
  const [maskNumbers, setMaskNumbers] = useState(true);

  // Handle File Upload
  const handleUpload = async (fileToUpload) => {
    if (!fileToUpload) return;
    setUploading(true);
    setError(null);
    try {
      const data = await api.uploadFile(fileToUpload);
      setDatasetInfo(data);
      setMessageCol(data.detected_message_col || data.columns[0]);
      setSourceCol(data.detected_source_col || '');
      setLevelCol(data.detected_level_col || '');
      setDeviceCol(data.detected_device_col || '');
      setTimestampCol(data.detected_timestamp_col || '');
    } catch (err) {
      setError(err.response?.data?.detail || 'File upload failed.');
    } finally {
      setUploading(false);
    }
  };

  // Handle Run Analysis
  const handleRunAnalysis = async () => {
    if (!datasetInfo) {
      setError('Please upload a file or load the sample dataset first.');
      return;
    }
    if (!messageCol) {
      setError('Please select the Log Message column.');
      return;
    }

    setAnalyzing(true);
    setError(null);

    try {
      const payload = {
        dataset_id: datasetInfo.dataset_id,
        message_col: messageCol,
        source_col: sourceCol || null,
        level_col: levelCol || null,
        device_col: deviceCol || null,
        timestamp_col: timestampCol || null,
        algorithm,
        k: parseInt(k, 10),
        eps: parseFloat(eps),
        min_samples: parseInt(minSamples, 10),
        linkage,
        metric,
        mask_timestamps: maskTimestamps,
        mask_urls: maskUrls,
        mask_emails: maskEmails,
        mask_macs: maskMacs,
        mask_ips: maskIps,
        mask_paths: maskPaths,
        mask_devices: maskDevices,
        mask_hex: maskHex,
        mask_hashes: maskHashes,
        mask_durations: maskDurations,
        mask_percentages: maskPercentages,
        mask_numbers: maskNumbers,
      };

      const res = await api.analyzeLogs(payload);
      setAnalysisResults(res.results);
      setActiveTab('clusters');
    } catch (err) {
      setError(err.response?.data?.detail || 'Clustering analysis failed.');
    } finally {
      setAnalyzing(false);
    }
  };

  // Explanations for algorithms
  const algoExplanations = {
    kmeans: 'K-Means partitions log TF-IDF vectors into K distinct clusters by minimizing variance within each cluster (sum-of-squares distance to centroid). Best when cluster count is known.',
    agglomerative: 'Agglomerative Clustering is a bottom-up hierarchical method that successively merges pairs of log vector clusters based on pairwise distance linkage criteria.',
    dbscan: 'DBSCAN groups dense regions of log messages together and automatically identifies sparse, isolated noise points as outliers (-1). Does not require pre-specifying K.',
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {error && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/50 text-rose-300 text-sm flex items-center gap-3">
          <Info className="w-5 h-5 text-rose-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Step 1: File Ingestion */}
      <div className="bg-[#111827] border border-[#1f293d] rounded-xl p-6 shadow-sm">
        <h3 className="text-base font-semibold text-slate-100 mb-1">1. Ingest Log Dataset</h3>
        <p className="text-xs text-slate-400 mb-4">Upload a log file (CSV, TXT, JSON) or use the built-in sample dataset.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* File Dropzone */}
          <div className="border-2 border-dashed border-[#24334d] hover:border-cyan-500/50 rounded-xl p-6 flex flex-col items-center justify-center text-center transition-all bg-[#090d16]/50">
            <Upload className="w-8 h-8 text-cyan-400 mb-2" />
            <p className="text-sm font-medium text-slate-200">Drag & drop log file here</p>
            <p className="text-xs text-slate-400 mb-3">Supports .csv, .txt, .json</p>
            <input
              type="file"
              accept=".csv,.txt,.json"
              onChange={(e) => {
                const f = e.target.files[0];
                if (f) {
                  setFile(f);
                  handleUpload(f);
                }
              }}
              className="hidden"
              id="log-file-input"
            />
            <label
              htmlFor="log-file-input"
              className="px-4 py-2 rounded-lg bg-[#1f293d] hover:bg-[#2d3b54] text-xs font-semibold text-slate-200 cursor-pointer transition-all"
            >
              {uploading ? 'Processing File...' : 'Browse Local File'}
            </label>
          </div>

          {/* Quick Dataset Summary / Status */}
          <div className="bg-[#090d16] border border-[#1e293b] rounded-xl p-5 flex flex-col justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Active Dataset Info</div>
              {datasetInfo ? (
                <div className="space-y-1.5 text-xs text-slate-300">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">File Name:</span>
                    <span className="font-semibold text-cyan-400">{datasetInfo.filename}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Total Rows:</span>
                    <span className="font-semibold text-emerald-400">{datasetInfo.total_rows} lines</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Detected Columns:</span>
                    <span className="font-mono text-[11px] text-slate-300">{datasetInfo.columns.join(', ')}</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500">No file loaded yet.</p>
              )}
            </div>

            {datasetInfo && (
              <div className="pt-3 border-t border-[#1e293b] flex items-center gap-2 text-xs text-emerald-400 font-semibold">
                <CheckCircle className="w-4 h-4" />
                <span>Dataset Ready for Column Mapping</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Step 2: Column Selection */}
      {datasetInfo && (
        <div className="bg-[#111827] border border-[#1f293d] rounded-xl p-6 shadow-sm">
          <h3 className="text-base font-semibold text-slate-100 mb-1">2. Map Dataset Schema Columns</h3>
          <p className="text-xs text-slate-400 mb-4">Select which column contains the raw log text message and metadata fields.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Log Message Column <span className="text-rose-400">*</span>
              </label>
              <select
                value={messageCol}
                onChange={(e) => setMessageCol(e.target.value)}
                className="w-full bg-[#090d16] border border-[#24334d] rounded-lg p-2.5 text-slate-200 focus:border-cyan-500 focus:outline-none"
              >
                {datasetInfo.columns.map((col) => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Source Column (Optional)</label>
              <select
                value={sourceCol}
                onChange={(e) => setSourceCol(e.target.value)}
                className="w-full bg-[#090d16] border border-[#24334d] rounded-lg p-2.5 text-slate-200 focus:border-cyan-500 focus:outline-none"
              >
                <option value="">None / Auto</option>
                {datasetInfo.columns.map((col) => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Severity/Level Column (Optional)</label>
              <select
                value={levelCol}
                onChange={(e) => setLevelCol(e.target.value)}
                className="w-full bg-[#090d16] border border-[#24334d] rounded-lg p-2.5 text-slate-200 focus:border-cyan-500 focus:outline-none"
              >
                <option value="">None / Auto</option>
                {datasetInfo.columns.map((col) => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Preprocessing & Variable Masking Rules */}
      {datasetInfo && (
        <div className="bg-[#111827] border border-[#1f293d] rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                <span>3. Preprocessing & Variable Masking Rules</span>
                <span className="text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded-full font-normal">
                  Universal Normalization
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Isolate static log signatures by masking dynamic variables into semantic tokens before TF-IDF vectorization.
              </p>
            </div>
            <div className="flex gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setMaskTimestamps(true); setMaskUrls(true); setMaskEmails(true); setMaskMacs(true);
                  setMaskIps(true); setMaskPaths(true); setMaskDevices(true); setMaskHex(true);
                  setMaskHashes(true); setMaskDurations(true); setMaskPercentages(true); setMaskNumbers(true);
                }}
                className="px-2.5 py-1 rounded bg-[#1e293b] hover:bg-[#27354f] text-[11px] text-cyan-400 transition-colors"
              >
                Enable All
              </button>
              <button
                type="button"
                onClick={() => {
                  setMaskTimestamps(false); setMaskUrls(false); setMaskEmails(false); setMaskMacs(false);
                  setMaskIps(false); setMaskPaths(false); setMaskDevices(false); setMaskHex(false);
                  setMaskHashes(false); setMaskDurations(false); setMaskPercentages(false); setMaskNumbers(false);
                }}
                className="px-2.5 py-1 rounded bg-[#1e293b] hover:bg-[#27354f] text-[11px] text-slate-400 hover:text-slate-200 transition-colors"
              >
                Clear All
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {[
              { id: 'ips', label: 'IP Addresses (IPv4/v6)', tag: '<IP>', val: maskIps, set: setMaskIps },
              { id: 'timestamps', label: 'Timestamps & Dates', tag: '<TIMESTAMP>', val: maskTimestamps, set: setMaskTimestamps },
              { id: 'numbers', label: 'Numbers & Ports', tag: '<NUM>, <PORT>', val: maskNumbers, set: setMaskNumbers },
              { id: 'devices', label: 'Network & Devices', tag: '<INTERFACE>, <DEV>', val: maskDevices, set: setMaskDevices },
              { id: 'paths', label: 'System File Paths', tag: '<PATH>', val: maskPaths, set: setMaskPaths },
              { id: 'urls', label: 'URLs & Queries', tag: '<URL>, <QUERY>', val: maskUrls, set: setMaskUrls },
              { id: 'hashes', label: 'Hashes & UUIDs', tag: '<UUID>, <HASH>', val: maskHashes, set: setMaskHashes },
              { id: 'hex', label: 'Hex & Memory Addrs', tag: '<HEX>', val: maskHex, set: setMaskHex },
              { id: 'durations', label: 'Durations & Latency', tag: '<DURATION>', val: maskDurations, set: setMaskDurations },
              { id: 'percentages', label: 'Percentages', tag: '<PCT>', val: maskPercentages, set: setMaskPercentages },
              { id: 'emails', label: 'Email Addresses', tag: '<EMAIL>', val: maskEmails, set: setMaskEmails },
              { id: 'macs', label: 'MAC Addresses', tag: '<MAC>', val: maskMacs, set: setMaskMacs },
            ].map(rule => (
              <label
                key={rule.id}
                className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer select-none transition-all ${
                  rule.val
                    ? 'bg-[#0f172a] border-cyan-500/40 text-slate-200 shadow-sm'
                    : 'bg-[#090d16] border-[#1e293b] text-slate-500 hover:border-[#2d3b54]'
                }`}
              >
                <input
                  type="checkbox"
                  checked={rule.val}
                  onChange={(e) => rule.set(e.target.checked)}
                  className="mt-0.5 accent-cyan-400 rounded cursor-pointer"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate">{rule.label}</div>
                  <div className="text-[10px] font-mono text-cyan-400/80 mt-0.5 truncate">{rule.tag}</div>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Step 4: Clustering Configuration */}
      {datasetInfo && (
        <div className="bg-[#111827] border border-[#1f293d] rounded-xl p-6 shadow-sm space-y-5">
          <div>
            <h3 className="text-base font-semibold text-slate-100 mb-1">4. Select Clustering Algorithm & Parameters</h3>
            <p className="text-xs text-slate-400">Configure unsupervised machine learning vector representation and hyperparameters.</p>
          </div>

          {/* Algorithm Selector Tabs */}
          <div className="flex gap-2 p-1 bg-[#090d16] border border-[#1e293b] rounded-xl">
            {[
              { id: 'kmeans', name: 'K-Means Clustering' },
              { id: 'agglomerative', name: 'Agglomerative (Hierarchical)' },
              { id: 'dbscan', name: 'DBSCAN (Density-Based)' },
            ].map((algo) => (
              <button
                key={algo.id}
                onClick={() => setAlgorithm(algo.id)}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                  algorithm === algo.id
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {algo.name}
              </button>
            ))}
          </div>

          {/* Explanation Box */}
          <div className="bg-[#090d16] border border-[#1e293b] rounded-lg p-3.5 flex items-start gap-3">
            <Info className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-slate-300 leading-relaxed">{algoExplanations[algorithm]}</p>
          </div>

          {/* Hyperparameters Controls */}
          <div className="bg-[#090d16] border border-[#1e293b] rounded-xl p-5 space-y-4">
            {(algorithm === 'kmeans' || algorithm === 'agglomerative') && (
              <div>
                <div className="flex justify-between items-center text-xs font-semibold text-slate-200 mb-1">
                  <span>Number of Clusters (K): <strong className="text-cyan-400">{k}</strong></span>
                  <span className="text-[10px] text-slate-400">Range: 2 - 15</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="15"
                  value={k}
                  onChange={(e) => setK(e.target.value)}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>
            )}

            {algorithm === 'agglomerative' && (
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Linkage Method</label>
                  <select
                    value={linkage}
                    onChange={(e) => setLinkage(e.target.value)}
                    className="w-full bg-[#111827] border border-[#24334d] rounded-lg p-2 text-slate-200"
                  >
                    <option value="ward">Ward (Variance Reduction)</option>
                    <option value="complete">Complete Linkage</option>
                    <option value="average">Average Linkage</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Distance Metric</label>
                  <select
                    value={metric}
                    onChange={(e) => setMetric(e.target.value)}
                    className="w-full bg-[#111827] border border-[#24334d] rounded-lg p-2 text-slate-200"
                  >
                    <option value="euclidean">Euclidean Distance</option>
                    <option value="cosine">Cosine Distance</option>
                  </select>
                </div>
              </div>
            )}

            {algorithm === 'dbscan' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <div className="flex justify-between items-center font-semibold text-slate-200 mb-1">
                    <span>Epsilon (eps): <strong className="text-cyan-400">{eps}</strong></span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="2.0"
                    step="0.05"
                    value={eps}
                    onChange={(e) => setEps(e.target.value)}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center font-semibold text-slate-200 mb-1">
                    <span>Min Samples: <strong className="text-cyan-400">{minSamples}</strong></span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={minSamples}
                    onChange={(e) => setMinSamples(e.target.value)}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Execution Button */}
          <div className="pt-2">
            <button
              onClick={handleRunAnalysis}
              disabled={analyzing}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-white font-bold text-sm transition-all shadow-lg shadow-cyan-950/50 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {analyzing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Vectorizing TF-IDF & Clustering...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Execute Cluster Analysis</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
