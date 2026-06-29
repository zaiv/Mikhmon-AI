import React, { useState, useEffect, useRef } from 'react';
import { 
  RouterConfig, 
  SystemResources, 
  NetworkInterface, 
  HotspotUser, 
  HotspotProfile, 
  HotspotActive, 
  PppoeUser, 
  PppoeProfile, 
  PppoeActive, 
  RouterLog,
  DashboardStats,
  VoucherGenerateOptions,
  SalesRecord
} from './types';
import Sidebar from './components/Sidebar';
import DashboardTab from './components/DashboardTab';
import HotspotTab from './components/HotspotTab';
import PppoeTab from './components/PppoeTab';
import InterfaceTab from './components/InterfaceTab';
import LogsTab from './components/LogsTab';
import SettingsTab from './components/SettingsTab';
import SalesReportTab from './components/SalesReportTab';
import { Network, Wifi, HelpCircle } from 'lucide-react';

export default function App() {
  // Navigation tab: 'dashboard' | 'hotspot' | 'pppoe' | 'monitor' | 'logs' | 'settings'
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Router sessions configurations lists
  const [routers, setRouters] = useState<RouterConfig[]>([]);
  const [activeRouter, setActiveRouter] = useState<RouterConfig | null>(null);

  // Router Connection diagnostics
  const [connectionStatus, setConnectionStatus] = useState<'online' | 'offline' | 'connecting'>('connecting');
  const [statusMessage, setStatusMessage] = useState<string>('Memulai inisialisasi sesi...');

  // Live aggregated datasets
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [resources, setResources] = useState<SystemResources | null>(null);
  const [interfaces, setInterfaces] = useState<NetworkInterface[]>([]);
  const [logs, setLogs] = useState<RouterLog[]>([]);
  const [trafficHistory, setTrafficHistory] = useState<{ time: string; rx: number; tx: number }[]>([]);

  // Hotspot entities
  const [hotspotUsers, setHotspotUsers] = useState<HotspotUser[]>([]);
  const [hotspotProfiles, setHotspotProfiles] = useState<HotspotProfile[]>([]);
  const [hotspotActive, setHotspotActive] = useState<HotspotActive[]>([]);

  // PPPoE entities
  const [pppoeUsers, setPppoeUsers] = useState<PppoeUser[]>([]);
  const [pppoeProfiles, setPppoeProfiles] = useState<PppoeProfile[]>([]);
  const [pppoeActive, setPppoeActive] = useState<PppoeActive[]>([]);

  // Sales records
  const [sales, setSales] = useState<SalesRecord[]>([]);

  // Modals shortcuts state triggers from dashboard
  const hotspotTabRef = useRef<any>(null);

  // --- 1. FETCH ROUTERS PROFILE ON START ---
  const fetchRouters = async () => {
    try {
      const res = await fetch('/api/routers');
      if (res.ok) {
        const data = await res.json();
        setRouters(data);
        const active = data.find((r: RouterConfig) => r.isActive) || data[0];
        if (active) {
          setActiveRouter(active);
        }
      }
    } catch (err) {
      console.error('Error fetching router configs:', err);
    }
  };

  useEffect(() => {
    fetchRouters();
  }, []);

  // --- 2. SWITCH ROUTER SESSION ---
  const handleSelectRouter = async (id: string) => {
    setConnectionStatus('connecting');
    setStatusMessage('Beralih sesi router, menghubungkan...');
    try {
      const res = await fetch(`/api/routers/select/${id}`, { method: 'POST' });
      if (res.ok) {
        const active = await res.json();
        setActiveRouter(active);
        // Refresh routers list to update selection indicators
        fetchRouters();
      }
    } catch (err: any) {
      setConnectionStatus('offline');
      setStatusMessage('Gagal beralih sesi: ' + err.message);
    }
  };

  // --- 3. CREATE / UPDATE / DELETE ROUTER SESSION ---
  const handleAddRouter = async (routerData: Partial<RouterConfig>) => {
    const res = await fetch('/api/routers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(routerData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Gagal membuat sesi');
    }
    await fetchRouters();
  };

  const handleUpdateRouter = async (id: string, routerData: Partial<RouterConfig>) => {
    const res = await fetch(`/api/routers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(routerData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Gagal menyimpan perubahan');
    }
    await fetchRouters();
  };

  const handleDeleteRouter = async (id: string) => {
    const res = await fetch(`/api/routers/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Gagal menghapus');
    }
    await fetchRouters();
  };


  // --- 4. CORE DATA REFRESH FUNCTION ---
  const refreshAllData = async () => {
    if (!activeRouter) return;

    try {
      // Parallelize status & stats retrieval to maximize speed
      const [statusRes, statsRes] = await Promise.all([
        fetch('/api/status'),
        fetch('/api/dashboard/stats')
      ]);

      if (statusRes.ok) {
        const statData = await statusRes.json();
        if (statData.status === 'online') {
          setConnectionStatus('online');
          setStatusMessage(statData.message || 'REST API Mikrotik Terhubung Sempurna');
        } else {
          setConnectionStatus('offline');
          setStatusMessage(statData.error || 'REST API Terputus. Periksa IP, Port, dan Kredensial.');
        }
      }

      if (statsRes.ok) {
        const s = await statsRes.json();
        setStats(s);
      }

      // If offline, don't attempt to fetch high-frequency sub-entities
      if (connectionStatus === 'offline') return;

      const [
        resRes,
        ifacesRes,
        logsRes,
        trafficRes,
        hsUsersRes,
        hsActRes,
        hsProfRes,
        pppUsersRes,
        pppActRes,
        pppProfRes,
        salesRes
      ] = await Promise.all([
        fetch('/api/resources'),
        fetch('/api/interfaces'),
        fetch('/api/logs'),
        fetch('/api/charts/traffic'),
        fetch('/api/hotspot/users'),
        fetch('/api/hotspot/active'),
        fetch('/api/hotspot/profiles'),
        fetch('/api/pppoe/users'),
        fetch('/api/pppoe/active'),
        fetch('/api/pppoe/profiles'),
        fetch('/api/sales')
      ]);

      if (resRes.ok) setResources(await resRes.json());
      if (ifacesRes.ok) setInterfaces(await ifacesRes.json());
      if (logsRes.ok) setLogs(await logsRes.json());
      if (trafficRes.ok) setTrafficHistory(await trafficRes.json());
      if (hsUsersRes.ok) setHotspotUsers(await hsUsersRes.json());
      if (hsActRes.ok) setHotspotActive(await hsActRes.json());
      if (hsProfRes.ok) setHotspotProfiles(await hsProfRes.json());
      if (pppUsersRes.ok) setPppoeUsers(await pppUsersRes.json());
      if (pppActRes.ok) setPppoeActive(await pppActRes.json());
      if (pppProfRes.ok) setPppoeProfiles(await pppProfRes.json());
      if (salesRes.ok) setSales(await salesRes.json());

    } catch (err) {
      console.error('Error polling Mikrotik assets:', err);
    }
  };

  // High-frequency polling loop (every 3 seconds)
  useEffect(() => {
    if (!activeRouter) return;
    
    // Initial load
    refreshAllData();

    const interval = setInterval(() => {
      refreshAllData();
    }, 3000);

    return () => clearInterval(interval);
  }, [activeRouter]);


  // --- 5. HOTSPOT OPERATIONS ---
  const handleAddHotspotUser = async (user: Partial<HotspotUser>) => {
    const res = await fetch('/api/hotspot/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Gagal menambahkan voucher user');
    }
    refreshAllData();
  };

  const handleBatchGenerateHotspot = async (options: VoucherGenerateOptions) => {
    const res = await fetch('/api/hotspot/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Gagal men-generate batch voucher');
    }
    refreshAllData();
  };

  const handleDeleteHotspotUser = async (id: string) => {
    const res = await fetch(`/api/hotspot/users/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Gagal menghapus voucher');
    }
    refreshAllData();
  };

  const handleKickHotspotActive = async (id: string) => {
    const res = await fetch(`/api/hotspot/active/remove/${id}`, { method: 'POST' });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Gagal memutuskan sesi');
    }
    refreshAllData();
  };

  const handleAddHotspotProfile = async (profile: Partial<HotspotProfile>) => {
    const res = await fetch('/api/hotspot/profiles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Gagal membuat profil');
    }
    refreshAllData();
  };

  const handleDeleteHotspotProfile = async (id: string) => {
    const res = await fetch(`/api/hotspot/profiles/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Gagal menghapus profil');
    }
    refreshAllData();
  };

  const handleUpdateHotspotUser = async (id: string, user: Partial<HotspotUser>) => {
    const res = await fetch(`/api/hotspot/users/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Gagal mengubah voucher user');
    }
    refreshAllData();
  };

  const handleUpdateHotspotProfile = async (id: string, profile: Partial<HotspotProfile>) => {
    const res = await fetch(`/api/hotspot/profiles/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Gagal mengubah profil hotspot');
    }
    refreshAllData();
  };


  // --- 6. PPPOE OPERATIONS ---
  const handleAddPppoeUser = async (user: Partial<PppoeUser>) => {
    const res = await fetch('/api/pppoe/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Gagal menambah client PPPoE');
    }
    refreshAllData();
  };

  const handleDeletePppoeUser = async (id: string) => {
    const res = await fetch(`/api/pppoe/users/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Gagal menghapus client');
    }
    refreshAllData();
  };

  const handleUpdatePppoeUser = async (id: string, user: Partial<PppoeUser>) => {
    const res = await fetch(`/api/pppoe/users/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Gagal mengubah client PPPoE');
    }
    refreshAllData();
  };

  const handleAddPppoeProfile = async (profile: Partial<PppoeProfile>) => {
    const res = await fetch('/api/pppoe/profiles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Gagal membuat profil PPPoE');
    }
    refreshAllData();
  };

  const handleDeletePppoeProfile = async (id: string) => {
    const res = await fetch(`/api/pppoe/profiles/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Gagal menghapus profil PPPoE');
    }
    refreshAllData();
  };

  const handleUpdatePppoeProfile = async (id: string, profile: Partial<PppoeProfile>) => {
    const res = await fetch(`/api/pppoe/profiles/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Gagal mengubah profil PPPoE');
    }
    refreshAllData();
  };

  const handleDeleteSale = async (id: string) => {
    const res = await fetch(`/api/sales/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Gagal menghapus data penjualan');
    }
    refreshAllData();
  };

  const handleClearAllSales = async () => {
    const res = await fetch('/api/sales', { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Gagal membersihkan semua data penjualan');
    }
    refreshAllData();
  };

  if (!activeRouter) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 text-slate-300">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 bg-sky-500/10 text-sky-400 border border-sky-500/30 rounded-full flex items-center justify-center mx-auto animate-pulse">
            <Network className="w-6 h-6" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Mikhmon Winbox Pro v3</p>
          <p className="text-sm font-bold text-white">Memuat profil sesi Mikrotik...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen bg-slate-950 text-slate-200 font-sans overflow-hidden">
      {/* SIDEBAR NAVIGATION CONTROL */}
      <Sidebar
        routers={routers}
        activeRouter={activeRouter}
        status={connectionStatus}
        statusMessage={statusMessage}
        resources={resources}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onSelectRouter={handleSelectRouter}
        onOpenNewRouterModal={() => {
          setActiveTab('settings');
        }}
        onReconnect={refreshAllData}
      />

      {/* MAIN VIEW CONTENT CONTAINER */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-950 overflow-hidden">
        {/* Unified App Header */}
        <header className="h-16 border-b border-slate-800 shrink-0 flex items-center justify-between px-8 bg-slate-900/40 backdrop-blur-md">
          <div>
            <h1 className="text-base font-extrabold text-white flex items-center gap-2">
              {activeTab === 'dashboard' && 'Dashboard Analitik Trafik'}
              {activeTab === 'hotspot' && 'Hotspot & Voucher Manager'}
              {activeTab === 'sales' && 'Laporan Penjualan Voucher'}
              {activeTab === 'pppoe' && 'PPPoE Client & ISP Settings'}
              {activeTab === 'monitor' && 'Interface Monitor Jaringan'}
              {activeTab === 'logs' && 'Logs RouterOS Audit'}
              {activeTab === 'settings' && 'Pengaturan Sesi Koneksi'}
            </h1>
            <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">
              {activeRouter.isSimulator ? 'Simulator Active Session' : `Koneksi Router: ${activeRouter.ip}`}
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Quick stats indicator */}
            <div className="hidden md:flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 text-[11px] font-bold uppercase">
              <button 
                onClick={() => setActiveTab('hotspot')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                  activeTab === 'hotspot' ? 'bg-sky-600 text-white' : 'text-slate-400'
                }`}
              >
                <Wifi className="w-3.5 h-3.5" /> Hotspot
              </button>
              <button 
                onClick={() => setActiveTab('pppoe')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                  activeTab === 'pppoe' ? 'bg-sky-600 text-white' : 'text-slate-400'
                }`}
              >
                <Network className="w-3.5 h-3.5" /> PPPoE
              </button>
            </div>

            {/* Indicator status capsule */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl">
              <span className={`w-1.5 h-1.5 rounded-full ${
                connectionStatus === 'online' ? 'bg-emerald-500 animate-ping' : 'bg-rose-500'
              }`}></span>
              <span className="text-[10px] font-mono font-bold uppercase text-slate-400">
                {connectionStatus === 'online' ? 'REST API OK' : 'OFFLINE'}
              </span>
            </div>
          </div>
        </header>

        {/* Scrollable View Content Stage */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'dashboard' && (
              <DashboardTab
                stats={stats}
                resources={resources}
                interfaces={interfaces}
                logs={logs}
                trafficData={trafficHistory}
                onOpenCreateVoucher={() => {
                  setActiveTab('hotspot');
                  // Trigger the voucher generation sub-flow natively
                }}
                onNavigateToTab={(tab) => setActiveTab(tab)}
              />
            )}

            {activeTab === 'hotspot' && (
              <HotspotTab
                users={hotspotUsers}
                profiles={hotspotProfiles}
                activeSessions={hotspotActive}
                dnsName={activeRouter.dnsName}
                hotspotName={activeRouter.hotspotName}
                onAddUser={handleAddHotspotUser}
                onUpdateUser={handleUpdateHotspotUser}
                onBatchGenerate={handleBatchGenerateHotspot}
                onDeleteUser={handleDeleteHotspotUser}
                onKickSession={handleKickHotspotActive}
                onAddProfile={handleAddHotspotProfile}
                onUpdateProfile={handleUpdateHotspotProfile}
                onDeleteProfile={handleDeleteHotspotProfile}
                onRefresh={refreshAllData}
              />
            )}

            {activeTab === 'sales' && (
              <SalesReportTab
                sales={sales}
                onDeleteSale={handleDeleteSale}
                onClearAllSales={handleClearAllSales}
                onRefresh={refreshAllData}
              />
            )}

            {activeTab === 'pppoe' && (
              <PppoeTab
                users={pppoeUsers}
                profiles={pppoeProfiles}
                activeSessions={pppoeActive}
                onAddUser={handleAddPppoeUser}
                onUpdateUser={handleUpdatePppoeUser}
                onDeleteUser={handleDeletePppoeUser}
                onAddProfile={handleAddPppoeProfile}
                onUpdateProfile={handleUpdatePppoeProfile}
                onDeleteProfile={handleDeletePppoeProfile}
                onRefresh={refreshAllData}
              />
            )}

            {activeTab === 'monitor' && (
              <InterfaceTab
                interfaces={interfaces}
                onRefresh={refreshAllData}
              />
            )}

            {activeTab === 'logs' && (
              <LogsTab
                logs={logs}
                onRefresh={refreshAllData}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsTab
                routers={routers}
                activeRouter={activeRouter}
                status={connectionStatus}
                statusMessage={statusMessage}
                onAddRouter={handleAddRouter}
                onUpdateRouter={handleUpdateRouter}
                onDeleteRouter={handleDeleteRouter}
                onSelectRouter={handleSelectRouter}
                onRefreshStatus={refreshAllData}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
