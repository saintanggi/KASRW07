import React from 'react';
import { FileText, Download, FileSpreadsheet, Printer, Calendar, Filter } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { monthlyData, anggaranData } from '../data/mockData';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
};

const Laporan: React.FC = () => {
  const reportTypes = [
    { id: 1, nama: 'Laporan Arus Kas', deskripsi: 'Laporan arus kas masuk dan keluar per periode', icon: '💰', format: ['PDF', 'Excel'] },
    { id: 2, nama: 'Laporan Realisasi Anggaran', deskripsi: 'Perbandingan anggaran vs realisasi per pos', icon: '📊', format: ['PDF', 'Excel'] },
    { id: 3, nama: 'Buku Besar / Jurnal', deskripsi: 'Catatan jurnal transaksi debit dan kredit', icon: '📖', format: ['PDF', 'Excel', 'CSV'] },
    { id: 4, nama: 'Laporan Penerimaan', deskripsi: 'Daftar penerimaan dan donatur', icon: '📥', format: ['PDF', 'Excel'] },
    { id: 5, nama: 'Laporan Pengeluaran', deskripsi: 'Daftar pengeluaran per program/RT', icon: '📤', format: ['PDF', 'Excel'] },
    { id: 6, nama: 'Rekonsiliasi Bank', deskripsi: 'Pencocokan catatan dengan mutasi bank', icon: '🏦', format: ['PDF', 'Excel'] },
    { id: 7, nama: 'Laporan Iuran Warga', deskripsi: 'Status tagihan, terlunasi, dan terlambat', icon: '👥', format: ['PDF', 'Excel', 'CSV'] },
    { id: 8, nama: 'Laporan Aset', deskripsi: 'Daftar aset dan penyusutan', icon: '🏢', format: ['PDF', 'Excel'] },
    { id: 9, nama: 'Audit Trail', deskripsi: 'Log lengkap perubahan data', icon: '🔍', format: ['PDF', 'CSV'] },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
            <FileText className="w-6 h-6 text-teal-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Laporan</h1>
            <p className="text-gray-500 text-sm">Generate dan ekspor laporan keuangan RW 05</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <select className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
              <option>Desember 2024</option>
              <option>November 2024</option>
              <option>Oktober 2024</option>
              <option>Q4 2024</option>
              <option>Tahun 2024</option>
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
            <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2">
              <Printer className="w-4 h-4" /> Cetak
            </button>
            <button className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 flex items-center gap-2">
              <Download className="w-4 h-4" /> Generate Semua
            </button>
          </div>
        </div>
      </div>

      {/* Report Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reportTypes.map((report) => (
          <div key={report.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <span className="text-2xl">{report.icon}</span>
              <div className="flex gap-1">
                {report.format.map((fmt) => (
                  <button key={fmt} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded hover:bg-teal-100 hover:text-teal-700 transition-colors">
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
              <button className="flex-1 text-xs bg-teal-600 text-white py-2 rounded-md hover:bg-teal-700 flex items-center justify-center gap-1 font-medium">
                <Download className="w-3 h-3" /> Unduh
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Preview - Arus Kas */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Preview: Laporan Arus Kas (12 Bulan)</h3>
          <button className="text-sm text-teal-600 hover:text-teal-700 flex items-center gap-1">
            <Download className="w-4 h-4" /> Unduh PDF
          </button>
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="bulan" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}jt`} />
            <Tooltip formatter={(value: number) => formatCurrency(value)} />
            <Line type="monotone" dataKey="pemasukan" stroke="#10b981" strokeWidth={2} name="Pemasukan" />
            <Line type="monotone" dataKey="pengeluaran" stroke="#ef4444" strokeWidth={2} name="Pengeluaran" />
          </LineChart>
        </ResponsiveContainer>
        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
          <div className="p-3 bg-emerald-50 rounded-lg">
            <p className="text-xs text-emerald-600">Total Pemasukan</p>
            <p className="text-lg font-bold text-emerald-700">{formatCurrency(monthlyData.reduce((s, d) => s + d.pemasukan, 0))}</p>
          </div>
          <div className="p-3 bg-red-50 rounded-lg">
            <p className="text-xs text-red-600">Total Pengeluaran</p>
            <p className="text-lg font-bold text-red-700">{formatCurrency(monthlyData.reduce((s, d) => s + d.pengeluaran, 0))}</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-600">Surplus</p>
            <p className="text-lg font-bold text-blue-700">{formatCurrency(monthlyData.reduce((s, d) => s + d.pemasukan - d.pengeluaran, 0))}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Laporan;
