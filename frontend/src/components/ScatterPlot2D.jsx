import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const CLUSTER_COLORS = {
  '-1': '#f43f5e', // Outliers (Rose)
  '0': '#06b6d4',  // Cyan
  '1': '#10b981',  // Emerald
  '2': '#f59e0b',  // Amber
  '3': '#8b5cf6',  // Purple
  '4': '#ec4899',  // Pink
  '5': '#3b82f6',  // Blue
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const isOutlier = data.cluster_id === -1;
    const clusterName = isOutlier ? 'Outlier / Noise' : `Cluster ${data.cluster_id}`;
    const color = CLUSTER_COLORS[String(data.cluster_id)] || '#3b82f6';

    return (
      <div className="bg-[#0b101b]/95 backdrop-blur-md border border-slate-700/80 p-3.5 rounded-xl shadow-2xl text-xs max-w-sm space-y-2 z-50">
        <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: color }}></span>
            <span className="font-semibold text-slate-100">{clusterName}</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
            Log #{data.id}
          </span>
        </div>
        <p className="text-slate-200 line-clamp-3 font-mono text-[11px] bg-[#090d16] p-2 rounded-lg border border-slate-800/80 leading-relaxed break-all">
          {data.message}
        </p>
        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
          <span>Source: <strong className="text-cyan-300 font-medium">{data.source}</strong></span>
          <span>Level: <strong className="text-slate-200 font-medium">{data.level}</strong></span>
        </div>
      </div>
    );
  }
  return null;
};

export default function ScatterPlot2D({ points = [], algorithm }) {
  if (!points || points.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-500 text-sm">
        No 2D projection data available.
      </div>
    );
  }

  // Count discovered cluster IDs for the legend
  const uniqueClusterIds = Array.from(new Set(points.map(p => p.cluster_id))).sort((a, b) => a - b);

  return (
    <div className="bg-[#111827] border border-[#1f293d] rounded-2xl p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-100">2D Cluster Projection Scatter Plot</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            TruncatedSVD components mapping high-dimensional TF-IDF vectors to 2D space ({algorithm})
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {uniqueClusterIds.map((cid) => {
            const color = CLUSTER_COLORS[String(cid)] || '#3b82f6';
            const label = cid === -1 ? 'Outliers' : `Cluster ${cid}`;
            return (
              <div
                key={cid}
                className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#0b101b] border border-slate-800 text-[11px]"
              >
                <span className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: color }}></span>
                <span className="text-slate-300 font-medium">{label}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="h-72 w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 12, right: 12, bottom: 12, left: -10 }}>
            <CartesianGrid strokeDasharray="2 4" stroke="#1e293b" />
            <XAxis
              type="number"
              dataKey="x"
              name="SVD 1"
              stroke="#64748b"
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              axisLine={{ stroke: '#1e293b' }}
            />
            <YAxis
              type="number"
              dataKey="y"
              name="SVD 2"
              stroke="#64748b"
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              axisLine={{ stroke: '#1e293b' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Scatter name="Log Embeddings" data={points} fill="#06b6d4">
              {points.map((entry, index) => {
                const color = CLUSTER_COLORS[String(entry.cluster_id)] || '#3b82f6';
                return (
                  <Cell
                    key={`cell-${index}`}
                    fill={color}
                    r={entry.cluster_id === -1 ? 6 : 5}
                    opacity={0.88}
                    className="cursor-pointer hover:opacity-100 transition-opacity"
                  />
                );
              })}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
