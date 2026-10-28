import React, { useState } from 'react';
import ScatterPlot2D from '../components/ScatterPlot2D';
import DendrogramTree from '../components/DendrogramTree';
import ClusterCard from '../components/ClusterCard';
import { Layers, Search, X, Info } from 'lucide-react';

export default function ClustersPage({ results, setActiveTab }) {
  const [selectedClusterId, setSelectedClusterId] = useState(null);
  const [modalSearch, setModalSearch] = useState('');

  if (!results) {
    return (
      <div className="p-8 text-center text-slate-400">
        No active cluster analysis available. Please run an analysis on the Analyze tab.
      </div>
    );
  }

  const { clusters, scatter_points, algorithm, logs } = results;

  // Selected Cluster Logs for Modal
  const clusterLogs = selectedClusterId !== null
    ? logs.filter(l => l.cluster_id === selectedClusterId)
    : [];

  const filteredClusterLogs = clusterLogs.filter(l => {
    if (!modalSearch) return true;
    return JSON.stringify(l).toLowerCase().includes(modalSearch.toLowerCase());
  });

  return (
    <div className="space-y-6">
      {/* 2D Projection Scatter Chart */}
      <ScatterPlot2D points={scatter_points} algorithm={algorithm} />

      {/* Agglomerative Dendrogram Tree if applicable */}
      {(algorithm.includes('Agglomerative') || algorithm.includes('agglomerative')) && (
        <DendrogramTree clusters={clusters} />
      )}

      {/* Clusters Header & Summary */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            Discovered Cluster Groups ({clusters.length})
          </h3>
          <p className="text-xs text-slate-400">Representative log templates and top TF-IDF keywords discovered per group</p>
        </div>
      </div>

      {/* Cluster Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {clusters.map((c) => (
          <ClusterCard
            key={c.cluster_id}
            cluster={c}
            onInspect={(id) => setSelectedClusterId(id)}
          />
        ))}
      </div>

      {/* Inspect Cluster Logs Modal */}
      {selectedClusterId !== null && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-[#1f293d] rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#1e293b] flex items-center justify-between bg-[#0d1322]">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <span>Inspection: {selectedClusterId === -1 ? 'Outlier / Noise Group' : `Cluster #${selectedClusterId}`}</span>
                  <span className="text-xs bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded-full font-normal">
                    {clusterLogs.length} logs
                  </span>
                </h3>
              </div>
              <button
                onClick={() => setSelectedClusterId(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-[#1e293b] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Search Bar */}
            <div className="p-4 border-b border-[#1e293b] bg-[#090d16]">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Filter logs inside this cluster..."
                  value={modalSearch}
                  onChange={(e) => setModalSearch(e.target.value)}
                  className="w-full bg-[#111827] border border-[#24334d] rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Modal Logs Table */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {filteredClusterLogs.map((log, idx) => (
                <div key={idx} className="bg-[#090d16] border border-[#1e293b] rounded-lg p-3 text-xs space-y-1 font-mono">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-[#1e293b] pb-1">
                    <span>Source: <strong className="text-slate-200">{log.source || 'N/A'}</strong></span>
                    <span>Level: <strong className="text-emerald-400">{log.level || 'N/A'}</strong></span>
                    <span>Timestamp: <strong className="text-slate-300">{log.timestamp || 'N/A'}</strong></span>
                  </div>
                  <div className="text-slate-200 pt-1 leading-relaxed break-all">
                    {log.message || JSON.stringify(log)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
