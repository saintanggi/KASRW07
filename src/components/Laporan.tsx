import React from 'react';
import { FileText, Download, Printer, Calendar, Filter, Database, Loader2, RefreshCw } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { currentPeriod, formatPeriodLabel, todayISO, useLaporanData } from '../hooks/useSupabaseData';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value || 0);
};

const Laporan: React.FC = () => {
  const {
    monthlyData,
    anggaranData,
    arusKas,
    loading,
    loadingArusKas,
    laporanError,
    error,
    refresh,
    refreshArusKas,
    periodeLabel,
    tahunAnggaran,
  } = useLaporanData();

  const reportTypes = [
    { id: 1, nama: 'Laporan Arus Kas', deskripsi: 'Kas masuk dan keluar per periode', icon: '💰', format: ['CSV'] },
    { id: 2, nama: 'Laporan Realisasi Anggaran', deskripsi: 'Perbandingan anggaran vs realisasi', icon: '📊', format: ['CSV'] },
    { id: 3, nama: 'Laporan Penerimaan', deskripsi: 'Daftar penerimaan valid dan pending', icon: '📥', format: ['CSV'] },
    { id: 4, nama: 'Laporan Pengeluaran', deskripsi: 'Daftar pengeluaran per program', icon: '📤', format: ['CSV'] },
    { id: 5, nama: 'Laporan Iuran Warga', deskripsi: 'Status tagihan dan pembayaran', icon: '👥', format: ['CSV'] },
    { id: 6, nama: 'Audit Trail', deskripsi: 'Log perubahan data sistem', icon: '🔍', format: ['CSV'] },
  ];

  const totalMasuk = arusKas.reduce((sum: number, row: any) => sum + row.masuk, 0);
  const totalKeluar = arusKas.reduce((sum: number, row: any) => sum + row.keluar, 0);

  const exportArusKasCsv = () => {
    const header = ['Tanggal', 'Tipe', 'Referensi', 'Kategori', 'Rekening', 'Uraian', 'Masuk', 'Keluar', 'Status'];
    const rows = arusKas.map((row: any) => [row.tanggal, row.tipe, row.referensi, row.kategori, row.rekening, row.uraian, row.masuk, row.keluar, row.status]);
    const csv = [header, ...rows].map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `laporan-arus-kas-${todayISO()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading || loadingArusKas) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-teal-600 animate-spin mx-auto mb-3" />
          <p className="text-gray-600 font-medium">Memuat laporan dari Supabase...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-3">
        <Database className="w-5 h-5 text-emerald-600" />
        <div className="flex-1">
          <p className="text-sm font-medium text-emerald-800">✅ Laporan memakai data Supabase</p>
          {(error || laporanError) && <p className="text-xs text-red-600 mt-1">{error || laporanError}</p>}
        </div>
        <button onClick={() => { refresh(); refreshArusKas(); }} className="text-xs px-3 py-1.5 bg-white border border-emerald-200 text-emerald-700 rounded-lg hover:bg-emerald-100 flex items-center gap-1">
          <RefreshCw className="w-3 h-3" /> Refresh
        </button>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
            <FileText className="w-6 h-6 text-teal-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Laporan</h1>
            <p className="text-gray-500 text-sm">Generate dan ekspor laporan keuangan RW 07</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <select className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" defaultValue={currentPeriod()}>
              <option value={currentPeriod()}>{periodeLabel || formatPeriodLabel(currentPeriod())}</option>
              <option value={`${tahunAnggaran}`}>Tahun {tahunAnggaran}</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
              <option>Semua RT</option>
              <option>RT 01</option>
              <option>RT 02</option>
              <option>RT 03</option>
              <option>RT 04</option>
              <option>RT 05</option>
            </select>
          </div>
          <div className="ml-auto flex gap-2">
            <button onClick={() => window.print()} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2">
              <Printer className="w-4 h-4" /> Cetak
            </button>
            <button onClick={exportArusKasCsv} className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 flex items-center gap-2">
              <Download className="w-4 h-4" /> Unduh Arus Kas CSV
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reportTypes.map((report) => (
          <div key={report.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <span className="text-2xl">{report.icon}</span>
              <div className="flex gap-1">
                {report.format.map((fmt) => (
                  <button key={fmt} onClick={exportArusKasCsv} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded hover:bg-teal-100 hover:text-teal-700 transition-colors">
                    {fmt}
                  </button>
                ))}
              </div>
            </div>
            <h3 className="text-sm font-semibold text-gray-800 mb-1">{report.nama}</h3>
            <p className="text-xs text-gray-500 mb-4">{report.deskripsi}</p>
            <div className="flex gap-2">
              <button className="flex-1 text-xs bg-teal-50 text-teal-700 py-2 rounded-md hover:bg-teal-100 flex items-center justify-center gap-1 font-medium">
                <FileText className="w-3 h-3" /> Preview
              </button>
              <button onClick={exportArusKasCsv} className="flex-1 text-xs bg-teal-600 text-white py-2 rounded-md hover:bg-teal-700 flex items-center justify-center gap-1 font-medium">
                <Download className="w-3 h-3" /> Unduh
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Arus Kas 12 Bulan</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="bulan" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(Number(v) / 1000000).toFixed(0)}jt`} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Line type="monotone" dataKey="pemasukan" stroke="#10b981" strokeWidth={2} name="Pemasukan" />
              <Line type="monotone" dataKey="pengeluaran" stroke="#ef4444" strokeWidth={2} name="Pengeluaran" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Realisasi Anggaran Tahun {tahunAnggaran}</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={anggaranData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="pos" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(Number(v) / 1000000).toFixed(0)}jt`} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="anggaran" fill="#14b8a6" name="Anggaran" />
              <Bar dataKey="realisasi" fill="#10b981" name="Realisasi" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Preview: Laporan Arus Kas</h3>
          <button onClick={exportArusKasCsv} className="text-sm text-teal-600 hover:text-teal-700 flex items-center gap-1">
            <Download className="w-4 h-4" /> Unduh CSV
          </button>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center mb-4">
          <div className="p-3 bg-emerald-50 rounded-lg">
            <p className="text-xs text-emerald-600">Total Masuk</p>
            <p className="text-lg font-bold text-emerald-700">{formatCurrency(totalMasuk)}</p>
          </div>
          <div className="p-3 bg-red-50 rounded-lg">
            <p className="text-xs text-red-600">Total Keluar</p>
            <p className="text-lg font-bold text-red-700">{formatCurrency(totalKeluar)}</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-600">Saldo Bersih</p>
            <p className="text-lg font-bold text-blue-700">{formatCurrency(totalMasuk - totalKeluar)}</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="text-left text-xs text-gray-500 uppercase">
                <th className="px-4 py-3">Tanggal</th>
                <th className="px-4 py-3">Ref</th>
                <th className="px-4 py-3">Kategori</th>
                <th className="px-4 py-3">Uraian</th>
                <th className="px-4 py-3">Masuk</th>
                <th className="px-4 py-3">Keluar</th>
              </tr>
            </thead>
            <tbody>
              {arusKas.slice(0, 10).map((row: any) => (
                <tr key={`${row.tipe}-${row.referensi}`} className="border-t border-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-600">{row.tanggal}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-800">{row.referensi}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{row.kategori}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 max-w-[280px] truncate">{row.uraian}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-emerald-600">{row.masuk ? formatCurrency(row.masuk) : '-'}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-red-600">{row.keluar ? formatCurrency(row.keluar) : '-'}</td>
                </tr>
              ))}
              {arusKas.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">Belum ada arus kas terverifikasi/lunas.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Laporan;
