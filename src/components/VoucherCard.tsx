import React from 'react';
import { HotspotUser, HotspotProfile } from '../types';
import { Wifi, Tag, Clock, CircleAlert } from 'lucide-react';

interface VoucherCardProps {
  key?: string | number;
  user: HotspotUser;
  profileObj?: HotspotProfile;
  dnsName?: string;
  hotspotName?: string;
}

export default function VoucherCard({ user, profileObj, dnsName = 'wifi.net', hotspotName = 'Mikhmon Hotspot' }: VoucherCardProps) {
  // Extract details from Profile Object or fallback to user comments
  const price = profileObj?.price || 3000;
  const validity = profileObj?.validity || '1 Hari';
  const rateLimit = profileObj?.rateLimit || '2 Mbps';

  // Format IDR Price
  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between text-xs w-full max-w-[280px] hover:border-sky-500/50 transition-all select-none print:bg-white print:border-slate-300 print:text-black shadow-md relative overflow-hidden group">
      {/* Top Banner overlay indicator */}
      <div className="absolute top-0 left-0 w-1.5 h-full bg-sky-500 group-hover:h-full transition-all print:hidden"></div>

      {/* Ticket Header */}
      <div className="flex justify-between items-center border-b border-slate-800/80 pb-2 mb-2 print:border-slate-300">
        <div className="flex items-center gap-1.5">
          <Wifi className="w-3.5 h-3.5 text-sky-400 print:text-sky-600" />
          <span className="font-extrabold tracking-wider text-[10px] text-white print:text-black uppercase truncate max-w-[130px]">
            {hotspotName}
          </span>
        </div>
        <span className="text-[10px] font-mono text-slate-500 print:text-slate-600">{dnsName}</span>
      </div>

      {/* Ticket Credentials */}
      <div className="my-2 space-y-2">
        {/* Code Voucher */}
        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-center relative print:bg-slate-100 print:border-slate-300">
          <span className="text-[9px] text-slate-500 uppercase font-bold tracking-widest block mb-0.5 print:text-slate-600">
            KODE HOTSPOT / VOUCHER
          </span>
          <span className="text-base font-extrabold text-sky-400 tracking-wider font-mono print:text-black">
            {user.name}
          </span>
          {user.password && user.password !== user.name && (
            <div className="mt-1 pt-1.5 border-t border-slate-800/50 flex justify-between items-center text-[10px] text-slate-400 print:text-slate-700 print:border-slate-300 font-mono">
              <span>Password:</span>
              <span className="font-bold text-white print:text-black">{user.password}</span>
            </div>
          )}
        </div>
      </div>

      {/* Ticket metadata prices & limits */}
      <div className="grid grid-cols-2 gap-1.5 text-[10px] mb-2 font-semibold">
        {/* Limit */}
        <div className="bg-slate-950/40 border border-slate-800/40 p-1.5 rounded-md flex items-center gap-1 print:border-slate-300 print:bg-slate-50">
          <Clock className="w-3.5 h-3.5 text-indigo-400 print:text-indigo-600 shrink-0" />
          <div className="truncate">
            <span className="text-[8px] text-slate-500 uppercase block leading-none">Masa Aktif</span>
            <span className="text-slate-300 print:text-black font-bold font-mono truncate">{validity}</span>
          </div>
        </div>

        {/* Speed */}
        <div className="bg-slate-950/40 border border-slate-800/40 p-1.5 rounded-md flex items-center gap-1 print:border-slate-300 print:bg-slate-50">
          <Tag className="w-3.5 h-3.5 text-emerald-400 print:text-emerald-600 shrink-0" />
          <div className="truncate">
            <span className="text-[8px] text-slate-500 uppercase block leading-none">Kecepatan</span>
            <span className="text-slate-300 print:text-black font-bold font-mono truncate">{rateLimit}</span>
          </div>
        </div>
      </div>

      {/* Footer Price Badge */}
      <div className="flex items-center justify-between border-t border-slate-800/80 pt-2 print:border-slate-300">
        <span className="text-[9px] font-bold text-slate-500 print:text-slate-600 uppercase">
          Mikhmon v3 Pro
        </span>
        <span className="px-2.5 py-1 bg-sky-500/15 border border-sky-500/30 rounded-md text-[11px] font-extrabold text-sky-400 font-mono print:bg-transparent print:border-black print:text-black">
          {price > 0 ? formatIDR(price) : 'GRATIS'}
        </span>
      </div>
    </div>
  );
}
