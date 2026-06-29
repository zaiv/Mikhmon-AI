import React, { useState } from 'react';
import { 
  Settings, 
  PlusCircle, 
  Trash2, 
  Save, 
  Database, 
  Key, 
  Cpu, 
  HelpCircle,
  Wifi,
  Globe,
  Radio,
  CheckCircle,
  AlertCircle,
  FileText
} from 'lucide-react';
import { RouterConfig } from '../types';

interface SettingsTabProps {
  routers: RouterConfig[];
  activeRouter: RouterConfig;
  status: 'online' | 'offline' | 'connecting';
  statusMessage: string;
  onAddRouter: (router: Partial<RouterConfig>) => Promise<any>;
  onUpdateRouter: (id: string, router: Partial<RouterConfig>) => Promise<any>;
  onDeleteRouter: (id: string) => Promise<any>;
  onSelectRouter: (id: string) => void;
  onRefreshStatus: () => void;
}

// Helper to parse Mikhmon v3 PHP config files (config.php or session php files)
export const parseMikhmonPhp = (phpContent: string): Partial<RouterConfig>[] => {
  const routersList: Partial<RouterConfig>[] = [];
  // Strip single-line & multi-line comments
  const cleanContent = phpContent.replace(/\/\*[\s\S]*?\*\/|\/\/.*|#.*/g, '');
  
  // Find array blocks (array(...) or [...])
  const blocks = cleanContent.split(/(?:array\s*\(|\]\s*,|\)\s*,)/gi);
  
  for (const block of blocks) {
    const ipMatch = block.match(/['"]ip['"]\s*=>\s*['"]([^'"]*)['"]/i) || 
                    block.match(/['"]ip_r['"]\s*=>\s*['"]([^'"]*)['"]/i);
    if (ipMatch) {
      const ip = ipMatch[1];
      const usernameMatch = block.match(/['"]username['"]\s*=>\s*['"]([^'"]*)['"]/i) || 
                            block.match(/['"]user['"]\s*=>\s*['"]([^'"]*)['"]/i) ||
                            block.match(/['"]user_r['"]\s*=>\s*['"]([^'"]*)['"]/i);
      const passwordMatch = block.match(/['"]password['"]\s*=>\s*['"]([^'"]*)['"]/i) || 
                            block.match(/['"]pass['"]\s*=>\s*['"]([^'"]*)['"]/i) ||
                            block.match(/['"]pass_r['"]\s*=>\s*['"]([^'"]*)['"]/i);
      const hotspotMatch = block.match(/['"]hotspot['"]\s*=>\s*['"]([^'"]*)['"]/i) || 
                           block.match(/['"]hotspot_r['"]\s*=>\s*['"]([^'"]*)['"]/i);
      const dnsMatch = block.match(/['"]dns['"]\s*=>\s*['"]([^'"]*)['"]/i) || 
                       block.match(/['"]dns_r['"]\s*=>\s*['"]([^'"]*)['"]/i);
      const nameMatch = block.match(/['"]name['"]\s*=>\s*['"]([^'"]*)['"]/i) || 
                        block.match(/['"]session_name['"]\s*=>\s*['"]([^'"]*)['"]/i) ||
                        block.match(/['"]md5_r['"]\s*=>\s*['"]([^'"]*)['"]/i);
      const portMatch = block.match(/['"]port['"]\s*=>\s*['"]([^'"]*)['"]/i) || 
                        block.match(/['"]port_r['"]\s*=>\s*['"]([^'"]*)['"]/i);

      routersList.push({
        ip,
        username: usernameMatch ? usernameMatch[1] : 'admin',
        password: passwordMatch ? passwordMatch[1] : '',
        hotspotName: hotspotMatch ? hotspotMatch[1] : 'hotspot1',
        dnsName: dnsMatch ? dnsMatch[1] : 'wifi.net',
        name: nameMatch ? nameMatch[1] : `Mikhmon_${ip}`,
        port: portMatch ? portMatch[1] : '80'
      });
    }
  }

  // Fallback to single-variable declarations (e.g. $ip_r = '192.168.1.1')
  if (routersList.length === 0) {
    const ipMatch = cleanContent.match(/\$ip(_r)?\s*=\s*['"]([^'"]*)['"]/i);
    if (ipMatch) {
      const ip = ipMatch[2];
      const usernameMatch = cleanContent.match(/\$(username|user|user_r)\s*=\s*['"]([^'"]*)['"]/i);
      const passwordMatch = cleanContent.match(/\$(password|pass|pass_r)\s*=\s*['"]([^'"]*)['"]/i);
      const hotspotMatch = cleanContent.match(/\$hotspot(_r)?\s*=\s*['"]([^'"]*)['"]/i);
      const dnsMatch = cleanContent.match(/\$dns(_r)?\s*=\s*['"]([^'"]*)['"]/i);
      const nameMatch = cleanContent.match(/\$(name|session_name|md5_r|session)\s*=\s*['"]([^'"]*)['"]/i);
      const portMatch = cleanContent.match(/\$port(_r)?\s*=\s*['"]([^'"]*)['"]/i);

      routersList.push({
        ip,
        username: usernameMatch ? usernameMatch[2] : 'admin',
        password: passwordMatch ? passwordMatch[2] : '',
        hotspotName: hotspotMatch ? hotspotMatch[2] : 'hotspot1',
        dnsName: dnsMatch ? dnsMatch[2] : 'wifi.net',
        name: nameMatch ? nameMatch[2] : `Mikhmon_${ip}`,
        port: portMatch ? portMatch[2] : '80'
      });
    }
  }

  // Map and clean up values
  return routersList.map(r => {
    const port = r.port && r.port !== '80' ? r.port : '8728'; // Mikhmon v3 default is 8728, if '80' came from a fallback, prefer 8728
    const isRest = port === '80' || port === '443';
    return {
      name: r.name || `Mikhmon_${r.ip}`,
      ip: r.ip || '',
      port,
      username: r.username || 'admin',
      password: r.password || '',
      hotspotName: r.hotspotName || 'hotspot1',
      dnsName: r.dnsName || 'wifi.net',
      useSsl: port === '443' || port === '8729',
      isSimulator: false,
      isActive: false,
      apiType: (isRest ? 'v7-rest' : 'v6-api') as 'v7-rest' | 'v6-api'
    };
  }).filter(r => r.ip !== '');
};

export default function SettingsTab({
  routers,
  activeRouter,
  status,
  statusMessage,
  onAddRouter,
  onUpdateRouter,
  onDeleteRouter,
  onSelectRouter,
  onRefreshStatus
}: SettingsTabProps) {
  // Editing form states
  const [editForm, setEditForm] = useState<Partial<RouterConfig>>({ ...activeRouter });
  const [isNewRouter, setIsNewRouter] = useState(false);

  // Mikhmon PHP import states
  const [mikhmonPhp, setMikhmonPhp] = useState('');
  const [showMikhmonImport, setShowMikhmonImport] = useState(false);
  const [parsedRouters, setParsedRouters] = useState<Partial<RouterConfig>[]>([]);

  // Confirmation and toast states
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Auto-dismiss toast after 4 seconds
  React.useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Sync edit form if activeRouter changes (and user is not currently writing a new router)
  React.useEffect(() => {
    if (!isNewRouter) {
      setEditForm({ ...activeRouter });
    }
  }, [activeRouter, isNewRouter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isNewRouter) {
        await onAddRouter(editForm);
        setIsNewRouter(false);
        setToast({ message: 'Sesi Router baru berhasil disimpan!', type: 'success' });
      } else {
        if (editForm.id) {
          await onUpdateRouter(editForm.id, editForm);
          setToast({ message: 'Pengaturan sesi berhasil diperbarui!', type: 'success' });
        }
      }
    } catch (err: any) {
      setToast({ message: 'Gagal menyimpan sesi: ' + err.message, type: 'error' });
    }
  };

  const handleStartNewRouter = () => {
    setIsNewRouter(true);
    setEditForm({
      name: 'Cabang Baru (RTR-ROSv7)',
      ip: '192.168.1.1',
      port: '80',
      username: 'admin',
      password: '',
      hotspotName: 'hotspot1',
      dnsName: 'wifi.net',
      useSsl: false,
      isSimulator: false
    });
  };

  return (
    <div id="settings-tab-content" className="space-y-6">
      <div className="flex justify-between items-center border-b border-slate-800 pb-3">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-sky-400" />
            Pengaturan Sesi Koneksi Mikrotik
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Mikhmon v3 Pro mendukung integrasi mutakhir dengan Mikrotik RouterOS v7 REST API.
          </p>
        </div>
        {!isNewRouter && (
          <button
            onClick={handleStartNewRouter}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold flex items-center gap-2 transition-all shadow-lg"
          >
            <PlusCircle className="w-4 h-4" />
            Tambah Sesi Baru
          </button>
        )}
      </div>

      {toast && (
        <div className={`p-3 rounded-xl border text-xs flex items-center justify-between animate-in slide-in-from-top-4 duration-200 shadow-md ${
          toast.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
            : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
        }`}>
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${toast.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
            <span>{toast.message}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setToast(null)} 
            className="text-[9px] uppercase font-bold text-slate-500 hover:text-slate-300 px-2 py-1 bg-slate-950/40 rounded-lg cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column: Active Session Form */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
            {isNewRouter ? 'Form Tambah Sesi Router Baru' : `Edit Konfigurasi Sesi: ${activeRouter.name}`}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs text-slate-300">
            {/* Row 1: Session name & Simulator */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Nama Sesi Router *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mikrotik Cabang Pusat"
                  value={editForm.name || ''}
                  onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Mode Operasional Sesi
                </label>
                <select
                  value={editForm.isSimulator ? 'yes' : 'no'}
                  onChange={(e) => {
                    const isSim = e.target.value === 'yes';
                    setEditForm({
                      ...editForm,
                      isSimulator: isSim,
                      apiType: isSim ? 'v7-rest' : (editForm.apiType || 'v7-rest')
                    });
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                >
                  <option value="no">Mikrotik Router Fisik (Koneksi API)</option>
                  <option value="yes">Demo Simulator (Tanpa Perangkat Fisik)</option>
                </select>
              </div>
            </div>

            {/* Row 1b: API Connection Type (only if physical router) */}
            {!editForm.isSimulator && (
              <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/60 space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Tipe Koneksi / API Mikrotik
                  </label>
                  <select
                    value={editForm.apiType || 'v7-rest'}
                    onChange={(e) => {
                      const apiType = e.target.value as 'v7-rest' | 'v6-api';
                      const defaultPort = apiType === 'v7-rest' 
                        ? (editForm.useSsl ? '443' : '80') 
                        : (editForm.useSsl ? '8729' : '8728');
                      setEditForm({
                        ...editForm,
                        apiType,
                        port: defaultPort
                      });
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                  >
                    <option value="v7-rest">REST API - RouterOS v7+ (Menggunakan Port HTTP/HTTPS Web)</option>
                    <option value="v6-api">API Port - RouterOS v6 / v7 (Menggunakan Port TCP RouterOS API)</option>
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                    {editForm.apiType === 'v6-api' 
                      ? 'Rekomendasi untuk RouterOS v6 (Mikhmon v3 Klasik). Menggunakan port API standar (default: 8728 / 8729).' 
                      : 'Rekomendasi untuk RouterOS v7. Menggunakan REST API bawaan RouterOS v7 pada port Web (default: 80 / 443).'}
                  </p>
                </div>
              </div>
            )}

            {/* Row 2: IP, REST Port, Protocol */}
            {!editForm.isSimulator && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-950/40 p-4 rounded-xl border border-slate-800/60 font-sans">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    IP Address / Host Mikrotik *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 192.168.88.1 atau domain"
                    value={editForm.ip || ''}
                    onChange={(e) => setEditForm({...editForm, ip: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    {editForm.apiType === 'v6-api' ? 'API Service Port *' : 'REST API Port *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={editForm.apiType === 'v6-api' ? 'e.g. 8728 atau 8729' : 'e.g. 80 atau 443'}
                    value={editForm.port || (editForm.apiType === 'v6-api' ? '8728' : '80')}
                    onChange={(e) => setEditForm({...editForm, port: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Protokol SSL / Secure Connection
                  </label>
                  <select
                    value={editForm.useSsl ? 'yes' : 'no'}
                    onChange={(e) => {
                      const useSsl = e.target.value === 'yes';
                      const isV6 = editForm.apiType === 'v6-api';
                      const defaultPort = isV6
                        ? (useSsl ? '8729' : '8728')
                        : (useSsl ? '443' : '80');
                      setEditForm({
                        ...editForm,
                        useSsl,
                        port: defaultPort
                      });
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                  >
                    <option value="no">HTTP / TCP API (Normal Plaintext)</option>
                    <option value="yes">HTTPS / SSL API (Encrypted Secure)</option>
                  </select>
                </div>
              </div>
            )}

            {/* Row 3: Credentials */}
            {!editForm.isSimulator && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Username RouterOS *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. admin"
                    value={editForm.username || ''}
                    onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Password RouterOS
                  </label>
                  <input
                    type="password"
                    placeholder="e.g. password_winbox"
                    value={editForm.password || ''}
                    onChange={(e) => setEditForm({...editForm, password: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>
            )}

            {/* Row 4: Hotspot Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Nama Server Hotspot
                </label>
                <input
                  type="text"
                  placeholder="e.g. hs-mikhmon"
                  value={editForm.hotspotName || ''}
                  onChange={(e) => setEditForm({...editForm, hotspotName: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  DNS Name Suffix Hotspot
                </label>
                <input
                  type="text"
                  placeholder="e.g. wifi.net"
                  value={editForm.dnsName || ''}
                  onChange={(e) => setEditForm({...editForm, dnsName: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

             {/* Instruction info box for real router */}
            {!editForm.isSimulator && (
              <div className="bg-slate-950 border border-slate-800/80 p-3 rounded-xl flex gap-3 text-[11px] text-slate-400">
                <HelpCircle className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <span className="font-bold text-white block">Persyaratan & Cara Aktivasi Koneksi Mikrotik:</span>
                  
                  {editForm.apiType === 'v6-api' ? (
                    <div className="space-y-1">
                      <p className="text-white font-semibold">Tipe: API Port (RouterOS v6 / v7)</p>
                      <p>
                        1. Aktifkan service <span className="text-white font-mono">api</span> (plaintext) atau <span className="text-white font-mono">api-ssl</span> (encrypted) di MikroTik Anda.
                      </p>
                      <p>
                        2. Jalankan perintah terminal Winbox untuk mengaktifkan:
                        <br />
                        <span className="text-sky-400 font-mono block mt-0.5 select-all">/ip service set api disabled=no port=8728</span>
                      </p>
                      <p>
                        3. Pastikan port <span className="text-white font-mono">8728</span> (atau port kustom Anda) tidak diblokir oleh firewall MikroTik.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-white font-semibold">Tipe: REST API (RouterOS v7+ Sahaja)</p>
                      <p>
                        1. Memerlukan <span className="text-white font-mono">RouterOS v7.x ke atas</span> (RouterOS v6 tidak mendukung REST API).
                      </p>
                      <p>
                        2. Aktifkan service <span className="text-white font-mono">www</span> (HTTP) atau <span className="text-white font-mono">www-ssl</span> (HTTPS) di MikroTik Anda.
                      </p>
                      <p>
                        3. Jalankan perintah terminal Winbox untuk mengaktifkan:
                        <br />
                        <span className="text-sky-400 font-mono block mt-0.5 select-all">/ip service set www disabled=no port=80</span>
                      </p>
                    </div>
                  )}
                  
                  <p className="text-[10px] text-slate-500 pt-1 border-t border-slate-800/50">
                    💡 Jika server di-host di Cloud, MikroTik Anda harus memiliki IP Publik / VPN Remote yang bisa diakses dari internet.
                  </p>
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
              {isNewRouter ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsNewRouter(false);
                    setEditForm({ ...activeRouter });
                  }}
                  className="text-slate-400 hover:text-white font-semibold"
                >
                  Batal
                </button>
              ) : (
                <span className="text-xs text-slate-500">
                  ID Sesi: <span className="font-mono font-semibold">{editForm.id}</span>
                </span>
              )}
              <button
                type="submit"
                className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {isNewRouter ? 'Simpan Sesi Baru' : 'Perbarui Konfigurasi Sesi'}
              </button>
            </div>
          </form>
        </div>

        {/* Right column: Saved Session Profiles list */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
              Daftar Sesi Router Tersimpan
            </h3>
            <div className="space-y-3">
              {routers.map((r) => {
                const isSelected = r.id === activeRouter.id;
                return (
                  <div 
                    key={r.id} 
                    className={`p-3 rounded-xl border transition-all flex justify-between items-center ${
                      isSelected 
                        ? 'bg-sky-600/10 border-sky-500' 
                        : 'bg-slate-950/40 border-slate-800/60 hover:border-slate-700'
                    }`}
                  >
                    <div 
                      onClick={() => {
                        setIsNewRouter(false);
                        onSelectRouter(r.id);
                      }}
                      className="cursor-pointer flex-1 min-w-0"
                    >
                      <h4 className="font-bold text-white text-xs truncate flex items-center gap-1.5">
                        {r.name}
                        {r.isSimulator && (
                          <span className="px-1.5 py-0.5 bg-sky-500/20 text-sky-400 text-[8px] font-bold rounded uppercase">
                            Sim
                          </span>
                        )}
                      </h4>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">
                        {r.ip}:{r.port}
                      </p>
                    </div>
                    
                    {routers.length > 1 && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        {confirmDeleteId === r.id ? (
                          <div className="flex items-center gap-1 bg-rose-500/10 border border-rose-500/30 p-1 rounded-lg animate-in fade-in zoom-in-95 duration-150">
                            <span className="text-[9px] text-rose-400 font-extrabold px-1 select-none">Hapus?</span>
                            <button
                              type="button"
                              onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                  await onDeleteRouter(r.id);
                                  setConfirmDeleteId(null);
                                  setToast({ message: `Sesi router "${r.name}" berhasil dihapus.`, type: 'success' });
                                } catch (err: any) {
                                  setToast({ message: `Gagal menghapus: ${err.message}`, type: 'error' });
                                }
                              }}
                              className="px-1.5 py-0.5 bg-rose-600 hover:bg-rose-500 text-white text-[9px] font-bold rounded cursor-pointer transition-colors"
                            >
                              Ya
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmDeleteId(null);
                              }}
                              className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[9px] font-bold rounded cursor-pointer transition-colors"
                            >
                              Batal
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDeleteId(r.id);
                            }}
                            className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-all ml-2 cursor-pointer"
                            title="Hapus Sesi"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Connection diagnostics card */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl text-xs">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Koneksi Diagnostik Sesi
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-2 bg-slate-950/40 rounded-lg border border-slate-800/40">
                <span className="text-slate-400">Status Sesi:</span>
                <span className={`font-extrabold uppercase text-[10px] ${
                  status === 'online' ? 'text-emerald-500' : status === 'connecting' ? 'text-amber-500' : 'text-rose-500'
                }`}>
                  {status}
                </span>
              </div>
              <div className="p-2 bg-slate-950/40 rounded-lg border border-slate-800/40 text-slate-400 font-mono text-[10px] leading-relaxed break-words">
                {statusMessage}
              </div>
              <button
                type="button"
                onClick={onRefreshStatus}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 font-bold cursor-pointer"
              >
                Uji Koneksi REST API
              </button>
            </div>
          </div>

          {/* Mikhmon v3 Config Importer Card */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl text-xs space-y-3">
            <div className="flex justify-between items-center cursor-pointer" onClick={() => setShowMikhmonImport(!showMikhmonImport)}>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-sky-400" />
                Impor Config Mikhmon v3
              </h3>
              <span className="text-slate-400 font-bold">{showMikhmonImport ? '▲' : '▼'}</span>
            </div>
            
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Punya file <code className="text-sky-400 font-mono">config.php</code> atau session file dari Mikhmon v3? Tempel isinya di bawah untuk mengimpor semua sesi router sekaligus.
            </p>

            {showMikhmonImport && (
              <div className="space-y-3 pt-2 border-t border-slate-800 animate-in fade-in duration-200">
                <textarea
                  rows={6}
                  value={mikhmonPhp}
                  onChange={(e) => {
                    const val = e.target.value;
                    setMikhmonPhp(val);
                    try {
                      const parsed = parseMikhmonPhp(val);
                      setParsedRouters(parsed);
                    } catch (err) {
                      setParsedRouters([]);
                    }
                  }}
                  placeholder="<?php
$data = array (
  0 => array (
    'name' => 'Mikrotik-Hotspot',
    'ip' => '192.168.88.1',
    'username' => 'admin',
    'password' => 'mypass',
    'hotspot' => 'hs-wifi',
    'dns' => 'wifi.net'
  )
);"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-[11px] text-slate-300 font-mono focus:outline-none focus:border-sky-500"
                />

                {parsedRouters.length > 0 && (
                  <div className="p-3 bg-sky-500/10 border border-sky-500/30 rounded-lg space-y-1.5">
                    <span className="font-extrabold text-[10px] text-sky-400 uppercase block">Terdeteksi {parsedRouters.length} Sesi Router:</span>
                    <div className="max-h-24 overflow-y-auto space-y-1 font-mono text-[10px] text-slate-300">
                      {parsedRouters.map((r, i) => (
                        <div key={i} className="truncate">
                          • <span className="text-white font-bold">{r.name}</span> ({r.ip}:{r.port}) - User: {r.username}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  disabled={parsedRouters.length === 0}
                  onClick={async () => {
                    try {
                      let count = 0;
                      for (const r of parsedRouters) {
                        await onAddRouter(r);
                        count++;
                      }
                      alert(`Berhasil mengimpor ${count} sesi router dari Mikhmon v3!`);
                      setMikhmonPhp('');
                      setParsedRouters([]);
                      setShowMikhmonImport(false);
                    } catch (err: any) {
                      alert('Gagal mengimpor sesi: ' + err.message);
                    }
                  }}
                  className={`w-full py-2 rounded-lg text-white font-bold text-xs flex justify-center items-center gap-1.5 transition-all ${
                    parsedRouters.length > 0 
                      ? 'bg-sky-600 hover:bg-sky-500 cursor-pointer' 
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  Proses & Impor Sesi ({parsedRouters.length})
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
