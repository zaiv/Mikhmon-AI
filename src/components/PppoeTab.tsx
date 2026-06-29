import React, { useState } from 'react';
import { 
  Users, 
  Layers, 
  Activity, 
  PlusCircle, 
  Trash2, 
  RefreshCw, 
  Key, 
  Network, 
  Globe, 
  ZapOff,
  UserCheck,
  Search,
  CheckCircle,
  XCircle,
  HelpCircle,
  Edit
} from 'lucide-react';
import { PppoeUser, PppoeProfile, PppoeActive } from '../types';

interface PppoeTabProps {
  users: PppoeUser[];
  profiles: PppoeProfile[];
  activeSessions: PppoeActive[];
  onAddUser: (user: Partial<PppoeUser>) => Promise<any>;
  onUpdateUser: (id: string, user: Partial<PppoeUser>) => Promise<any>;
  onDeleteUser: (id: string) => Promise<any>;
  onAddProfile: (profile: Partial<PppoeProfile>) => Promise<any>;
  onUpdateProfile: (id: string, profile: Partial<PppoeProfile>) => Promise<any>;
  onDeleteProfile: (id: string) => Promise<any>;
  onRefresh: () => void;
}

export default function PppoeTab({
  users,
  profiles,
  activeSessions,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  onAddProfile,
  onUpdateProfile,
  onDeleteProfile,
  onRefresh
}: PppoeTabProps) {
  const [subTab, setSubTab] = useState<'users' | 'profiles' | 'active'>('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showAddProfileModal, setShowAddProfileModal] = useState(false);

  // Edit State
  const [editingUser, setEditingUser] = useState<PppoeUser | null>(null);
  const [editingProfile, setEditingProfile] = useState<PppoeProfile | null>(null);

  // New User state
  const [newUser, setNewUser] = useState({
    name: '',
    password: '',
    profile: '',
    service: 'pppoe' as 'pppoe' | 'any',
    localAddress: '',
    remoteAddress: '',
    comment: ''
  });

  // New Profile state
  const [newProfile, setNewProfile] = useState({
    name: '',
    localAddress: '10.10.10.1',
    remoteAddress: 'pool-pppoe',
    rateLimit: '5M/5M',
    dnsServer: '8.8.8.8,1.1.1.1'
  });

  // Load defaults for forms
  React.useEffect(() => {
    if (profiles.length > 0 && !newUser.profile) {
      setNewUser(u => ({ ...u, profile: profiles[0].name }));
    }
  }, [profiles]);

  // Form Submission
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name || !newUser.password) return;
    try {
      await onAddUser(newUser);
      setShowAddUserModal(false);
      setNewUser({
        name: '',
        password: '',
        profile: profiles[0]?.name || 'default',
        service: 'pppoe',
        localAddress: '',
        remoteAddress: '',
        comment: ''
      });
    } catch (err: any) {
      alert('Error adding PPPoE user: ' + err.message);
    }
  };

  const handleAddProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfile.name) return;
    try {
      await onAddProfile(newProfile);
      setShowAddProfileModal(false);
      setNewProfile({
        name: '',
        localAddress: '10.10.10.1',
        remoteAddress: 'pool-pppoe',
        rateLimit: '5M/5M',
        dnsServer: '8.8.8.8,1.1.1.1'
      });
    } catch (err: any) {
      alert('Error adding PPPoE profile: ' + err.message);
    }
  };

  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      await onUpdateUser(editingUser.id, {
        name: editingUser.name,
        password: editingUser.password,
        profile: editingUser.profile,
        service: editingUser.service,
        localAddress: editingUser.localAddress || undefined,
        remoteAddress: editingUser.remoteAddress || undefined,
        comment: editingUser.comment || undefined,
        disabled: editingUser.disabled
      });
      setEditingUser(null);
    } catch (err: any) {
      alert('Gagal mengubah client PPPoE: ' + err.message);
    }
  };

  const handleSaveEditProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProfile) return;
    try {
      await onUpdateProfile(editingProfile.id, {
        name: editingProfile.name,
        localAddress: editingProfile.localAddress,
        remoteAddress: editingProfile.remoteAddress,
        rateLimit: editingProfile.rateLimit || undefined,
        dnsServer: editingProfile.dnsServer || undefined
      });
      setEditingProfile(null);
    } catch (err: any) {
      alert('Gagal mengubah profil PPPoE: ' + err.message);
    }
  };

  // Filtered lists
  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (u.comment || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id="pppoe-tab-content" className="space-y-6">
      {/* Tab Sub-Header navigation */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-800 pb-3">
        <div className="flex gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 shrink-0">
          <button
            onClick={() => setSubTab('users')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              subTab === 'users'
                ? 'bg-sky-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            PPPoE Secrets
          </button>
          <button
            onClick={() => setSubTab('profiles')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              subTab === 'profiles'
                ? 'bg-sky-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            PPPoE Profiles
          </button>
          <button
            onClick={() => setSubTab('active')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              subTab === 'active'
                ? 'bg-sky-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-4 h-4" />
            Sesi PPPoE Aktif ({activeSessions.length})
          </button>
        </div>

        {/* Action button bar */}
        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4.5 h-4.5" />
          </button>
          
          {subTab === 'users' && (
            <button
              onClick={() => setShowAddUserModal(true)}
              className="px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-sky-950/20"
            >
              <PlusCircle className="w-4 h-4" />
              + PPPoE Client
            </button>
          )}

          {subTab === 'profiles' && (
            <button
              onClick={() => setShowAddProfileModal(true)}
              className="px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold flex items-center gap-2 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              + Profil PPPoE
            </button>
          )}
        </div>
      </div>

      {/* FILTER SEARCH (only on users secret tab) */}
      {subTab === 'users' && (
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative col-span-2">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Cari nama client atau lokasi/komentar PPPoE..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
            />
          </div>
          <div className="flex items-center justify-end text-xs text-slate-400">
            Terdaftar: <span className="text-white font-bold ml-1">{filteredUsers.length}</span> clients
          </div>
        </div>
      )}

      {/* TAB CONTENT: PPPOE SECRETS */}
      {subTab === 'users' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[10px] font-extrabold border-b border-slate-800">
                <tr>
                  <th className="p-4">Username Client</th>
                  <th className="p-4">Password</th>
                  <th className="p-4">Service</th>
                  <th className="p-4">Profile Pelanggan</th>
                  <th className="p-4">IP Local / Remote</th>
                  <th className="p-4">Komentar / Lokasi Rumah</th>
                  <th className="p-4 text-center">Status Account</th>
                  <th className="p-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredUsers.map((u) => {
                  const isActive = activeSessions.some(a => a.user === u.name);
                  return (
                    <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-4 font-bold text-white font-mono flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-700'}`}></span>
                        {u.name}
                      </td>
                      <td className="p-4 font-mono text-slate-400">{u.password || '-'}</td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 bg-slate-950 text-slate-400 text-[10px] font-mono rounded uppercase border border-slate-800">
                          {u.service}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-0.5 bg-indigo-500/10 text-indigo-400 text-[10px] font-bold rounded uppercase">
                          {u.profile}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-slate-400">
                        {u.localAddress || 'auto'} → {u.remoteAddress || 'auto'}
                      </td>
                      <td className="p-4 text-slate-400 italic max-w-[200px] truncate" title={u.comment}>
                        {u.comment || '-'}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${
                          u.disabled 
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}>
                          {u.disabled ? 'Isolir' : 'Aktif'}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setEditingUser({ ...u })}
                            className="p-1 text-slate-500 hover:text-sky-400 hover:bg-sky-500/10 rounded transition-all"
                            title="Edit Akun PPPoE"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Hapus akun client PPPoE "${u.name}"?`)) {
                                onDeleteUser(u.id);
                              }
                            }}
                            className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-all"
                            title="Hapus Secret PPPoE"
                          >
                            <Trash2 className="w-4.5 h-4.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-12 text-center text-slate-500">
                      Tidak ada client PPPoE yang terdaftar atau cocok dengan pencarian Anda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: PPPOE PROFILES */}
      {subTab === 'profiles' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {profiles.map((p) => (
            <div key={p.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 bg-sky-500 h-0 group-hover:h-full transition-all"></div>
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-white text-base font-mono">{p.name}</h4>
                  <p className="text-[11px] text-slate-500 font-semibold uppercase mt-0.5">Sesi PPPoE Bandwidth profile</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setEditingProfile({ ...p })}
                    className="p-1.5 text-slate-400 hover:text-sky-400 hover:bg-sky-500/10 rounded-lg transition-all"
                    title="Edit Profil PPPoE"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Hapus profile PPPoE "${p.name}"?`)) {
                        onDeleteProfile(p.id);
                      }
                    }}
                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                    title="Hapus Profile PPPoE"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/60">
                  <span className="text-[9px] text-slate-500 font-sans font-bold block uppercase mb-1">Local IP</span>
                  <span className="font-bold text-slate-200">{p.localAddress || 'auto'}</span>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/60">
                  <span className="text-[9px] text-slate-500 font-sans font-bold block uppercase mb-1">Remote Pool IP</span>
                  <span className="font-bold text-slate-200">{p.remoteAddress || 'auto'}</span>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/60">
                  <span className="text-[9px] text-slate-500 font-sans font-bold block uppercase mb-1">Kecepatan (Rate)</span>
                  <span className="font-bold text-sky-400">{p.rateLimit || 'No Limit'}</span>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/60">
                  <span className="text-[9px] text-slate-500 font-sans font-bold block uppercase mb-1">DNS Server IP</span>
                  <span className="font-bold text-slate-400 truncate block" title={p.dnsServer}>
                    {p.dnsServer || 'auto'}
                  </span>
                </div>
              </div>
            </div>
          ))}
          {profiles.length === 0 && (
            <div className="col-span-full p-12 text-center text-slate-500 bg-slate-900 border border-slate-800 rounded-2xl">
              Belum ada profile PPPoE yang terdaftar. Buat baru untuk mengatur alokasi IP dan limitasi bandwidth.
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: ACTIVE PPPOE SESSIONS */}
      {subTab === 'active' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[10px] font-extrabold border-b border-slate-800">
                <tr>
                  <th className="p-4">Username Client</th>
                  <th className="p-4">Interface Service</th>
                  <th className="p-4">Caller ID (Mac Address)</th>
                  <th className="p-4">Alokasi IP Address</th>
                  <th className="p-4">Uptime Koneksi</th>
                  <th className="p-4 text-center">Aksi Sesi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {activeSessions.map((session) => (
                  <tr key={session.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-4 font-extrabold text-white font-mono flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                      {session.user}
                    </td>
                    <td className="p-4 font-mono text-indigo-400">{session.service}</td>
                    <td className="p-4 font-mono text-slate-400">{session.callerId}</td>
                    <td className="p-4 font-mono text-sky-400 font-bold">{session.address}</td>
                    <td className="p-4 font-mono text-slate-300">{session.uptime}</td>
                    <td className="p-4 text-center">
                      <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded uppercase">
                        Sesi Terhubung
                      </span>
                    </td>
                  </tr>
                ))}
                {activeSessions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-slate-500">
                      Tidak ada client PPPoE yang aktif berselancar saat ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}


      {/* MODAL: ADD CLIENT SECRET */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950/40">
              <h3 className="font-bold text-white text-sm uppercase tracking-wide flex items-center gap-2">
                <Globe className="w-4 h-4 text-sky-400" />
                Tambah Client PPPoE Baru
              </h3>
              <button 
                onClick={() => setShowAddUserModal(false)}
                className="text-slate-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleAddUser} className="p-5 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Username Akun PPPoE *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. net_budi_jalan_merpati"
                  value={newUser.name}
                  onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Password PPPoE Client *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. password_rahasia_budi"
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Template Profile
                  </label>
                  <select
                    value={newUser.profile}
                    onChange={(e) => setNewUser({...newUser, profile: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                  >
                    {profiles.map(p => (
                      <option key={p.id} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Kategori Service
                  </label>
                  <select
                    value={newUser.service}
                    onChange={(e) => setNewUser({...newUser, service: e.target.value as any})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                  >
                    <option value="pppoe">pppoe</option>
                    <option value="any">any</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Local IP Address
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 10.10.10.1 (atau kosong)"
                    value={newUser.localAddress}
                    onChange={(e) => setNewUser({...newUser, localAddress: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Remote IP Address
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 10.10.10.200 (atau pool)"
                    value={newUser.remoteAddress}
                    onChange={(e) => setNewUser({...newUser, remoteAddress: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Komentar / Lokasi Rumah Pelanggan
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rumah RT02/RW05 Merpati No 15"
                  value={newUser.comment}
                  onChange={(e) => setNewUser({...newUser, comment: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold"
                >
                  Simpan Akun PPPoE
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD PPPOE PROFILE */}
      {showAddProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950/40">
              <h3 className="font-bold text-white text-sm uppercase tracking-wide">
                Tambah Profil PPPoE Baru
              </h3>
              <button 
                onClick={() => setShowAddProfileModal(false)}
                className="text-slate-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleAddProfile} className="p-5 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Nama Profil (e.g. PPPoE-15Mbps) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PPPoE-Premium-5M"
                  value={newProfile.name}
                  onChange={(e) => setNewProfile({...newProfile, name: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Local Address IP
                  </label>
                  <input
                    type="text"
                    value={newProfile.localAddress}
                    onChange={(e) => setNewProfile({...newProfile, localAddress: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Remote IP Pool Name
                  </label>
                  <input
                    type="text"
                    value={newProfile.remoteAddress}
                    onChange={(e) => setNewProfile({...newProfile, remoteAddress: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Limitasi Bandwidth (Rate Limit)
                </label>
                <input
                  type="text"
                  value={newProfile.rateLimit}
                  placeholder="e.g. 5M/5M"
                  onChange={(e) => setNewProfile({...newProfile, rateLimit: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  DNS Server (Koma dipisahkan)
                </label>
                <input
                  type="text"
                  value={newProfile.dnsServer}
                  onChange={(e) => setNewProfile({...newProfile, dnsServer: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddProfileModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold"
                >
                  Simpan Profil PPPoE
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT PPPOE USER */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950/40">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Network className="w-4 h-4 text-sky-400" />
                Edit Client PPPoE (Secret)
              </h3>
              <button 
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveEditUser} className="p-5 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Username Pelanggan *
                </label>
                <input
                  type="text"
                  required
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({...editingUser, name: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Password PPPoE *
                </label>
                <input
                  type="text"
                  required
                  value={editingUser.password}
                  onChange={(e) => setEditingUser({...editingUser, password: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Service Type
                  </label>
                  <select
                    value={editingUser.service}
                    onChange={(e) => setEditingUser({...editingUser, service: e.target.value as any})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                  >
                    <option value="pppoe">pppoe</option>
                    <option value="any">any</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    PPPoE Profile *
                  </label>
                  <select
                    value={editingUser.profile}
                    onChange={(e) => setEditingUser({...editingUser, profile: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                  >
                    {profiles.map(p => (
                      <option key={p.id} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Static Local IP (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 10.10.10.1 font-mono"
                    value={editingUser.localAddress || ''}
                    onChange={(e) => setEditingUser({...editingUser, localAddress: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Static Remote IP (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 10.10.10.100 font-mono"
                    value={editingUser.remoteAddress || ''}
                    onChange={(e) => setEditingUser({...editingUser, remoteAddress: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Komentar / Lokasi Rumah Pelanggan
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bpk Joko RT 02 / RW 03"
                  value={editingUser.comment || ''}
                  onChange={(e) => setEditingUser({...editingUser, comment: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="pppoe-disabled-checkbox"
                  checked={editingUser.disabled || false}
                  onChange={(e) => setEditingUser({...editingUser, disabled: e.target.checked})}
                  className="rounded bg-slate-950 border-slate-800 text-sky-500 focus:ring-sky-500 cursor-pointer"
                />
                <label htmlFor="pppoe-disabled-checkbox" className="text-xs font-bold text-slate-400 cursor-pointer select-none uppercase">
                  Isolir Pelanggan (Disable Secret)
                </label>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT PPPOE PROFILE */}
      {editingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950/40">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Layers className="w-4 h-4 text-sky-400" />
                Edit Profil PPPoE
              </h3>
              <button 
                onClick={() => setEditingProfile(null)}
                className="text-slate-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveEditProfile} className="p-5 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Nama Profil *
                </label>
                <input
                  type="text"
                  required
                  value={editingProfile.name}
                  onChange={(e) => setEditingProfile({...editingProfile, name: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-mono font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Local Address IP
                  </label>
                  <input
                    type="text"
                    required
                    value={editingProfile.localAddress}
                    onChange={(e) => setEditingProfile({...editingProfile, localAddress: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Remote IP Pool Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editingProfile.remoteAddress}
                    onChange={(e) => setEditingProfile({...editingProfile, remoteAddress: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Limitasi Bandwidth (Rate Limit)
                </label>
                <input
                  type="text"
                  value={editingProfile.rateLimit || ''}
                  placeholder="e.g. 5M/5M"
                  onChange={(e) => setEditingProfile({...editingProfile, rateLimit: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  DNS Server (Koma dipisahkan)
                </label>
                <input
                  type="text"
                  value={editingProfile.dnsServer || ''}
                  onChange={(e) => setEditingProfile({...editingProfile, dnsServer: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingProfile(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
