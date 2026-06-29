import React, { useState, useMemo } from 'react';
import { 
  PlusCircle, 
  Trash2, 
  Search, 
  Wifi, 
  Tag, 
  Printer, 
  Download, 
  FileSpreadsheet, 
  FileText, 
  RefreshCw,
  Clock,
  UserCheck,
  ZapOff,
  UserPlus,
  Compass,
  Layers,
  Sparkles,
  Info,
  Edit
} from 'lucide-react';
import { HotspotUser, HotspotProfile, HotspotActive, VoucherGenerateOptions } from '../types';
import VoucherCard from './VoucherCard';

interface HotspotTabProps {
  users: HotspotUser[];
  profiles: HotspotProfile[];
  activeSessions: HotspotActive[];
  dnsName?: string;
  hotspotName?: string;
  onAddUser: (user: Partial<HotspotUser>) => Promise<any>;
  onUpdateUser: (id: string, user: Partial<HotspotUser>) => Promise<any>;
  onBatchGenerate: (options: VoucherGenerateOptions) => Promise<any>;
  onDeleteUser: (id: string) => Promise<any>;
  onKickSession: (id: string) => Promise<any>;
  onAddProfile: (profile: Partial<HotspotProfile>) => Promise<any>;
  onUpdateProfile: (id: string, profile: Partial<HotspotProfile>) => Promise<any>;
  onDeleteProfile: (id: string) => Promise<any>;
  onRefresh: () => void;
}

