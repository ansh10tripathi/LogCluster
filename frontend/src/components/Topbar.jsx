import React from 'react';
import { Database, Play, CheckCircle2, AlertCircle } from 'lucide-react';

export default function Topbar({ activeTab, onQuickSample, isSampleLoading, datasetInfo, analysisResults }) {
  const titles = {
    overview: 'Executive Dashboard & Metrics',
    analyze: 'Log Parsing & Clustering Engine',
    clusters: 'Discovered Pattern Groups & 2D Projection',
    explorer: 'Interactive Log Table Explorer',
    reports: 'Analysis Reports & Export Downloads',
  };

  return (
    <header className="h-16 bg-[#0d1322]/80 backdrop-blur-md border-b border-[#1e293b] px-6 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold text-slate-100">{titles[activeTab] || 'Dashboard'}</h2>
        {datasetInfo && (
          <span className="text-xs px-2.5 py-1 rounded-md bg-[#162032] text-cyan-300 border border-[#24334d]">
            {datasetInfo.filename || 'Dataset Active'} ({datasetInfo.total_rows} lines)
          </span>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Dataset Status Indicator */}
        {analysisResults ? (
          <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800/50 px-3 py-1.5 rounded-lg">
            <CheckCircle2 className="w-4 h-4" />
            <span>Analyzed ({analysisResults.algorithm})</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-950/40 border border-amber-800/50 px-3 py-1.5 rounded-lg">
            <AlertCircle className="w-4 h-4" />
            <span>No active analysis</span>
          </div>
        )}

        {/* Quick Sample Button */}
        <button
          onClick={onQuickSample}
          disabled={isSampleLoading}
          className="flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition-all shadow-md shadow-cyan-950/40 disabled:opacity-50"
        >
          <Database className="w-3.5 h-3.5" />
          <span>{isSampleLoading ? 'Loading Sample...' : 'Load Sample Data'}</span>
        </button>
      </div>
    </header>
  );
}
