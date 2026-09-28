import React from 'react';
import { ClipboardList, Package, Plus, Download, Edit, Trash2, Database, Loader2 } from 'lucide-react';
import { useAset } from '../hooks/useSupabaseData';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
};

const Aset: React.FC = () => {
  const { data: asetData, loading } = useAset();
  const totalNilai = asetData.reduce((sum: number, a: any) => sum + a.nilai, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-amber-600 animate-spin mx-auto mb-3" />
          <p className="text-gray-600 font-medium">Memuat data inventaris...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-3">
        <Database className="w-5 h-5 text-emerald-600" />
        <p className="text-sm font-medium text-emerald-800">✅ Data aset dari Supabase</p>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
            <ClipboardList className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Inventaris & Aset</h1>
            <p className="text-gray-500 text-sm">Kelola aset dan inventaris RW 05</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2">
            <Download className="w-4 h-4" /> Ekspor
          </button>
          <button className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 flex items-center gap-2">
            <Plus className="w-4 h-4" /> Tambah Aset
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Total Aset</p>
          <p className="text-xl font-bold text-gray-800">{asetData.length} item</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Nilai Total Aset</p>
          <p className="text-xl font-bold text-gray-800">{formatCurrency(totalNilai)}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Kondisi Baik</p>
          <p className="text-xl font-bold text-gray-800">{asetData.filter((a: any) => a.kondisi === 'Baik').length} item</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="text-left text-xs text-gray-500 uppercase">
                <th className="px-4 py-3 font-medium">Kode</th>
                <th className="px-4 py-3 font-medium">Nama Aset</th>
                <th className="px-4 py-3 font-medium">Kategori</th>
                <th className="px-4 py-3 font-medium">Nilai Perolehan</th>
                <th className="px-4 py-3 font-medium">Lokasi</th>
                <th className="px-4 py-3 font-medium">Kondisi</th>
                <th className="px-4 py-3 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {asetData.map((aset: any) => (
                <tr key={aset.kode} className="border-t border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-mono font-medium text-gray-800">{aset.kode}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-800">{aset.nama}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">{aset.kategori}</span>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-800">{formatCurrency(aset.nilai)}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{aset.lokasi}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium
                      ${aset.kondisi === 'Baik' ? 'bg-green-100 text-green-700' :
                        aset.kondisi === 'Cukup' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'}`}>
                      {aset.kondisi}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
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

export default Aset;
