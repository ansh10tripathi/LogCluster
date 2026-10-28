import React from 'react';
import { LayoutDashboard, Sliders, Layers, Search, FileText, Cpu, Server } from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, hasAnalysis }) {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'analyze', label: 'Analyze Logs', icon: Sliders },
    { id: 'clusters', label: 'Clusters', icon: Layers, badge: hasAnalysis ? 'Active' : null },
    { id: 'explorer', label: 'Log Explorer', icon: Search },
    { id: 'reports', label: 'Reports & Export', icon: FileText },
  ];

  return (
    <aside className="w-64 bg-[#0d1322] border-r border-[#1e293b] flex flex-col h-full shrink-0 select-none z-20">
      {/* Brand Header */}
      <div className="p-5 border-b border-[#1e293b] flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-emerald-400 p-0.5 flex items-center justify-center shadow-lg shadow-cyan-950/50">
          <div className="w-full h-full bg-[#0d1322] rounded-[10px] flex items-center justify-center">
            <Cpu className="w-5 h-5 text-cyan-400" />
          </div>
        </div>
        <div>
          <h1 className="font-bold text-slate-100 tracking-wide text-lg leading-none">LogCluster</h1>
          <span className="text-[11px] font-medium text-slate-400 tracking-wider uppercase">Unsupervised ML</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        <div className="px-3 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
          Navigation
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#151e32]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Engine Quick Info */}
      <div className="p-4 border-t border-[#1e293b]">
        <div className="bg-[#111827] rounded-xl p-3.5 border border-[#1f293d] space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <Server className="w-3.5 h-3.5 text-cyan-400" />
            <span>ML Engine Pipeline</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            TF-IDF Vectorization • K-Means • Agglomerative • DBSCAN • SVD 2D Projection
          </p>
        </div>
      </div>
    </aside>
  );
}
