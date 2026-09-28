import React, { useState } from 'react';
import { Users, CheckCircle, XCircle, Bell, Download, Plus, Search, Filter } from 'lucide-react';
import { wargaData } from '../data/mockData';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
};

const Iuran: React.FC = () => {
  const [filterRT, setFilterRT] = useState('semua');
  const [filterStatus, setFilterStatus] = useState('semua');
  const [searchTerm, setSearchTerm] = useState('');

  const totalWarga = wargaData.length;
  const totalLunas = wargaData.filter(w => w.status === 'lunas').length;
  const totalBelum = wargaData.filter(w => w.status === 'belum').length;
  const totalTagihan = wargaData.reduce((sum, w) => sum + w.tagihan, 0);
  const totalTerkumpul = wargaData.filter(w => w.status === 'lunas').reduce((sum, w) => sum + w.tagihan, 0);

  const filteredWarga = wargaData.filter((w) => {
    const matchesRT = filterRT === 'semua' || w.rt === filterRT;
    const matchesStatus = filterStatus === 'semua' || w.status === filterStatus;
    const matchesSearch = w.nama.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesRT && matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
            <Users className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Iuran Warga</h1>
            <p className="text-gray-500 text-sm">Kelola iuran bulanan warga RW 05</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2">
            <Bell className="w-4 h-4" /> Kirim Pengingat
          </button>
          <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2">
            <Download className="w-4 h-4" /> Ekspor
          </button>
          <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center gap-2">
            <Plus className="w-4 h-4" /> Input Iuran
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Total Warga</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{totalWarga}</p>
          <p className="text-xs text-gray-400 mt-1">Warga terdaftar</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Sudah Bayar</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{totalLunas}</p>
          <p className="text-xs text-emerald-500 mt-1">{Math.round((totalLunas / totalWarga) * 100)}% dari total</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Belum Bayar</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{totalBelum}</p>
          <p className="text-xs text-red-500 mt-1">{Math.round((totalBelum / totalWarga) * 100)}% dari total</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Terkumpul</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{formatCurrency(totalTerkumpul)}</p>
          <p className="text-xs text-blue-500 mt-1">dari {formatCurrency(totalTagihan)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari nama warga..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select value={filterRT} onChange={(e) => setFilterRT(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="semua">Semua RT</option>
              <option value="RT 01">RT 01</option>
              <option value="RT 02">RT 02</option>
              <option value="RT 03">RT 03</option>
              <option value="RT 04">RT 04</option>
              <option value="RT 05">RT 05</option>
            </select>
          </div>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="semua">Semua Status</option>
            <option value="lunas">Lunas</option>
            <option value="belum">Belum Bayar</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="text-left text-xs text-gray-500 uppercase">
                <th className="px-4 py-3 font-medium">Nama Warga</th>
                <th className="px-4 py-3 font-medium">RT</th>
                <th className="px-4 py-3 font-medium">NIK</th>
                <th className="px-4 py-3 font-medium">Periode</th>
                <th className="px-4 py-3 font-medium">Tagihan</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredWarga.map((warga) => (
                <tr key={warga.id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-indigo-600">{warga.nama.split(' ').map(n => n[0]).join('').slice(0, 2)}</span>
                      </div>
                      <span className="text-sm font-medium text-gray-800">{warga.nama}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{warga.rt}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 font-mono">{warga.nik}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{warga.periode}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-800">{formatCurrency(warga.tagihan)}</td>
                  <td className="px-4 py-3">
                    {warga.status === 'lunas' ? (
                      <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-green-100 text-green-700 font-medium">
                        <CheckCircle className="w-3 h-3" /> Lunas
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-red-100 text-red-700 font-medium">
                        <XCircle className="w-3 h-3" /> Belum
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {warga.status === 'belum' && (
                        <button className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-md hover:bg-emerald-700">
                          Catat Bayar
                        </button>
                      )}
                      <button className="text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-md hover:bg-gray-200">
                        Detail
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <p className="text-sm text-gray-500">Menampilkan {filteredWarga.length} warga</p>
          <div className="flex items-center gap-1">
            <button className="px-3 py-1 text-sm border border-gray-200 rounded hover:bg-gray-100">Sebelumnya</button>
            <button className="px-3 py-1 text-sm bg-indigo-600 text-white rounded">1</button>
            <button className="px-3 py-1 text-sm border border-gray-200 rounded hover:bg-gray-100">Berikutnya</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Iuran;
