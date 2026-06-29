import React, { useState } from 'react';
import { 
  Users, 
  Globe, 
  Cpu, 
  CircleDollarSign,
  Activity,
  HardDrive,
  Clock,
  Info,
  Server,
  Zap,
  Terminal
} from 'lucide-react';
import { SystemResources, DashboardStats, NetworkInterface, RouterLog } from '../types';
import TrafficChart from './TrafficChart';

interface DashboardTabProps {
  stats: DashboardStats | null;
  resources: SystemResources | null;
  interfaces: NetworkInterface[];
  logs: RouterLog[];
  trafficData: { time: string; rx: number; tx: number }[];
  onOpenCreateVoucher: () => void;
  onNavigateToTab: (tab: string) => void;
}

export default function DashboardTab({
  stats,
  resources,
  interfaces,
  logs,
  trafficData,
  onOpenCreateVoucher,
  onNavigateToTab
}: DashboardTabProps) {
  const [selectedInterface, setSelectedInterface] = useState<string>('ether1 (WAN)');

  // Formatter for Currency
  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);
  };

  // Formatter for Data Bytes
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Select running interface or fallback
  const runningIfaces = interfaces.filter(i => i.status === 'running');
  const activeIfaceName = selectedInterface || runningIfaces[0]?.name || 'ether1 (WAN)';

  return (
    <div id="dashboard-tab-content" className="space-y-6">
      {/* Top Welcome / Header panel */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            Selamat Datang di Mikhmon Winbox Dashboard v3 Pro
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Sistem manajemen terpadu hotspot voucher, konfigurasi PPPoE, dan monitoring real-time RouterOS Anda.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onNavigateToTab('settings')}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-semibold border border-slate-700 transition-all"
          >
            Sesi & Koneksi
          </button>
          <button
            onClick={onOpenCreateVoucher}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold transition-all shadow-lg shadow-sky-950/35"
          >
            + Buat Voucher
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Hotspot Active Card */}
        <div 
          onClick={() => onNavigateToTab('hotspot')}
          className="bg-slate-900 border border-slate-800 p-5 rounded-2xl hover:border-sky-500/40 transition-all cursor-pointer group"
        >
          <div className="flex justify-between items-start">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Hotspot Aktif</span>
            <div className="p-2 bg-sky-500/10 rounded-xl text-sky-400 group-hover:bg-sky-500 group-hover:text-slate-950 transition-colors">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">
              {stats?.activeHotspot ?? 0}
            </span>
            <span className="text-slate-500 text-xs font-medium">
              / {stats?.totalHotspotUsers ?? 0} total voucher
            </span>
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-[10px] text-sky-400 font-semibold uppercase">
            <span>Kelola Hotspot & Voucher</span>
          </div>
        </div>

        {/* PPPoE Online Card */}
        <div 
          onClick={() => onNavigateToTab('pppoe')}
          className="bg-slate-900 border border-slate-800 p-5 rounded-2xl hover:border-indigo-500/40 transition-all cursor-pointer group"
        >
          <div className="flex justify-between items-start">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">PPPoE Aktif</span>
            <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400 group-hover:bg-indigo-500 group-hover:text-slate-950 transition-colors">
              <Globe className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">
              {stats?.activePppoe ?? 0}
            </span>
            <span className="text-slate-500 text-xs font-medium">
              / {stats?.totalPppoeUsers ?? 0} pelanggan PPPoE
            </span>
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-[10px] text-indigo-400 font-semibold uppercase">
            <span>Kelola PPPoE & Profile</span>
          </div>
        </div>

        {/* CPU Load Metric */}
        <div 
          onClick={() => onNavigateToTab('monitor')}
          className="bg-slate-900 border border-slate-800 p-5 rounded-2xl hover:border-amber-500/40 transition-all cursor-pointer group"
        >
          <div className="flex justify-between items-start">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">CPU Load</span>
            <div className="p-2 bg-amber-500/10 rounded-xl text-amber-400 group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">
              {resources?.cpuLoad ?? 0}%
            </span>
            <span className={`text-xs font-bold uppercase ${
              (resources?.cpuLoad ?? 0) > 80 ? 'text-rose-500' : (resources?.cpuLoad ?? 0) > 40 ? 'text-amber-500' : 'text-emerald-500'
            }`}>
              {(resources?.cpuLoad ?? 0) > 80 ? 'Heavy Load' : (resources?.cpuLoad ?? 0) > 40 ? 'Moderate' : 'Healthy'}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-500 font-mono">
            <span>Model: {resources?.boardName || 'Mikrotik'}</span>
          </div>
        </div>

        {/* Income Today Metric */}
        <div 
          onClick={() => onNavigateToTab('hotspot')}
          className="bg-slate-900 border border-slate-800 p-5 rounded-2xl hover:border-emerald-500/40 transition-all cursor-pointer group"
        >
          <div className="flex justify-between items-start">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Pendapatan Hari Ini</span>
            <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-colors">
              <CircleDollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-white uppercase">
              {formatIDR(stats?.incomeToday ?? 0)}
            </span>
            <span className="text-[10px] text-slate-500 font-bold uppercase">
              {stats?.vouchersGeneratedToday ?? 0} vc baru
            </span>
          </div>
          <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-400 font-semibold uppercase">
            <span>Bulan ini: {formatIDR(stats?.incomeThisMonth ?? 0)}</span>
          </div>
        </div>
      </div>

      {/* Main Row: Interface Graph & System Resources details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Real-time Traffic graph selector & component */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Monitoring Interface Router</h3>
            <div className="flex gap-2">
              {interfaces.map(i => (
                <button
                  key={i.id}
                  onClick={() => setSelectedInterface(i.name)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
                    activeIfaceName === i.name
                      ? 'bg-sky-600/15 border-sky-500 text-sky-400'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  {i.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>
          <TrafficChart data={trafficData} interfaceName={activeIfaceName} />
        </div>

        {/* System Details Widget */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Server className="w-4 h-4 text-sky-400" />
              Status Sumber Daya
            </h3>
            {resources ? (
              <div className="space-y-4 text-xs">
                {/* Uptime */}
                <div className="flex items-center justify-between p-2.5 bg-slate-950/40 rounded-xl border border-slate-800/40">
                  <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                    <Clock className="w-3.5 h-3.5 text-sky-400" /> Uptime
                  </span>
                  <span className="text-white font-mono font-bold">{resources.uptime}</span>
                </div>

                {/* RAM details */}
                <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                      <Activity className="w-3.5 h-3.5 text-indigo-400" /> RAM Memory
                    </span>
                    <span className="text-white font-mono font-bold">
                      {formatBytes(resources.totalMemory - resources.freeMemory)} / {formatBytes(resources.totalMemory)}
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-indigo-500 h-full rounded-full transition-all duration-1000"
                      style={{ width: `${Math.min(100, ((resources.totalMemory - resources.freeMemory) / resources.totalMemory) * 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Storage HDD details */}
                <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                      <HardDrive className="w-3.5 h-3.5 text-emerald-400" /> Hard Disk (HDD)
                    </span>
                    <span className="text-white font-mono font-bold">
                      {formatBytes(resources.totalDisk - resources.freeDisk)} / {formatBytes(resources.totalDisk)}
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-full rounded-full transition-all duration-1000"
                      style={{ width: `${Math.min(100, ((resources.totalDisk - resources.freeDisk) / resources.totalDisk) * 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Specs */}
                <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-950/20 p-2.5 rounded-lg border border-slate-800/20">
                  <div>
                    <span className="text-slate-500 block uppercase font-bold text-[9px]">Platform</span>
                    <span className="text-slate-200 font-semibold">{resources.boardName}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block uppercase font-bold text-[9px]">Suhu Board</span>
                    <span className="text-slate-200 font-semibold">{resources.temperature ? `${resources.temperature} °C` : 'N/A'}</span>
                  </div>
                  <div className="mt-1">
                    <span className="text-slate-500 block uppercase font-bold text-[9px]">Frekuensi CPU</span>
                    <span className="text-slate-200 font-semibold">{resources.cpuFrequency} MHz</span>
                  </div>
                  <div className="mt-1">
                    <span className="text-slate-500 block uppercase font-bold text-[9px]">Voltase Input</span>
                    <span className="text-slate-200 font-semibold">{resources.voltage ? `${resources.voltage} V` : 'N/A'}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500 text-xs">
                Mencoba mengambil informasi sistem...
              </div>
            )}
          </div>
          <div className="border-t border-slate-800/60 pt-3 mt-3 flex items-center gap-2 text-[10px] text-sky-400 font-semibold uppercase justify-center">
            <Zap className="w-3.5 h-3.5" />
            Mikrotik API Connection v7 REST
          </div>
        </div>
      </div>

      {/* Bottom: Router Active System Logs */}
      <div id="router-logs" className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            Catatan Log Router Terkini
          </h3>
          <span className="text-[10px] text-slate-500 font-mono">Real-time update</span>
        </div>
        <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3 h-52 overflow-y-auto font-mono text-[11px] space-y-2 select-text scrollbar-thin">
          {logs.slice().reverse().map((log) => {
            const isHotspot = log.topics.includes('hotspot');
            const isPppoe = log.topics.includes('pppoe');
            const isError = log.topics.includes('error') || log.topics.includes('warning');
            const isDhcp = log.topics.includes('dhcp');

            let topicColor = 'text-slate-400 bg-slate-800/60';
            if (isHotspot) topicColor = 'text-sky-400 bg-sky-950/40';
            else if (isPppoe) topicColor = 'text-indigo-400 bg-indigo-950/40';
            else if (isError) topicColor = 'text-rose-400 bg-rose-950/40';
            else if (isDhcp) topicColor = 'text-amber-400 bg-amber-950/40';

            return (
              <div key={log.id} className="flex items-start gap-2.5 leading-relaxed hover:bg-slate-900/40 p-1 rounded transition-colors">
                <span className="text-slate-500 select-none font-bold shrink-0">{log.time}</span>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase font-sans shrink-0 ${topicColor}`}>
                  {log.topics[0] || 'info'}
                </span>
                <span className="text-slate-300 break-all">{log.message}</span>
              </div>
            );
          })}
          {logs.length === 0 && (
            <div className="text-center py-12 text-slate-600">
              Belum ada logs terkini dari Router.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
