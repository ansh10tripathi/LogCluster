import React, { useState } from 'react';
import MetricCard from '../components/MetricCard';
import { Database, Layers, FileText, AlertTriangle, ArrowRight, BarChart3, PieChart as PieIcon, ShieldAlert } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';

const CLUSTER_COLORS = ['#06b6d4', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#3b82f6'];

const SEVERITY_CONFIG = {
  FATAL: { color: '#e11d48', label: 'FATAL' },
  CRITICAL: { color: '#f43f5e', label: 'CRITICAL' },
  ERROR: { color: '#f97316', label: 'ERROR' },
  WARN: { color: '#eab308', label: 'WARN' },
  INFO: { color: '#06b6d4', label: 'INFO' },
  SECURITY: { color: '#a855f7', label: 'SECURITY' },
};

// Custom Tooltip for Bar Chart
const CustomBarTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-[#0b101b]/95 backdrop-blur-md border border-slate-700/80 p-3 rounded-xl shadow-2xl text-xs space-y-1.5 min-w-[160px]">
        <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
          <span className="font-semibold text-cyan-400">{data.name}</span>
          <span className="text-[10px] text-slate-400">{data.percentage}%</span>
        </div>
        <div className="flex justify-between items-center text-slate-300 font-mono text-[11px]">
          <span>Log Count:</span>
          <span className="font-bold text-white">{data.count}</span>
        </div>
      </div>
    );
  }
  return null;
};

// Custom Tooltip for Donut Pie Chart
const CustomPieTooltip = ({ active, payload, totalLogs }) => {
  if (active && payload && payload.length) {
    const { name, value } = payload[0];
    const cfg = SEVERITY_CONFIG[name] || { color: '#06b6d4' };
    const pct = totalLogs > 0 ? ((value / totalLogs) * 100).toFixed(1) : 0;
    return (
      <div className="bg-[#0b101b]/95 backdrop-blur-md border border-slate-700/80 p-3 rounded-xl shadow-2xl text-xs space-y-1.5 min-w-[150px]">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-1.5">
          <span className="w-2.5 h-2.5 rounded-full shadow-sm shrink-0" style={{ backgroundColor: cfg.color }}></span>
          <span className="font-semibold text-slate-100">{name}</span>
        </div>
        <div className="flex justify-between items-center text-slate-300 font-mono text-[11px]">
          <span>Count: <strong className="text-white">{value}</strong></span>
          <span className="text-slate-400">({pct}%)</span>
        </div>
      </div>
    );
  }
  return null;
};

// Formats log pattern tokens (<IP>, <PORT>, etc.) as modern inline chips
const renderPatternWithHighlights = (pattern) => {
  if (!pattern) return <span className="text-slate-500 italic">No template extracted</span>;
  const parts = pattern.split(/(<[A-Z_]+>)/g);
  return (
    <span className="font-mono text-[11px] leading-relaxed break-words">
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
        return <span key={idx} className="text-slate-300">{part}</span>;
      })}
    </span>
  );
};

