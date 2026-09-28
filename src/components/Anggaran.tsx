import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Wallet, TrendingUp, AlertTriangle, Plus, Download, Database, Loader2 } from 'lucide-react';
import { useAnggaran } from '../hooks/useSupabaseData';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
};

const Anggaran: React.FC = () => {
  const { data: anggaranData, loading } = useAnggaran();
  const totalAnggaran = anggaranData.reduce((sum: number, item: any) => sum + item.anggaran, 0);
  const totalRealisasi = anggaranData.reduce((sum: number, item: any) => sum + item.realisasi, 0);
  const sisaAnggaran = totalAnggaran - totalRealisasi;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-purple-600 animate-spin mx-auto mb-3" />
          <p className="text-gray-600 font-medium">Memuat data anggaran...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
            <Wallet className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Anggaran</h1>
            <p className="text-gray-500 text-sm">Rencana dan realisasi anggaran RW 05 Tahun 2024</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2">
            <Download className="w-4 h-4" /> Ekspor
          </button>
          <button className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 flex items-center gap-2">
            <Plus className="w-4 h-4" /> Tambah Anggaran
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Total Anggaran</p>
          <p className="text-xl font-bold text-gray-800 mt-1">{formatCurrency(totalAnggaran)}</p>
          <p className="text-xs text-gray-400 mt-1">Tahun 2024</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Total Realisasi</p>
          <p className="text-xl font-bold text-emerald-600 mt-1">{formatCurrency(totalRealisasi)}</p>
          <p className="text-xs text-emerald-500 mt-1">{Math.round((totalRealisasi / totalAnggaran) * 100)}% dari anggaran</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Sisa Anggaran</p>
          <p className="text-xl font-bold text-blue-600 mt-1">{formatCurrency(sisaAnggaran)}</p>
          <p className="text-xs text-blue-500 mt-1">{Math.round((sisaAnggaran / totalAnggaran) * 100)}% tersisa</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Status</p>
          <div className="flex items-center gap-2 mt-1">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            <p className="text-lg font-bold text-yellow-600">On Track</p>
          </div>
          <p className="text-xs text-gray-400 mt-1">Realisasi sesuai target</p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Perbandingan Anggaran vs Realisasi</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={anggaranData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="pos" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}jt`} />
            <Tooltip formatter={(value: number) => formatCurrency(value)} />
            <Legend />
            <Bar dataKey="anggaran" fill="#8b5cf6" name="Anggaran" radius={[4, 4, 0, 0]} />
            <Bar dataKey="realisasi" fill="#10b981" name="Realisasi" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Detail Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800">Detail Anggaran per Pos</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="text-left text-xs text-gray-500 uppercase">
                <th className="px-4 py-3 font-medium">Pos Anggaran</th>
                <th className="px-4 py-3 font-medium">Anggaran</th>
                <th className="px-4 py-3 font-medium">Realisasi</th>
                <th className="px-4 py-3 font-medium">Sisa</th>
                <th className="px-4 py-3 font-medium">Persentase</th>
                <th className="px-4 py-3 font-medium">Progress</th>
              </tr>
            </thead>
            <tbody>
              {anggaranData.map((item) => {
                const sisa = item.anggaran - item.realisasi;
                const persentase = Math.round((item.realisasi / item.anggaran) * 100);
                return (
                  <tr key={item.pos} className="border-t border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-gray-800">{item.pos}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{formatCurrency(item.anggaran)}</td>
                    <td className="px-4 py-3 text-sm text-emerald-600 font-medium">{formatCurrency(item.realisasi)}</td>
                    <td className="px-4 py-3 text-sm text-blue-600">{formatCurrency(sisa)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-sm font-bold ${persentase > 80 ? 'text-red-600' : persentase > 60 ? 'text-yellow-600' : 'text-emerald-600'}`}>
                        {persentase}%
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="w-full bg-gray-200 rounded-full h-2.5 max-w-[150px]">
                        <div
                          className={`h-2.5 rounded-full ${persentase > 80 ? 'bg-red-500' : persentase > 60 ? 'bg-yellow-500' : 'bg-emerald-500'}`}
                          style={{ width: `${Math.min(persentase, 100)}%` }}
                        ></div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-gray-50 font-semibold">
              <tr className="border-t border-gray-200">
                <td className="px-4 py-3 text-sm text-gray-800">TOTAL</td>
                <td className="px-4 py-3 text-sm text-gray-800">{formatCurrency(totalAnggaran)}</td>
                <td className="px-4 py-3 text-sm text-emerald-600">{formatCurrency(totalRealisasi)}</td>
                <td className="px-4 py-3 text-sm text-blue-600">{formatCurrency(sisaAnggaran)}</td>
                <td className="px-4 py-3 text-sm text-gray-800">{Math.round((totalRealisasi / totalAnggaran) * 100)}%</td>
                <td className="px-4 py-3"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Anggaran;
