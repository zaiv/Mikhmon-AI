import React, { useState, useMemo } from 'react';
import { Terminal, Search, Download, Trash2, Filter, RefreshCw } from 'lucide-react';
import { RouterLog } from '../types';

interface LogsTabProps {
  logs: RouterLog[];
  onRefresh: () => void;
}

export default function LogsTab({ logs, onRefresh }: LogsTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('all');

  // Compute unique topics list
  const uniqueTopics = useMemo(() => {
    const set = new Set<string>();
    logs.forEach(l => {
      l.topics.forEach(t => set.add(t));
    });
    return Array.from(set);
  }, [logs]);

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return logs.filter(l => {
      const matchesSearch = l.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            l.topics.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesTopic = selectedTopic === 'all' || l.topics.includes(selectedTopic);
      return matchesSearch && matchesTopic;
    });
  }, [logs, searchQuery, selectedTopic]);

  // Export logs to txt file helper
  const handleDownloadLogs = () => {
    if (filteredLogs.length === 0) return;
    const content = filteredLogs
      .map(l => `[${l.time}] [${l.topics.join(',')}] ${l.message}`)
      .join('\r\n');
    
    const element = document.createElement('a');
    const file = new Blob([content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `router_logs_${Date.now()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div id="logs-tab-content" className="space-y-6">
      <div className="flex justify-between items-center border-b border-slate-800 pb-3">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Terminal className="w-5 h-5 text-sky-400" />
            Catatan Sesi Jaringan (Log Audit)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Riwayat log terperinci dari RouterOS untuk audit keamanan, DHCP, hotspot, dan pppoe.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
            title="Refresh Logs"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleDownloadLogs}
            disabled={filteredLogs.length === 0}
            className="px-4 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-all disabled:opacity-40"
          >
            <Download className="w-4 h-4 text-sky-400" />
            Unduh Berkas Log
          </button>
        </div>
      </div>

      {/* FILTER CONTROLS */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search query input */}
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Cari pesan log atau topik..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
          />
        </div>

        {/* Topic filter dropdown */}
        <div>
          <select
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
          >
            <option value="all">Semua Kategori Topik</option>
            {uniqueTopics.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      {/* LOG TERMINAL BOX */}
      <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 font-mono text-[11px] h-[500px] overflow-y-auto space-y-2.5 select-text scrollbar-thin">
        {filteredLogs.slice().reverse().map((log) => {
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
            <div key={log.id} className="flex items-start gap-2.5 leading-relaxed hover:bg-slate-900/30 p-1 rounded transition-colors border-b border-slate-900/40 pb-1.5">
              <span className="text-slate-500 select-none font-bold shrink-0">{log.time}</span>
              <div className="flex gap-1 shrink-0 uppercase font-sans text-[8px] font-extrabold">
                {log.topics.map((t, i) => (
                  <span key={i} className={`px-1.5 py-0.5 rounded ${topicColor}`}>
                    {t}
                  </span>
                ))}
              </div>
              <span className="text-slate-200 break-all">{log.message}</span>
            </div>
          );
        })}
        {filteredLogs.length === 0 && (
          <div className="text-center py-24 text-slate-600">
            Tidak ada catatan log yang sesuai kriteria pencarian Anda.
          </div>
        )}
      </div>
    </div>
  );
}
