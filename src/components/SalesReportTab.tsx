import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Trash2, 
  Printer, 
  TrendingUp, 
  DollarSign, 
  Calendar,
  Layers,
  Search,
  RefreshCw,
  X
} from 'lucide-react';
import { SalesRecord } from '../types';

interface SalesReportTabProps {
  sales: SalesRecord[];
  onDeleteSale: (id: string) => Promise<any>;
  onClearAllSales?: () => Promise<any>;
  onRefresh: () => void;
}

export default function SalesReportTab({
  sales = [],
  onDeleteSale,
  onClearAllSales,
  onRefresh
}: SalesReportTabProps) {
  // Filter types: 'daily' | 'monthly' | 'yearly' | 'all'
  const [filterMode, setFilterMode] = useState<'daily' | 'monthly' | 'yearly' | 'all'>('all');
  
  // Initialize filter values to today
  const today = new Date();
  const todayStr = today.toISOString().substring(0, 10); // YYYY-MM-DD
  const currentMonthStr = String(today.getMonth() + 1).padStart(2, '0'); // MM
  const currentYearStr = String(today.getFullYear()); // YYYY

  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const [selectedYear, setSelectedYear] = useState(currentYearStr);
  const [searchQuery, setSearchQuery] = useState('');

  // Months list
  const months = [
    { value: '01', name: 'Januari' },
    { value: '02', name: 'Februari' },
    { value: '03', name: 'Maret' },
    { value: '04', name: 'April' },
    { value: '05', name: 'Mei' },
    { value: '06', name: 'Juni' },
    { value: '07', name: 'Juli' },
    { value: '08', name: 'Agustus' },
    { value: '09', name: 'September' },
    { value: '10', name: 'Oktober' },
    { value: '11', name: 'November' },
    { value: '12', name: 'Desember' }
  ];

  // Years list (last 5 years)
  const years = Array.from({ length: 5 }, (_, i) => String(today.getFullYear() - i));

  // Format Rupiah currency
  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Filtered Sales records
  const filteredSales = useMemo(() => {
    return sales.filter(s => {
      // Date format is "YYYY-MM-DD HH:mm:ss"
      // Date part is s.dateTime.substring(0, 10)
      const datePart = s.dateTime.substring(0, 10); // YYYY-MM-DD
      const yearPart = s.dateTime.substring(0, 4); // YYYY
      const monthPart = s.dateTime.substring(5, 7); // MM

      let matchesFilter = true;

      if (filterMode === 'daily') {
        matchesFilter = datePart === selectedDate;
      } else if (filterMode === 'monthly') {
        matchesFilter = yearPart === selectedYear && monthPart === selectedMonth;
      } else if (filterMode === 'yearly') {
        matchesFilter = yearPart === selectedYear;
      }

      const matchesSearch = searchQuery === '' || 
        s.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.profile.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesFilter && matchesSearch;
    });
  }, [sales, filterMode, selectedDate, selectedMonth, selectedYear, searchQuery]);

  // Calculations for stats based on filtered sales
  const stats = useMemo(() => {
    let totalItems = filteredSales.length;
    let totalRevenue = filteredSales.reduce((acc, curr) => acc + curr.price, 0);
    let avgPrice = totalItems > 0 ? Math.round(totalRevenue / totalItems) : 0;

    // Group by profile
    const profileGroups: Record<string, { count: number; revenue: number; validity: string }> = {};
    filteredSales.forEach(s => {
      if (!profileGroups[s.profile]) {
        profileGroups[s.profile] = { count: 0, revenue: 0, validity: s.validity || '-' };
      }
      profileGroups[s.profile].count += 1;
      profileGroups[s.profile].revenue += s.price;
    });

    return {
      totalItems,
      totalRevenue,
      avgPrice,
      profileGroups
    };
  }, [filteredSales]);

  // Trigger browser print for sales report
  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div id="sales-report-container" className="space-y-6">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-800 pb-4 gap-4 print:hidden">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            Laporan Penjualan Voucher Hotspot (Mikhmon v3)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Riwayat penjualan lengkap dengan filter harian, bulanan, dan tahunan layaknya sistem Mikhmon.
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={onRefresh}
            className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:text-white rounded-lg transition-colors text-slate-400"
            title="Refresh Laporan"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handlePrintReport}
            disabled={filteredSales.length === 0}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-lg"
          >
            <Printer className="w-4 h-4" />
            Cetak Laporan
          </button>
        </div>
      </div>

      {/* Filter panel */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl print:hidden space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Mode selector */}
          <div className="flex bg-slate-950 p-1 border border-slate-800/80 rounded-xl text-xs font-bold uppercase shrink-0">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterMode === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Semua Riwayat
            </button>
            <button
              onClick={() => setFilterMode('daily')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterMode === 'daily' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Harian
            </button>
            <button
              onClick={() => setFilterMode('monthly')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterMode === 'monthly' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Bulanan
            </button>
            <button
              onClick={() => setFilterMode('yearly')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterMode === 'yearly' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Tahunan
            </button>
          </div>

          {/* Search bar */}
          <div className="relative flex-1 max-w-xs min-w-[200px]">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Cari voucher / profile..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-medium"
            />
          </div>
        </div>

        {/* Dynamic inputs based on mode */}
        {filterMode !== 'all' && (
          <div className="flex flex-wrap gap-4 items-end bg-slate-950/40 p-4 rounded-xl border border-slate-800/50">
            {filterMode === 'daily' && (
              <div className="space-y-1 w-full max-w-xs">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                  Pilih Tanggal Laporan *
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            )}

            {filterMode === 'monthly' && (
              <div className="grid grid-cols-2 gap-3 w-full max-w-md">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Pilih Bulan
                  </label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-medium cursor-pointer"
                  >
                    {months.map(m => (
                      <option key={m.value} value={m.value}>{m.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Pilih Tahun
                  </label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono cursor-pointer"
                  >
                    {years.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {filterMode === 'yearly' && (
              <div className="space-y-1 w-full max-w-xs">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Pilih Tahun Laporan *
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono cursor-pointer"
                >
                  {years.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Quick Helper Labels */}
            <div className="text-[10px] font-medium text-slate-500 self-center">
              Menampilkan laporan untuk:{' '}
              <span className="text-indigo-400 font-bold font-mono uppercase bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                {filterMode === 'daily' && selectedDate}
                {filterMode === 'monthly' && `${months.find(m => m.value === selectedMonth)?.name} ${selectedYear}`}
                {filterMode === 'yearly' && `Tahun ${selectedYear}`}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
              Voucher Terjual
            </span>
            <p className="text-2xl font-black text-white font-mono">{stats.totalItems} <span className="text-xs text-slate-400 font-normal">lembar</span></p>
          </div>
          <div className="w-10 h-10 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl flex items-center justify-center shadow-lg">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold text-emerald-500 uppercase tracking-wider block">
              Total Pendapatan
            </span>
            <p className="text-2xl font-black text-emerald-400 font-mono">{formatRupiah(stats.totalRevenue)}</p>
          </div>
          <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl flex items-center justify-center shadow-lg">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
              Rata-rata per Voucher
            </span>
            <p className="text-2xl font-black text-white font-mono">{formatRupiah(stats.avgPrice)}</p>
          </div>
          <div className="w-10 h-10 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl flex items-center justify-center shadow-lg">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Profile Breakdown Table */}
      {Object.keys(stats.profileGroups).length > 0 && (
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Rincian Pendapatan per Profil Hotspot
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {(Object.entries(stats.profileGroups) as [string, { count: number; revenue: number; validity: string }][]).map(([prof, data]) => (
              <div key={prof} className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl flex justify-between items-center text-xs">
                <div>
                  <h4 className="font-extrabold text-white">{prof}</h4>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">Masa aktif: {data.validity}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono font-black text-white">{formatRupiah(data.revenue)}</p>
                  <p className="text-[10px] text-slate-400 font-semibold font-mono">{data.count} Voucher</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main transactions list */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/20 print:hidden">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Detail Transaksi Penjualan ({filteredSales.length} baris)
          </span>
          {onClearAllSales && filteredSales.length > 0 && (
            <button
              onClick={() => {
                if (confirm('Hapus semua riwayat penjualan yang tercatat? Tindakan ini tidak dapat dibatalkan.')) {
                  onClearAllSales();
                }
              }}
              className="px-2.5 py-1.5 text-rose-400 hover:text-slate-950 hover:bg-rose-500 border border-rose-500/20 rounded-lg text-[10px] font-extrabold uppercase transition-all"
            >
              Kosongkan Database
            </button>
          )}
        </div>

        {/* Printable header */}
        <div className="hidden print:block p-6 text-center border-b border-slate-300 bg-white text-black">
          <h1 className="text-lg font-black uppercase">LAPORAN PENJUALAN MIKHMON V3</h1>
          <p className="text-xs font-semibold uppercase mt-1">Sesi: Hotspot Voucher Penjualan</p>
          <p className="text-xs font-semibold uppercase mt-1">
            Periode:{' '}
            {filterMode === 'all' && 'Semua Riwayat Terdaftar'}
            {filterMode === 'daily' && `Tanggal: ${selectedDate}`}
            {filterMode === 'monthly' && `Bulan: ${months.find(m => m.value === selectedMonth)?.name} ${selectedYear}`}
            {filterMode === 'yearly' && `Tahun: ${selectedYear}`}
          </p>
          <div className="grid grid-cols-3 gap-2 border-t border-slate-300 mt-4 pt-3 text-xs text-left">
            <div><strong>Total Voucher:</strong> {stats.totalItems} lembar</div>
            <div><strong>Total Pendapatan:</strong> {formatRupiah(stats.totalRevenue)}</div>
            <div><strong>Rata-rata:</strong> {formatRupiah(stats.avgPrice)}</div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300 border-collapse print:text-black print:bg-white">
            <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[10px] font-extrabold border-b border-slate-800 print:bg-slate-200 print:text-black print:border-slate-300">
              <tr>
                <th className="p-4 text-center w-12">No</th>
                <th className="p-4">Tanggal & Waktu</th>
                <th className="p-4">Nama Voucher / Kode</th>
                <th className="p-4">Profil Hotspot</th>
                <th className="p-4">Masa Aktif</th>
                <th className="p-4 text-right">Harga Jual (Rp)</th>
                <th className="p-4 text-center print:hidden w-20">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 print:divide-slate-300">
              {filteredSales.map((sale, index) => (
                <tr key={sale.id} className="hover:bg-slate-800/30 transition-colors print:hover:bg-transparent print:bg-white text-slate-300 print:text-black">
                  <td className="p-4 text-center font-mono text-slate-500 print:text-black">{index + 1}</td>
                  <td className="p-4 font-mono">{sale.dateTime}</td>
                  <td className="p-4 font-extrabold text-white font-mono print:text-black">{sale.username}</td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 bg-slate-950 text-indigo-400 rounded-md border border-slate-800 font-semibold font-mono text-[10px] print:bg-transparent print:border-none print:text-black print:px-0">
                      {sale.profile}
                    </span>
                  </td>
                  <td className="p-4 font-mono">{sale.validity || '-'}</td>
                  <td className="p-4 text-right font-mono font-bold text-white print:text-black">
                    {formatRupiah(sale.price)}
                  </td>
                  <td className="p-4 text-center print:hidden">
                    <button
                      onClick={() => {
                        if (confirm(`Hapus catatan penjualan untuk user "${sale.username}"?`)) {
                          onDeleteSale(sale.id);
                        }
                      }}
                      className="p-1.5 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-slate-950 rounded-lg transition-all mx-auto"
                      title="Hapus Catatan"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredSales.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-500 bg-slate-950/20 print:bg-white print:text-black">
                    Tidak ada catatan penjualan yang sesuai dengan filter terpilih.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
