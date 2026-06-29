import React from 'react';
import { Network, Activity, ArrowUpRight, ArrowDownLeft, Ban, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { NetworkInterface } from '../types';

interface InterfaceTabProps {
  interfaces: NetworkInterface[];
  onRefresh: () => void;
}

export default function InterfaceTab({ interfaces, onRefresh }: InterfaceTabProps) {
  // Format Speed bits-per-second to readable string
  const formatSpeed = (bps: number) => {
    if (bps === 0) return '0 bps';
    const k = 1000;
    const sizes = ['bps', 'Kbps', 'Mbps', 'Gbps'];
    const i = Math.floor(Math.log(bps) / Math.log(k));
    return parseFloat((bps / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div id="interface-tab-content" className="space-y-6">
      <div className="flex justify-between items-center border-b border-slate-800 pb-3">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Network className="w-5 h-5 text-sky-400" />
            Interface Jaringan & Monitor Port
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Status port ethernet fisik dan jaringan wireless Mikrotik secara real-time.
          </p>
        </div>
        <button
          onClick={onRefresh}
          className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-semibold"
        >
          <RefreshCw className="w-4 h-4" />
          Perbarui Port
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {interfaces.map((iface) => {
          const isUp = iface.status === 'running';
          const isDisabled = iface.status === 'disabled';
          
          return (
            <div 
              key={iface.id} 
              className={`bg-slate-900 border rounded-2xl p-5 space-y-4 relative overflow-hidden group transition-all ${
                isUp 
                  ? 'border-slate-800/80 hover:border-sky-500/45' 
                  : 'border-slate-800/40 opacity-70'
              }`}
            >
              {/* Upper strip status indicator */}
              <div className={`absolute top-0 left-0 w-full h-1 ${
                isUp ? 'bg-emerald-500' : isDisabled ? 'bg-rose-500/40' : 'bg-slate-700'
              }`}></div>

              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                    <Network className="w-4.5 h-4.5 text-sky-400" />
                    {iface.name}
                  </h3>
                  <p className="text-[10px] text-slate-500 font-mono font-bold mt-0.5 uppercase">
                    Tipe: {iface.type}
                  </p>
                </div>
                
                <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-lg uppercase flex items-center gap-1 ${
                  isUp 
                    ? 'bg-emerald-500/15 text-emerald-400' 
                    : isDisabled 
                    ? 'bg-rose-500/15 text-rose-400' 
                    : 'bg-slate-800 text-slate-500'
                }`}>
                  {isUp ? (
                    <>
                      <CheckCircle className="w-3 h-3" />
                      Running
                    </>
                  ) : isDisabled ? (
                    <>
                      <Ban className="w-3 h-3" />
                      Disabled
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3 h-3" />
                      Link Down
                    </>
                  )}
                </span>
              </div>

              {/* Bandwidth meters dials */}
              <div className="grid grid-cols-2 gap-4">
                {/* RX Download */}
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/60 flex items-center gap-3">
                  <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                    <ArrowDownLeft className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 font-bold uppercase block">Receive (RX)</span>
                    <span className="font-bold text-slate-200 font-mono text-sm leading-tight block">
                      {formatSpeed(iface.rxRate)}
                    </span>
                  </div>
                </div>

                {/* TX Upload */}
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/60 flex items-center gap-3">
                  <div className="p-2 bg-sky-500/10 rounded-lg text-sky-400">
                    <ArrowUpRight className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 font-bold uppercase block">Transmit (TX)</span>
                    <span className="font-bold text-slate-200 font-mono text-sm leading-tight block">
                      {formatSpeed(iface.txRate)}
                    </span>
                  </div>
                </div>
              </div>

              {/* MAC details and visual graph simulator line */}
              <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                <span>MAC: {iface.macAddress || 'N/A'}</span>
                {isUp && (
                  <span className="text-emerald-500 flex items-center gap-1 font-sans font-bold uppercase text-[9px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                    Aktif Terhubung
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
