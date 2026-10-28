import React, { useState } from 'react';
import { Layers, Tag, FileText, ChevronDown, ChevronUp, ExternalLink, ArrowRight } from 'lucide-react';

const renderPatternWithHighlights = (pattern) => {
  if (!pattern) return <span className="text-slate-500 italic">No general template extracted.</span>;
  const parts = pattern.split(/(<[A-Z_]+>)/g);
  return (
    <span className="font-mono text-xs leading-relaxed break-words">
      {parts.map((part, idx) => {
        if (part.startsWith('<') && part.endsWith('>')) {
          return (
            <span
              key={idx}
              className="inline-block mx-0.5 px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 font-semibold text-[10px]"
            >
              {part}
            </span>
          );
        }
        return <span key={idx} className="text-slate-200">{part}</span>;
      })}
    </span>
  );
};

export default function ClusterCard({ cluster, onInspect }) {
  const [expanded, setExpanded] = useState(false);

  const isOutlier = cluster.is_outlier;

  return (
    <div className={`bg-[#111827] border rounded-2xl p-5 shadow-sm transition-all flex flex-col justify-between ${
      isOutlier ? 'border-rose-500/40 bg-rose-950/10' : 'border-[#1f293d] hover:border-cyan-500/30'
    }`}>
      <div>
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm border shadow-sm ${
              isOutlier 
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' 
                : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
            }`}>
              {isOutlier ? '!' : `C${cluster.cluster_id}`}
            </div>
            <div>
              <h4 className="font-semibold text-slate-100 text-sm flex items-center gap-2">
                {cluster.cluster_name}
                {isOutlier && (
                  <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-full font-medium">
                    Unclustered Outliers
                  </span>
                )}
              </h4>
              <span className="text-xs text-slate-400">
                <strong className="text-slate-200 font-mono">{cluster.count}</strong> matching logs ({cluster.percentage}% volume)
              </span>
            </div>
          </div>

          {onInspect && (
            <button
              onClick={() => onInspect(cluster.cluster_id)}
              className="text-xs font-medium text-cyan-400 hover:text-cyan-300 bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-800/40 px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 shadow-sm shrink-0"
            >
              <span>Explore Logs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Discovered Pattern Template */}
        <div className="mb-4">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-emerald-400" />
            <span>Discovered Pattern Template</span>
          </div>
          <div className="bg-[#090d16] border border-[#1e293b] rounded-xl p-3 leading-relaxed">
            {renderPatternWithHighlights(cluster.pattern)}
          </div>
        </div>

        {/* Top Keywords */}
        {cluster.top_keywords && cluster.top_keywords.length > 0 && (
          <div className="mb-4">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-purple-400" />
              <span>Top TF-IDF Terms</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {cluster.top_keywords.map((kw, i) => (
                <span
                  key={i}
                  className="text-[11px] px-2.5 py-0.5 rounded-md bg-[#182235] text-purple-300 border border-[#2b3a58] font-mono"
                >
                  #{kw}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Expandable Sample Logs */}
      <div className="border-t border-[#1e293b] pt-3 mt-2">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between text-xs text-slate-400 hover:text-slate-200 transition-colors py-1"
        >
          <span>Sample Log Messages ({cluster.sample_logs ? cluster.sample_logs.length : 0})</span>
          {expanded ? <ChevronUp className="w-4 h-4 text-cyan-400" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {expanded && cluster.sample_logs && (
          <div className="mt-2.5 space-y-2">
            {cluster.sample_logs.map((log, idx) => (
              <div
                key={idx}
                className="bg-[#090d16] border border-[#1e293b] rounded-lg p-2.5 text-xs font-mono text-slate-300 break-all leading-relaxed"
              >
                {log}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
