import React, { useState } from 'react';
import { Search, Filter, ChevronLeft, ChevronRight, Layers, FileText } from 'lucide-react';

export default function ExplorerPage({ results }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [clusterFilter, setClusterFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  if (!results) {
    return (
      <div className="p-8 text-center text-slate-400">
        No log analysis available. Please run an analysis on the Analyze tab to explore logs.
      </div>
    );
  }

  const { logs, clusters } = results;

  // Filter logic
  const filteredLogs = logs.filter((l) => {
    // Cluster filter
    if (clusterFilter !== 'ALL' && String(l.cluster_id) !== String(clusterFilter)) {
      return false;
    }
    // Severity filter
    if (severityFilter !== 'ALL' && String(l.level).toUpperCase() !== String(severityFilter).toUpperCase()) {
      return false;
    }
    // Text search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const msg = String(l.message || '').toLowerCase();
      const src = String(l.source || '').toLowerCase();
      return msg.includes(term) || src.includes(term);
    }
    return true;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredLogs.length / pageSize) || 1;
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Unique severity levels in logs
  const severityLevels = Array.from(new Set(logs.map(l => l.level).filter(Boolean)));

  return (
    <div className="space-y-5">
      {/* Search & Filter Toolbar */}
      <div className="bg-[#111827] border border-[#1f293d] rounded-xl p-4 flex flex-wrap items-center gap-4 shadow-sm">
        {/* Text Search Box */}
        <div className="flex-1 min-w-[240px] relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search log messages by keyword..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-[#090d16] border border-[#24334d] rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Cluster Filter */}
        <div className="flex items-center gap-2 text-xs">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={clusterFilter}
            onChange={(e) => {
              setClusterFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-[#090d16] border border-[#24334d] rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Clusters</option>
            {clusters.map((c) => (
              <option key={c.cluster_id} value={c.cluster_id}>
                {c.cluster_name} ({c.count})
              </option>
            ))}
          </select>
        </div>

        {/* Severity Filter */}
        {severityLevels.length > 0 && (
          <div className="flex items-center gap-2 text-xs">
            <select
              value={severityFilter}
              onChange={(e) => {
                setSeverityFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-[#090d16] border border-[#24334d] rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Severity Levels</option>
              {severityLevels.map((lvl) => (
                <option key={lvl} value={lvl}>{lvl}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Datatable */}
      <div className="bg-[#111827] border border-[#1f293d] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#090d16] text-slate-400 uppercase text-[10px] tracking-wider border-b border-[#1e293b]">
              <tr>
                <th className="py-3 px-4">Cluster ID</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Source</th>
                <th className="py-3 px-4">Level</th>
                <th className="py-3 px-4">Log Message</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e293b] text-slate-300">
              {paginatedLogs.length > 0 ? (
                paginatedLogs.map((row, idx) => (
                  <tr key={idx} className="hover:bg-[#151e32] transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold border ${
                        row.cluster_id === -1
                          ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                          : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                      }`}>
                        {row.cluster_id === -1 ? 'Outlier' : `Cluster ${row.cluster_id}`}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-slate-400">
                      {row.timestamp || 'N/A'}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-200">
                      {row.source || 'N/A'}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-semibold">
                      <span className={`px-2 py-0.5 rounded text-[10px] ${
                        row.level === 'FATAL' || row.level === 'CRITICAL' ? 'bg-rose-950 text-rose-400 border border-rose-800/40' :
                        row.level === 'ERROR' ? 'bg-red-950 text-red-400 border border-red-800/40' :
                        row.level === 'WARN' ? 'bg-amber-950 text-amber-400 border border-amber-800/40' :
                        'bg-emerald-950 text-emerald-400 border border-emerald-800/40'
                      }`}>
                        {row.level || 'INFO'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-200 leading-relaxed max-w-xl break-all">
                      {row.message}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-500">
                    No log records match your filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-4 bg-[#090d16] border-t border-[#1e293b] flex items-center justify-between text-xs text-slate-400">
          <div>
            Showing <strong>{filteredLogs.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}</strong> to <strong>{Math.min(currentPage * pageSize, filteredLogs.length)}</strong> of <strong>{filteredLogs.length}</strong> entries
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg bg-[#111827] border border-[#24334d] hover:bg-[#1f293d] disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span>Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong></span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg bg-[#111827] border border-[#24334d] hover:bg-[#1f293d] disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
