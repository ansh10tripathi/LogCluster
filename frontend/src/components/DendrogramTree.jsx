import React from 'react';
import { GitMerge, Layers } from 'lucide-react';

export default function DendrogramTree({ clusters = [] }) {
  if (!clusters || clusters.length === 0) return null;

  return (
    <div className="bg-[#111827] border border-[#1f293d] rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <GitMerge className="w-4 h-4 text-cyan-400" />
            Hierarchical Linkage & Cluster Hierarchy
          </h3>
          <p className="text-xs text-slate-400">
            Dendrogram tree visualization representing agglomerative merge hierarchy based on pairwise TF-IDF cosine distance
          </p>
        </div>
      </div>

      <div className="overflow-x-auto p-4 bg-[#090d16] rounded-lg border border-[#1e293b]">
        <div className="min-w-[600px] flex items-center justify-between gap-6 py-2">
          {/* Root Link Node */}
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-cyan-950 border border-cyan-500 flex items-center justify-center text-cyan-400 font-bold text-xs shadow-lg">
              All
            </div>
            <span className="text-[10px] text-slate-500 mt-1">Root Dataset</span>
          </div>

          <div className="flex-1 h-[2px] bg-gradient-to-r from-cyan-500 via-emerald-500 to-purple-500"></div>

          {/* Cluster Leaf Nodes */}
          <div className="flex flex-col gap-3 flex-2">
            {clusters.map((c, i) => (
              <div key={i} className="flex items-center gap-3 bg-[#111827] border border-[#1f293d] p-2.5 rounded-lg">
                <div className="w-6 h-6 rounded-md bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold flex items-center justify-center">
                  C{c.cluster_id}
                </div>
                <div className="flex-1">
                  <div className="text-xs font-semibold text-slate-200 flex items-center justify-between">
                    <span>{c.cluster_name}</span>
                    <span className="text-[11px] text-slate-400">{c.count} logs ({c.percentage}%)</span>
                  </div>
                  <div className="text-[11px] font-mono text-emerald-400 truncate max-w-md">
                    {c.pattern}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