export default function HotspotTab({
  users,
  profiles,
  activeSessions,
  dnsName = 'wifi.net',
  hotspotName = 'Mikhmon Hotspot',
  onAddUser,
  onUpdateUser,
  onBatchGenerate,
  onDeleteUser,
  onKickSession,
  onAddProfile,
  onUpdateProfile,
  onDeleteProfile,
  onRefresh
}: HotspotTabProps) {
  // Navigation inside Hotspot Tab: 'users' | 'profiles' | 'active'
  const [subTab, setSubTab] = useState<'users' | 'profiles' | 'active'>('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProfileFilter, setSelectedProfileFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Modals state
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showAddProfileModal, setShowAddProfileModal] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);

  // Editing state
  const [editingUser, setEditingUser] = useState<HotspotUser | null>(null);
  const [editingProfile, setEditingProfile] = useState<HotspotProfile | null>(null);

  // New Single User inputs
  const [newUser, setNewUser] = useState({
    name: '',
    password: '',
    profile: '',
    limitUptime: '',
    limitBytes: '',
    comment: ''
  });

  // New Profile inputs
  const [newProfile, setNewProfile] = useState({
    name: '',
    sharedUsers: 1,
    rateLimit: '',
    price: 3000,
    validity: '1d',
    lockUser: 'no' as 'yes' | 'no'
  });

  // Batch Voucher generator inputs
  const [batchOptions, setBatchOptions] = useState<VoucherGenerateOptions>({
    qty: 20,
    server: 'all',
    userMode: 'username-equals-password',
    nameLength: 4,
    prefix: 'vc-',
    charSet: 'alphanumeric',
    profile: '',
    limitUptime: '1h',
    limitBytes: '',
    comment: 'batch-mikhmon'
  });

  // Load defaults for modals
  React.useEffect(() => {
    if (profiles.length > 0 && !newUser.profile) {
      setNewUser(p => ({ ...p, profile: profiles[0].name }));
      setBatchOptions(b => ({ ...b, profile: profiles[0].name }));
    }
  }, [profiles]);

  // Byte size helper
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (u.comment || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchProfile = selectedProfileFilter === 'all' || u.profile === selectedProfileFilter;
      const matchStatus = statusFilter === 'all' || 
                          (statusFilter === 'active' && u.active) || 
                          (statusFilter === 'inactive' && !u.active);
      return matchSearch && matchProfile && matchStatus;
    });
  }, [users, searchQuery, selectedProfileFilter, statusFilter]);

  // Form Submission Handlers
  const handleCreateSingleUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name) return;
    try {
      await onAddUser({
        name: newUser.name,
        password: newUser.password || newUser.name,
        profile: newUser.profile,
        limitUptime: newUser.limitUptime || undefined,
        limitBytes: newUser.limitBytes ? parseInt(newUser.limitBytes) * 1024 * 1024 : undefined, // MB to Bytes
        comment: newUser.comment || 'single-add'
      });
      setShowAddUserModal(false);
      // Reset
      setNewUser({
        name: '',
        password: '',
        profile: profiles[0]?.name || '',
        limitUptime: '',
        limitBytes: '',
        comment: ''
      });
    } catch (err: any) {
      alert('Error adding user: ' + err.message);
    }
  };

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfile.name) return;
    try {
      await onAddProfile(newProfile);
      setShowAddProfileModal(false);
      setNewProfile({
        name: '',
        sharedUsers: 1,
        rateLimit: '',
        price: 3000,
        validity: '1d',
        lockUser: 'no'
      });
    } catch (err: any) {
      alert('Error creating profile: ' + err.message);
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
        limitUptime: editingUser.limitUptime || undefined,
        limitBytes: editingUser.limitBytes ? Number(editingUser.limitBytes) : undefined,
        comment: editingUser.comment || undefined,
        disabled: editingUser.disabled
      });
      setEditingUser(null);
    } catch (err: any) {
      alert('Gagal menyimpan perubahan: ' + err.message);
    }
  };

  const handleSaveEditProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProfile) return;
    try {
      await onUpdateProfile(editingProfile.id, {
        name: editingProfile.name,
        sharedUsers: Number(editingProfile.sharedUsers || 1),
        rateLimit: editingProfile.rateLimit || undefined,
        price: editingProfile.price ? Number(editingProfile.price) : undefined,
        validity: editingProfile.validity || undefined,
        lockUser: editingProfile.lockUser
      });
      setEditingProfile(null);
    } catch (err: any) {
      alert('Gagal menyimpan perubahan profile: ' + err.message);
    }
  };

  const handleBatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const commentTag = `vc-${batchOptions.profile}-${new Date().toISOString().substring(0,10).replace(/-/g,'')}`;
      await onBatchGenerate({
        ...batchOptions,
        comment: batchOptions.comment || commentTag
      });
      setShowBatchModal(false);
    } catch (err: any) {
      alert('Error generating batch: ' + err.message);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (filteredUsers.length === 0) return;
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Voucher Code,Password,Profile,Masa Aktif,Bytes In,Bytes Out,Komentar,Status\r\n';
    
    filteredUsers.forEach(u => {
      const row = [
        u.name,
        u.password || u.name,
        u.profile,
        u.limitUptime || 'No limit',
        u.bytesIn,
        u.bytesOut,
        u.comment || '',
        u.active ? 'Active' : u.disabled ? 'Disabled' : 'Inactive'
      ].join(',');
      csvContent += row + '\r\n';
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `voucher_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export PDF / Print handler
  const triggerPrintLayout = () => {
    setShowPrintPreview(true);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div id="hotspot-tab-content" className="space-y-6">
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
            <Wifi className="w-4 h-4" />
            Voucher Hotspot
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
            User Profiles
          </button>
          <button
            onClick={() => setSubTab('active')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              subTab === 'active'
                ? 'bg-sky-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            Sesi Aktif ({activeSessions.length})
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
            <>
              <button
                onClick={handleExportCSV}
                className="px-3.5 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-bold flex items-center gap-2 transition-all"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                CSV Export
              </button>
              <button
                onClick={triggerPrintLayout}
                className="px-3.5 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-bold flex items-center gap-2 transition-all"
              >
                <Printer className="w-4 h-4 text-sky-400" />
                Cetak Tiket
              </button>
              <button
                onClick={() => setShowBatchModal(true)}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-950/20"
              >
                <Sparkles className="w-4 h-4" />
                Generate Batch
              </button>
              <button
                onClick={() => setShowAddUserModal(true)}
                className="px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-sky-950/20"
              >
                <PlusCircle className="w-4 h-4" />
                + Voucher
              </button>
            </>
          )}

          {subTab === 'profiles' && (
            <button
              onClick={() => setShowAddProfileModal(true)}
              className="px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold flex items-center gap-2 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              + Profil Baru
            </button>
          )}
        </div>
      </div>

      {/* SEARCH & FILTERS PANEL (Only on Voucher user tab) */}
      {subTab === 'users' && (
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search box */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Cari kode / komentar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* Profile Selector */}
          <div>
            <select
              value={selectedProfileFilter}
              onChange={(e) => setSelectedProfileFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
            >
              <option value="all">Semua Profile</option>
              {profiles.map(p => (
                <option key={p.id} value={p.name}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Status filter dropdown */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
            >
              <option value="all">Semua Status</option>
              <option value="active">Sedang Aktif</option>
              <option value="inactive">Belum Aktif / Logged Off</option>
            </select>
          </div>

          {/* Summary results */}
          <div className="flex items-center justify-end text-xs text-slate-400 font-medium">
            Menampilkan: <span className="text-sky-400 font-bold ml-1">{filteredUsers.length}</span> / {users.length} vouchers
          </div>
        </div>
      )}

      {/* CONTENT LIST PANELS */}
      {subTab === 'users' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[10px] font-extrabold border-b border-slate-800">
                <tr>
                  <th className="p-4">Kode Voucher</th>
                  <th className="p-4">Password</th>
                  <th className="p-4">User Profile</th>
                  <th className="p-4">Masa Aktif</th>
                  <th className="p-4 text-right">Kuota Bytes</th>
                  <th className="p-4 text-right">Data Terpakai</th>
                  <th className="p-4">Komentar</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-4 font-bold text-white font-mono">{u.name}</td>
                    <td className="p-4 font-mono text-slate-400">{u.password || '-'}</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 bg-sky-500/10 text-sky-400 text-[10px] font-bold rounded uppercase">
                        {u.profile}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-slate-400">{u.limitUptime || 'Unlimited'}</td>
                    <td className="p-4 text-right font-mono font-semibold">
                      {u.limitBytes ? formatBytes(u.limitBytes) : 'No Limit'}
                    </td>
                    <td className="p-4 text-right font-mono text-slate-400">
                      {formatBytes(u.bytesIn + u.bytesOut)}
                    </td>
                    <td className="p-4 text-slate-400 italic font-mono truncate max-w-[150px]" title={u.comment}>
                      {u.comment || '-'}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${
                        u.active 
                          ? 'bg-emerald-500/15 text-emerald-400' 
                          : u.disabled 
                          ? 'bg-rose-500/15 text-rose-400' 
                          : 'bg-slate-800 text-slate-500'
                      }`}>
                        {u.active ? 'Aktif' : u.disabled ? 'Disabled' : 'Offline'}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setEditingUser({ ...u })}
                          className="p-1 text-slate-500 hover:text-sky-400 hover:bg-sky-500/10 rounded transition-all"
                          title="Edit Voucher"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Hapus voucher "${u.name}"?`)) {
                              onDeleteUser(u.id);
                            }
                          }}
                          className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-all"
                          title="Delete User"
                        >
                          <Trash2 className="w-4.5 h-4.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={9} className="p-12 text-center text-slate-500">
                      Tidak ada data voucher hotspot yang cocok dengan pencarian Anda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {subTab === 'profiles' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {profiles.map((p) => (
            <div key={p.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 bg-indigo-500 h-0 group-hover:h-full transition-all"></div>
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-white text-base font-mono">{p.name}</h4>
                  <p className="text-[11px] text-slate-500 font-semibold uppercase mt-0.5">Mikhmon Template Profile</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setEditingProfile({ ...p })}
                    className="p-1.5 text-slate-400 hover:text-sky-400 hover:bg-sky-500/10 rounded-lg transition-all"
                    title="Edit Profil"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Hapus profile "${p.name}"?`)) {
                        onDeleteProfile(p.id);
                      }
                    }}
                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                    title="Hapus Profile"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/60">
                  <span className="text-[9px] text-slate-500 font-bold block uppercase">Shared Users</span>
                  <span className="font-bold text-white font-mono">{p.sharedUsers} Device</span>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/60">
                  <span className="text-[9px] text-slate-500 font-bold block uppercase">Limit Kecepatan</span>
                  <span className="font-bold text-white font-mono">{p.rateLimit || 'No Limit'}</span>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/60">
                  <span className="text-[9px] text-slate-500 font-bold block uppercase">Masa Aktif</span>
                  <span className="font-bold text-white font-mono">{p.validity || 'Unlimited'}</span>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/60">
                  <span className="text-[9px] text-slate-500 font-bold block uppercase">Harga Jual</span>
                  <span className="font-bold text-emerald-400 font-mono">
                    {p.price ? `Rp ${new Intl.NumberFormat('id-ID').format(p.price)}` : 'N/A'}
                  </span>
                </div>
              </div>

              {p.lockUser === 'yes' && (
                <div className="flex items-center gap-1.5 text-[10px] text-amber-500 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20 font-medium">
                  <Info className="w-3.5 h-3.5" />
                  Lock User: Hanya perangkat login pertama yang diizinkan menggunakan voucher ini.
                </div>
              )}
            </div>
          ))}
          {profiles.length === 0 && (
            <div className="col-span-full p-12 text-center text-slate-500 bg-slate-900 border border-slate-800 rounded-2xl">
              Belum ada profile yang terdaftar. Buat baru untuk mengatur harga dan limit.
            </div>
          )}
        </div>
      )}

      {subTab === 'active' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[10px] font-extrabold border-b border-slate-800">
                <tr>
                  <th className="p-4">User</th>
                  <th className="p-4">IP Address</th>
                  <th className="p-4">Mac Address</th>
                  <th className="p-4">Uptime Sesi</th>
                  <th className="p-4 text-right">Bytes In</th>
                  <th className="p-4 text-right">Bytes Out</th>
                  <th className="p-4">Keepalive</th>
                  <th className="p-4 text-center">Aksi Sesi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {activeSessions.map((session) => (
                  <tr key={session.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-4 font-extrabold text-white font-mono flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      {session.user}
                    </td>
                    <td className="p-4 font-mono">{session.address}</td>
                    <td className="p-4 font-mono text-slate-400">{session.macAddress}</td>
                    <td className="p-4 font-mono text-sky-400">{session.uptime}</td>
                    <td className="p-4 text-right font-mono text-slate-400">{formatBytes(session.bytesIn)}</td>
                    <td className="p-4 text-right font-mono text-slate-400">{formatBytes(session.bytesOut)}</td>
                    <td className="p-4 font-mono text-slate-500">{session.keepalive}</td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => {
                          if (confirm(`Kick session / keluarkan user "${session.user}"?`)) {
                            onKickSession(session.id);
                          }
                        }}
                        className="px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500 hover:text-slate-950 text-rose-400 rounded-lg text-[10px] font-extrabold uppercase flex items-center gap-1 mx-auto transition-all"
                        title="Disconnect Device Sesi"
                      >
                        <ZapOff className="w-3.5 h-3.5" />
                        Kick Sesi
                      </button>
                    </td>
                  </tr>
                ))}
                {activeSessions.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-12 text-center text-slate-500">
                      Tidak ada pengguna hotspot yang sedang aktif / berselancar saat ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}


      {/* MODAL: ADD SINGLE VOUCHER USER */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950/40">
              <h3 className="font-bold text-white text-sm uppercase tracking-wide flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-sky-400" />
                Tambah Voucher Hotspot Baru
              </h3>
              <button 
                onClick={() => setShowAddUserModal(false)}
                className="text-slate-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateSingleUser} className="p-5 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Username / Kode Voucher *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. jodi_wifi"
                  value={newUser.name}
                  onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Password (Kosongkan jika sama dengan username)
                </label>
                <input
                  type="text"
                  placeholder="e.g. (sama seperti username)"
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
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
                    Limit Uptime (e.g. 1h, 1d)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 2h atau 1d"
                    value={newUser.limitUptime}
                    onChange={(e) => setNewUser({...newUser, limitUptime: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Limit Kuota (MB)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 1024 (untuk 1GB)"
                    value={newUser.limitBytes}
                    onChange={(e) => setNewUser({...newUser, limitBytes: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Komentar / Note
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Pelanggan Cafe"
                    value={newUser.comment}
                    onChange={(e) => setNewUser({...newUser, comment: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                  />
                </div>
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
                  Simpan Voucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: BATCH VOUCHER GENERATE (Mikhmon Style) */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950/40">
              <h3 className="font-bold text-white text-sm uppercase tracking-wide flex items-center gap-2">
                <Sparkles className="w-4.5 h-4.5 text-indigo-400" />
                Mikhmon Batch Generator (Cetak Voucher Massal)
              </h3>
              <button 
                onClick={() => setShowBatchModal(false)}
                className="text-slate-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleBatchSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Jumlah Voucher (Qty)
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={500}
                    value={batchOptions.qty}
                    onChange={(e) => setBatchOptions({...batchOptions, qty: parseInt(e.target.value)})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Karakter Voucher
                  </label>
                  <select
                    value={batchOptions.charSet}
                    onChange={(e) => setBatchOptions({...batchOptions, charSet: e.target.value as any})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="alphanumeric">Alfanumerik (a1b2c3)</option>
                    <option value="numeric">Angka Saja (129841)</option>
                    <option value="lowercase">Huruf Kecil saja</option>
                    <option value="uppercase">Huruf Besar saja</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Format Mode Login
                  </label>
                  <select
                    value={batchOptions.userMode}
                    onChange={(e) => setBatchOptions({...batchOptions, userMode: e.target.value as any})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="username-equals-password">Username = Password</option>
                    <option value="username-password-separate">Username & Password Beda</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Panjang Kode Voucher
                  </label>
                  <input
                    type="number"
                    min={3}
                    max={12}
                    value={batchOptions.nameLength}
                    onChange={(e) => setBatchOptions({...batchOptions, nameLength: parseInt(e.target.value)})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Prefix Voucher (Awalan)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. vc-"
                    value={batchOptions.prefix}
                    onChange={(e) => setBatchOptions({...batchOptions, prefix: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Template Profile
                  </label>
                  <select
                    value={batchOptions.profile}
                    onChange={(e) => setBatchOptions({...batchOptions, profile: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    {profiles.map(p => (
                      <option key={p.id} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Limit Uptime (e.g. 2h, 1d)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 1h, 1d"
                    value={batchOptions.limitUptime}
                    onChange={(e) => setBatchOptions({...batchOptions, limitUptime: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Limit Kuota Data (e.g. 500MB, 2GB)
                  </label>
                  <input
                    type="text"
                    placeholder="Kosongkan jika unlimited"
                    value={batchOptions.limitBytes}
                    onChange={(e) => setBatchOptions({...batchOptions, limitBytes: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowBatchModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-indigo-950/40 animate-pulse"
                >
                  Generate {batchOptions.qty} Voucher!
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD PROFILE */}
      {showAddProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950/40">
              <h3 className="font-bold text-white text-sm uppercase tracking-wide">
                Tambah Profil Hotspot Baru
              </h3>
              <button 
                onClick={() => setShowAddProfileModal(false)}
                className="text-slate-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateProfile} className="p-5 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Nama Profil (e.g. 1-HARI-5K) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 3-JAM-2K"
                  value={newProfile.name}
                  onChange={(e) => setNewProfile({...newProfile, name: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Shared Users (Device limit)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={newProfile.sharedUsers}
                    onChange={(e) => setNewProfile({...newProfile, sharedUsers: parseInt(e.target.value)})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Rate Limit (Download/Upload)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 2M/2M"
                    value={newProfile.rateLimit}
                    onChange={(e) => setNewProfile({...newProfile, rateLimit: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Harga Jual (Rp)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 5000"
                    value={newProfile.price}
                    onChange={(e) => setNewProfile({...newProfile, price: parseInt(e.target.value)})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Masa Aktif / Validity
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 1d, 12h, 30d"
                    value={newProfile.validity}
                    onChange={(e) => setNewProfile({...newProfile, validity: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Kunci Pengguna (Lock User)?
                </label>
                <select
                  value={newProfile.lockUser}
                  onChange={(e) => setNewProfile({...newProfile, lockUser: e.target.value as any})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                >
                  <option value="no">Tidak (Bisa dipindah perangkat)</option>
                  <option value="yes">Ya (Mengunci Mac Address perangkat login pertama)</option>
                </select>
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
                  Simpan Profil
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* PRINT PREVIEW / FULL PAGE PRINT VOUCHER TICKET LAYOUT OVERLAY */}
      {showPrintPreview && (
        <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-slate-200 p-6 overflow-y-auto select-none print:bg-white print:text-black print:p-0">
          {/* Controls Bar */}
          <div className="flex justify-between items-center border-b border-slate-800 pb-4 mb-6 print:hidden">
            <div>
              <h3 className="text-base font-extrabold text-white">Layout Cetak Tiket Voucher Hotspot</h3>
              <p className="text-xs text-slate-400 mt-1">
                Tampilan layout cetak ramah printer termal/biasa untuk voucher yang aktif terfilter. ({filteredUsers.length} tiket)
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowPrintPreview(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
              >
                Kembali ke Aplikasi
              </button>
              <button
                onClick={handlePrint}
                className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg shadow-sky-950/30"
              >
                <Printer className="w-4 h-4" />
                Cetak / Simpan PDF
              </button>
            </div>
          </div>

          {/* Printable Ticket grid layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 print:grid-cols-3 print:gap-3 print:bg-white">
            {filteredUsers.map((u) => {
              const profObj = profiles.find(p => p.name === u.profile);
              return (
                <VoucherCard
                  key={u.id}
                  user={u}
                  profileObj={profObj}
                  dnsName={dnsName}
                  hotspotName={hotspotName}
                />
              );
            })}
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-24 text-slate-500">
              Belum ada voucher terpilih untuk dicetak. Saring data untuk memulai.
            </div>
          )}
        </div>
      )}

      {/* EDIT USER MODAL */}
      {editingUser && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Wifi className="w-4 h-4 text-sky-400" />
                Edit Voucher Hotspot (Winbox / Mikhmon Style)
              </h3>
              <button 
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-white text-xs font-semibold"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSaveEditUser} className="p-5 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Username / Kode Voucher
                </label>
                <input
                  type="text"
                  required
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Password
                </label>
                <input
                  type="text"
                  value={editingUser.password || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  User Profile
                </label>
                <select
                  value={editingUser.profile}
                  onChange={(e) => setEditingUser({ ...editingUser, profile: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                >
                  {profiles.map(p => (
                    <option key={p.id} value={p.name}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Limit Uptime
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 1h, 12h, 1d"
                    value={editingUser.limitUptime || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, limitUptime: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Limit Bytes (MB)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 1024 for 1GB"
                    value={editingUser.limitBytes ? Math.floor(editingUser.limitBytes / (1024 * 1024)) : ''}
                    onChange={(e) => setEditingUser({ ...editingUser, limitBytes: e.target.value ? Number(e.target.value) * 1024 * 1024 : undefined })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Komentar
                </label>
                <input
                  type="text"
                  value={editingUser.comment || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, comment: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="user-disabled-checkbox"
                  checked={editingUser.disabled || false}
                  onChange={(e) => setEditingUser({ ...editingUser, disabled: e.target.checked })}
                  className="rounded bg-slate-950 border-slate-800 text-sky-500 focus:ring-sky-500 cursor-pointer"
                />
                <label htmlFor="user-disabled-checkbox" className="text-xs font-bold text-slate-400 cursor-pointer select-none uppercase">
                  Disable User (Nonaktifkan Akses)
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

      {/* EDIT PROFILE MODAL */}
      {editingProfile && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-sky-400" />
                Edit Profil Hotspot
              </h3>
              <button 
                onClick={() => setEditingProfile(null)}
                className="text-slate-400 hover:text-white text-xs font-semibold"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSaveEditProfile} className="p-5 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Nama Profil
                </label>
                <input
                  type="text"
                  required
                  value={editingProfile.name}
                  onChange={(e) => setEditingProfile({ ...editingProfile, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-mono font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Shared Users
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={editingProfile.sharedUsers}
                    onChange={(e) => setEditingProfile({ ...editingProfile, sharedUsers: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Rate Limit (Rx/Tx)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 512k/1m, 1m/2m"
                    value={editingProfile.rateLimit || ''}
                    onChange={(e) => setEditingProfile({ ...editingProfile, rateLimit: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Harga Jual (Rupiah)
                  </label>
                  <input
                    type="number"
                    required
                    value={editingProfile.price || 0}
                    onChange={(e) => setEditingProfile({ ...editingProfile, price: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Masa Aktif
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 1d, 12h, 30d"
                    value={editingProfile.validity || ''}
                    onChange={(e) => setEditingProfile({ ...editingProfile, validity: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Kunci Pengguna (Lock User)?
                </label>
                <select
                  value={editingProfile.lockUser}
                  onChange={(e) => setEditingProfile({ ...editingProfile, lockUser: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                >
                  <option value="no">Tidak (Bisa dipindah perangkat)</option>
                  <option value="yes">Ya (Mengunci Mac Address perangkat login pertama)</option>
                </select>
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