export default function OverviewPage({ results, datasetInfo, onNavigateAnalyze, onQuickSample, isSampleLoading, apiError }) {
  const [hoveredSlice, setHoveredSlice] = useState(null);

  if (!results) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-cyan-950/50 border border-cyan-500/30 flex items-center justify-center mb-4 text-cyan-400 shadow-lg shadow-cyan-950/30">
          <Layers className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-100 mb-2">No Log Analysis Loaded Yet</h3>
        <p className="text-slate-400 max-w-md text-sm mb-6 leading-relaxed">
          Upload a custom CSV, TXT, or JSON log file or load the sample heterogeneous dataset to automatically group log lines into cluster patterns.
        </p>

        {apiError && (
          <div className="max-w-lg w-full mb-6 p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-left shadow-lg shadow-rose-950/20">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-rose-300">Backend Server Error</p>
                <p className="text-xs text-rose-200/80 mt-1">{apiError}</p>
                <div className="mt-2.5 p-2 bg-[#090d16] rounded border border-rose-900/50 text-[11px] font-mono text-slate-300">
                  cd backend<br />
                  python -m uvicorn main:app --port 8000 --reload
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-4">
          <button
            onClick={onQuickSample}
            disabled={isSampleLoading}
            className="px-5 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-semibold text-sm transition-all shadow-md shadow-cyan-950/50 flex items-center gap-2"
          >
            {isSampleLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                <span>Loading Dataset...</span>
              </>
            ) : (
              <span>Load Sample Dataset</span>
            )}
          </button>
          <button
            onClick={onNavigateAnalyze}
            className="px-5 py-2.5 rounded-lg bg-[#111827] hover:bg-[#1f293d] border border-[#1f293d] text-slate-200 font-semibold text-sm transition-all flex items-center gap-2"
          >
            <span>Upload Custom Logs</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  const { total_logs, n_clusters, unique_patterns_count, n_outliers, clusters, algorithm } = results;

  const clusterChartData = clusters.map(c => ({
    name: c.cluster_name,
    count: c.count,
    percentage: c.percentage,
  }));

  // Aggregated level breakdown if available
  const levelCounts = {};
  clusters.forEach(c => {
    if (c.levels) {
      Object.entries(c.levels).forEach(([lvl, count]) => {
        levelCounts[lvl] = (levelCounts[lvl] || 0) + count;
      });
    }
  });

  // Priority order for levels in display
  const LEVEL_ORDER = ['FATAL', 'CRITICAL', 'ERROR', 'WARN', 'SECURITY', 'INFO'];
  const pieData = Object.entries(levelCounts)
    .sort((a, b) => {
      const idxA = LEVEL_ORDER.indexOf(a[0]);
      const idxB = LEVEL_ORDER.indexOf(b[0]);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      return b[1] - a[1];
    })
    .map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Logs Processed"
          value={total_logs.toLocaleString()}
          subtext={`Dataset: ${datasetInfo ? datasetInfo.filename : 'Active'}`}
          icon={Database}
          color="cyan"
        />
        <MetricCard
          title="Discovered Clusters"
          value={n_clusters}
          subtext={`Algorithm: ${algorithm}`}
          icon={Layers}
          color="emerald"
        />
        <MetricCard
          title="Unique Log Templates"
          value={unique_patterns_count}
          subtext="Normalized patterns"
          icon={FileText}
          color="purple"
        />
        <MetricCard
          title="Detected Outliers"
          value={n_outliers}
          subtext={n_outliers > 0 ? `${n_outliers} isolated noise events` : "No isolated noise"}
          icon={AlertTriangle}
          color={n_outliers > 0 ? "rose" : "amber"}
        />
      </div>

      {/* Visualizations Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cluster Volume Bar Chart */}
        <div className="lg:col-span-2 bg-[#111827] border border-[#1f293d] rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-cyan-400" />
                Cluster Volume Distribution
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Distribution of log volume across discovered cluster groups</p>
            </div>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-800/40 text-cyan-400 font-medium">
              {clusters.length} Groups
            </span>
          </div>

          <div className="h-60 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={clusterChartData} margin={{ top: 12, right: 12, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={{ stroke: '#1e293b' }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={{ stroke: '#1e293b' }} />
                <Tooltip content={<CustomBarTooltip />} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {clusterChartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={CLUSTER_COLORS[index % CLUSTER_COLORS.length]}
                      className="hover:opacity-80 transition-opacity cursor-pointer"
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Severity Distribution Donut Chart */}
        <div className="bg-[#111827] border border-[#1f293d] rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div className="mb-2">
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-emerald-400" />
              Log Severity Breakdown
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Proportion across severity levels</p>
          </div>

          {pieData.length > 0 ? (
            <div className="flex flex-col justify-between h-full pt-1">
              {/* Donut Chart with Center Metric */}
              <div className="relative h-44 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={68}
                      innerRadius={48}
                      paddingAngle={3}
                      onMouseEnter={(_, index) => setHoveredSlice(pieData[index])}
                      onMouseLeave={() => setHoveredSlice(null)}
                    >
                      {pieData.map((entry, index) => {
                        const cfg = SEVERITY_CONFIG[entry.name] || { color: '#06b6d4' };
                        return (
                          <Cell
                            key={`cell-${index}`}
                            fill={cfg.color}
                            stroke="#111827"
                            strokeWidth={2}
                            className="hover:opacity-80 transition-opacity cursor-pointer"
                          />
                        );
                      })}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip totalLogs={total_logs} />} />
                  </PieChart>
                </ResponsiveContainer>

                {/* Central Stat Badge inside Donut */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  {hoveredSlice ? (
                    <>
                      <span className="text-lg font-bold text-white font-mono">{hoveredSlice.value}</span>
                      <span className="text-[10px] text-slate-300 font-semibold uppercase tracking-wider">{hoveredSlice.name}</span>
                    </>
                  ) : (
                    <>
                      <span className="text-lg font-bold text-slate-100 font-mono">{total_logs}</span>
                      <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Total</span>
                    </>
                  )}
                </div>
              </div>

              {/* Severity Legend Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 pt-2">
                {pieData.map((item) => {
                  const cfg = SEVERITY_CONFIG[item.name] || { color: '#06b6d4' };
                  const pct = total_logs > 0 ? ((item.value / total_logs) * 100).toFixed(0) : 0;
                  return (
                    <div
                      key={item.name}
                      onMouseEnter={() => setHoveredSlice(item)}
                      onMouseLeave={() => setHoveredSlice(null)}
                      className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-[#0b101b] border border-slate-800/90 hover:border-slate-700 transition-colors cursor-default"
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="w-2 h-2 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: cfg.color }}></span>
                        <span className="text-[11px] font-medium text-slate-300 truncate">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 font-mono text-[11px] ml-1">
                        <span className="text-slate-100 font-semibold">{item.value}</span>
                        <span className="text-slate-500 text-[10px]">({pct}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="h-56 flex items-center justify-center text-xs text-slate-500">
              No severity level column mapped.
            </div>
          )}
        </div>
      </div>

      {/* Top Discovered Patterns Overview Table */}
      <div className="bg-[#111827] border border-[#1f293d] rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" />
              Discovered Log Pattern Templates
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Static regex templates discovered after dynamic variable masking</p>
          </div>
          <span className="text-xs text-slate-400">
            Sorted by volume
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-[#1e293b]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#090d16] text-slate-400 uppercase text-[10px] tracking-wider border-b border-[#1e293b]">
              <tr>
                <th className="py-3 px-4 font-semibold">Cluster Group</th>
                <th className="py-3 px-4 font-semibold">Volume</th>
                <th className="py-3 px-4 font-semibold">Discovered Pattern Template</th>
                <th className="py-3 px-4 font-semibold">Top Discriminative Keywords</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e293b] text-slate-300">
              {clusters.map((c, i) => {
                const clusterColor = CLUSTER_COLORS[i % CLUSTER_COLORS.length];
                return (
                  <tr key={i} className="hover:bg-[#151e32]/70 transition-colors">
                    {/* Cluster Name */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: clusterColor }}></span>
                        <span className="font-semibold text-slate-200">{c.cluster_name}</span>
                      </div>
                    </td>

                    {/* Volume with visual bar */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 font-mono text-xs">
                          <span className="font-bold text-white">{c.count}</span>
                          <span className="text-slate-400 text-[11px]">({c.percentage}%)</span>
                        </div>
                        <div className="w-20 bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${Math.min(c.percentage * 2, 100)}%`, backgroundColor: clusterColor }}
                          ></div>
                        </div>
                      </div>
                    </td>

                    {/* Discovered Template with Tokens */}
                    <td className="py-3.5 px-4 max-w-xl">
                      <div className="bg-[#090d16] border border-[#1e293b] rounded-lg p-2.5">
                        {renderPatternWithHighlights(c.pattern)}
                      </div>
                    </td>

                    {/* Keywords */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1.5 max-w-xs">
                        {c.top_keywords && c.top_keywords.length > 0 ? (
                          c.top_keywords.slice(0, 4).map((kw, k) => (
                            <span
                              key={k}
                              className="bg-[#121a2b] hover:bg-[#1a253d] text-cyan-300 border border-cyan-800/40 px-2 py-0.5 rounded-md text-[10px] font-mono transition-colors"
                            >
                              #{kw}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-500 text-[11px]">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
