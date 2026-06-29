import React from 'react';
import { 
  Cpu, 
  Wifi, 
  Settings, 
  Terminal, 
  Users, 
  Globe, 
  LogOut, 
  RefreshCw,
  PlusCircle,
  TrendingUp,
  Network,
  DollarSign
} from 'lucide-react';
import { RouterConfig, SystemResources } from '../types';

interface SidebarProps {
  routers: RouterConfig[];
  activeRouter: RouterConfig;
  status: 'online' | 'offline' | 'connecting';
  statusMessage: string;
  resources: SystemResources | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onSelectRouter: (id: string) => void;
  onOpenNewRouterModal: () => void;
  onReconnect: () => void;
}

export default function Sidebar({
  routers,
  activeRouter,
  status,
  statusMessage,
  resources,
  activeTab,
  setActiveTab,
  onSelectRouter,
  onOpenNewRouterModal,
  onReconnect
}: SidebarProps) {
  return (
    <aside id="sidebar-nav" className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0">
      {/* Brand logo */}
      <div className="p-5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center font-bold text-slate-950 shadow-lg shadow-sky-500/20">
            <Network className="w-5 h-5 text-slate-950" />
          </div>
          <span className="text-lg font-extrabold tracking-tight text-white">
            MIKHMON <span className="text-sky-500">PRO</span>
          </span>
        </div>
        <button 
          onClick={onReconnect}
          disabled={status === 'connecting'}
          title="Refresh Connection"
          className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors disabled:opacity-40"
        >
          <RefreshCw className={`w-4 h-4 ${status === 'connecting' ? 'animate-spin text-sky-400' : ''}`} />
        </button>
      </div>

      {/* Router Selector Dropdown */}
      <div className="p-4 border-b border-slate-800">
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
          Sesi Mikrotik (Active Profile)
        </label>
        <div className="flex gap-2">
          <select
            id="router-selector"
            value={activeRouter.id}
            onChange={(e) => onSelectRouter(e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500 cursor-pointer"
          >
            {routers.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} {r.isSimulator ? '(Sim)' : ''}
              </option>
            ))}
          </select>
          <button
            id="add-router-btn"
            onClick={onOpenNewRouterModal}
            title="Tambah Sesi Router Baru"
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-sky-400 rounded-lg border border-slate-700 hover:text-white transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Navigation menu */}
      <nav id="nav-links" className="flex-1 p-4 space-y-1">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`w-full text-left p-2.5 rounded-lg flex items-center gap-3 px-4 font-medium text-xs transition-all ${
            activeTab === 'dashboard'
              ? 'bg-sky-500/10 text-sky-400 border-l-2 border-sky-500 shadow-sm'
              : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
          }`}
        >
          <TrendingUp className="w-4.5 h-4.5" />
          <span>Dashboard Analitik</span>
        </button>

        <button
          onClick={() => setActiveTab('hotspot')}
          className={`w-full text-left p-2.5 rounded-lg flex items-center gap-3 px-4 font-medium text-xs transition-all ${
            activeTab === 'hotspot'
              ? 'bg-sky-500/10 text-sky-400 border-l-2 border-sky-500 shadow-sm'
              : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
          }`}
        >
          <Wifi className="w-4.5 h-4.5" />
          <span>Hotspot & Voucher</span>
        </button>

        <button
          onClick={() => setActiveTab('sales')}
          className={`w-full text-left p-2.5 rounded-lg flex items-center gap-3 px-4 font-medium text-xs transition-all ${
            activeTab === 'sales'
              ? 'bg-sky-500/10 text-sky-400 border-l-2 border-sky-500 shadow-sm'
              : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
          }`}
        >
          <DollarSign className="w-4.5 h-4.5" />
          <span>Laporan Penjualan</span>
        </button>

        <button
          onClick={() => setActiveTab('pppoe')}
          className={`w-full text-left p-2.5 rounded-lg flex items-center gap-3 px-4 font-medium text-xs transition-all ${
            activeTab === 'pppoe'
              ? 'bg-sky-500/10 text-sky-400 border-l-2 border-sky-500 shadow-sm'
              : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
          }`}
        >
          <Globe className="w-4.5 h-4.5" />
          <span>PPPoE Clients</span>
        </button>

        <button
          onClick={() => setActiveTab('monitor')}
          className={`w-full text-left p-2.5 rounded-lg flex items-center gap-3 px-4 font-medium text-xs transition-all ${
            activeTab === 'monitor'
              ? 'bg-sky-500/10 text-sky-400 border-l-2 border-sky-500 shadow-sm'
              : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
          }`}
        >
          <Cpu className="w-4.5 h-4.5" />
          <span>Interface Real-time</span>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`w-full text-left p-2.5 rounded-lg flex items-center gap-3 px-4 font-medium text-xs transition-all ${
            activeTab === 'logs'
              ? 'bg-sky-500/10 text-sky-400 border-l-2 border-sky-500 shadow-sm'
              : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
          }`}
        >
          <Terminal className="w-4.5 h-4.5" />
          <span>Logs Router</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`w-full text-left p-2.5 rounded-lg flex items-center gap-3 px-4 font-medium text-xs transition-all ${
            activeTab === 'settings'
              ? 'bg-sky-500/10 text-sky-400 border-l-2 border-sky-500 shadow-sm'
              : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
          }`}
        >
          <Settings className="w-4.5 h-4.5" />
          <span>Pengaturan Sesi</span>
        </button>
      </nav>

      {/* Active Session Status Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/50">
        <div className="flex items-center gap-2 mb-1.5">
          <div className={`w-2.5 h-2.5 rounded-full ${
            status === 'online' 
              ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' 
              : status === 'connecting'
              ? 'bg-amber-500 animate-pulse'
              : 'bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'
          }`}></div>
          <span className={`text-[10px] font-bold uppercase tracking-widest ${
            status === 'online' 
              ? 'text-emerald-500' 
              : status === 'connecting'
              ? 'text-amber-500'
              : 'text-rose-500'
          }`}>
            {status === 'online' ? 'Connected' : status === 'connecting' ? 'Connecting...' : 'Disconnected'}
          </span>
        </div>
        <p className="text-[10px] text-slate-400 truncate font-semibold block" title={activeRouter.ip}>
          {activeRouter.name}
        </p>
        <p className="text-[9px] text-slate-500 font-mono mt-0.5 truncate">
          {activeRouter.ip}:{activeRouter.port}
        </p>
        {resources && status === 'online' && (
          <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[9px] text-slate-400">
            <span className="font-medium">OS: {resources.version.split(' ')[1] || 'ROS'}</span>
            <span className="font-medium">CPU: {resources.cpuLoad}%</span>
          </div>
        )}
      </div>
    </aside>
  );
}
