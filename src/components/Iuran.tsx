import React, { useState } from 'react';
import { Users, CheckCircle, XCircle, Download, Plus, Search, Database, Loader2, RefreshCw } from 'lucide-react';
import { currentPeriod, useIuran } from '../hooks/useSupabaseData';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
};

const Iuran: React.FC = () => {
  const { data: wargaData, loading, saving, error, refresh, markPaid, generateIuranForPeriod } = useIuran();
  const [filterRT, setFilterRT] = useState('semua');
  const [filterStatus, setFilterStatus] = useState('semua');
  const [searchTerm, setSearchTerm] = useState('');

  const totalWarga = wargaData.length;
  const totalLunas = wargaData.filter((w: any) => w.status === 'lunas').length;
  const totalBelum = wargaData.filter((w: any) => w.status === 'belum').length;
  const totalTagihan = wargaData.reduce((sum: number, w: any) => sum + w.tagihan, 0);
  const totalTerkumpul = wargaData.filter((w: any) => w.status === 'lunas').reduce((sum: number, w: any) => sum + w.jumlah_bayar, 0);
  const rtOptions = Array.from(new Set(wargaData.map((w: any) => w.rt).filter(Boolean))).sort();

  const handleGenerateIuran = async () => {
    const periode = window.prompt('Masukkan periode iuran (format YYYY-MM):', currentPeriod());
    if (!periode) return;
    const amountText = window.prompt('Masukkan nominal tagihan per warga:', '50000');
    if (!amountText) return;
    try {
      const inserted = await generateIuranForPeriod(periode, Number(amountText));
      alert(`Berhasil membuat ${inserted} tagihan baru. Data yang sudah ada tidak diduplikasi.`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gagal membuat iuran.');
    }
  };

  const filteredWarga = wargaData.filter((w: any) => {
    const matchesRT = filterRT === 'semua' || w.rt === filterRT;
    const matchesStatus = filterStatus === 'semua' || w.status === filterStatus;
    const matchesSearch = w.nama.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesRT && matchesStatus && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mx-auto mb-3" />
          <p className="text-gray-600 font-medium">Memuat data iuran warga...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-3">
        <Database className="w-5 h-5 text-emerald-600" />
        <div className="flex-1">
          <p className="text-sm font-medium text-emerald-800">✅ Data iuran dari Supabase</p>
          {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
        </div>
        <button onClick={refresh} className="text-xs px-3 py-1.5 bg-white border border-emerald-200 text-emerald-700 rounded-lg hover:bg-emerald-100 flex items-center gap-1">
          <RefreshCw className="w-3 h-3" /> Refresh
        </button>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
            <Users className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Iuran Warga</h1>
            <p className="text-gray-500 text-sm">Kelola iuran bulanan warga RW 07</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2">
            <Download className="w-4 h-4" /> Ekspor
          </button>
          <button onClick={handleGenerateIuran} disabled={saving} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center gap-2 disabled:opacity-60">
            <Plus className="w-4 h-4" /> {saving ? 'Memproses...' : 'Generate Iuran'}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Total Warga</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{totalWarga}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Sudah Bayar</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{totalLunas}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Belum Bayar</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{totalBelum}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Terkumpul</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{formatCurrency(totalTerkumpul)}</p>
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
          <select value={filterRT} onChange={(e) => setFilterRT(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
            <option value="semua">Semua RT</option>
            {rtOptions.map((rt) => <option key={rt} value={rt}>{rt}</option>)}
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
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
              {filteredWarga.map((warga: any) => (
                <tr key={warga.id} className="border-t border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-800">{warga.nama}</td>
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
                    {warga.status !== 'lunas' && (
                      <button disabled={saving} onClick={() => markPaid(warga.id)} className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-md hover:bg-emerald-700 disabled:opacity-60">
                        Catat Bayar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Iuran;
