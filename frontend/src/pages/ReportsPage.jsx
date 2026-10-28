import React from 'react';
import MetricCard from '../components/MetricCard';
import { FileText, Download, Award, ShieldCheck, ExternalLink, HelpCircle } from 'lucide-react';
import { api } from '../api/client';

export default function ReportsPage({ results, datasetInfo }) {
  if (!results) {
    return (
      <div className="p-8 text-center text-slate-400">
        No active analysis to report on. Please run an analysis on the Analyze tab.
      </div>
    );
  }

  const { metrics, algorithm, total_logs, n_clusters, clusters } = results;
  const analysisId = results.analysis_id || 'sample_analysis';

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Export Action Card */}
      <div className="bg-[#111827] border border-[#1f293d] rounded-xl p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            Export Analysis & Patterns
          </h3>
          <p className="text-xs text-slate-400">
            Download processed log files with cluster assignments or print an executive summary report.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <a
            href={api.getLogsCsvUrl(analysisId)}
            download
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1f293d] hover:bg-[#2d3b54] text-xs font-semibold text-slate-200 border border-[#2b3a58] transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Clustered Logs (CSV)</span>
          </a>

          <a
            href={api.getClustersCsvUrl(analysisId)}
            download
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1f293d] hover:bg-[#2d3b54] text-xs font-semibold text-cyan-300 border border-cyan-500/30 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Cluster Patterns (CSV)</span>
          </a>

          <a
            href={api.getReportUrl(analysisId)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold text-white transition-all shadow-md shadow-cyan-950/50"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Print HTML Report</span>
          </a>
        </div>
      </div>

      {/* Evaluation Metrics Cards */}
      <div className="bg-[#111827] border border-[#1f293d] rounded-xl p-6 shadow-sm space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-400" />
            Unsupervised Evaluation Metrics
          </h3>
          <p className="text-xs text-slate-400">
            Internal clustering quality metrics evaluated on high-dimensional TF-IDF log vectors ({algorithm})
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard
            title="Silhouette Score"
            value={metrics.silhouette_score !== null ? metrics.silhouette_score : 'N/A'}
            subtext="Range [-1, +1]. Higher means well-separated clusters."
            icon={ShieldCheck}
            color="emerald"
          />
          <MetricCard
            title="Davies-Bouldin Index"
            value={metrics.davies_bouldin_score !== null ? metrics.davies_bouldin_score : 'N/A'}
            subtext="Lower score indicates better cluster separation."
            icon={ShieldCheck}
            color="cyan"
          />
          <MetricCard
            title="Calinski-Harabasz Index"
            value={metrics.calinski_harabasz_score !== null ? metrics.calinski_harabasz_score : 'N/A'}
            subtext="Higher score indicates denser, well-defined clusters."
            icon={ShieldCheck}
            color="purple"
          />
        </div>

        {metrics.explanation && (
          <div className="p-3 bg-[#090d16] border border-[#1e293b] rounded-lg text-xs text-slate-400 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>{metrics.explanation}</span>
          </div>
        )}
      </div>

      {/* Active Preprocessing Normalization Rules */}
      {results.active_preprocessing_rules && results.active_preprocessing_rules.length > 0 && (
        <div className="bg-[#111827] border border-[#1f293d] rounded-xl p-5 shadow-sm space-y-3">
          <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            <span>Applied Preprocessing Normalizations ({results.active_preprocessing_rules.length})</span>
          </h3>
          <div className="flex flex-wrap gap-2">
            {results.active_preprocessing_rules.map((rule, idx) => (
              <span key={idx} className="px-2.5 py-1 rounded-md bg-[#162032] border border-[#24334d] text-cyan-300 text-xs font-medium">
                ✓ {rule}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Cluster Patterns Summary Report Table */}
      <div className="bg-[#111827] border border-[#1f293d] rounded-xl p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-100 mb-3">Analysis Summary Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#090d16] text-slate-400 uppercase text-[10px] tracking-wider border-b border-[#1e293b]">
              <tr>
                <th className="py-2.5 px-3">Cluster</th>
                <th className="py-2.5 px-3">Log Count</th>
                <th className="py-2.5 px-3">Discovered Pattern Template</th>
                <th className="py-2.5 px-3">Keywords</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e293b] text-slate-300">
              {clusters.map((c, i) => (
                <tr key={i}>
                  <td className="py-3 px-3 font-semibold text-cyan-400">{c.cluster_name}</td>
                  <td className="py-3 px-3">{c.count} ({c.percentage}%)</td>
                  <td className="py-3 px-3 font-mono text-emerald-300 max-w-md truncate">{c.pattern}</td>
                  <td className="py-3 px-3 text-slate-400">{c.top_keywords.join(', ') || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
