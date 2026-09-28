import React from 'react';
import { Building2, Wallet, ArrowDownCircle, ArrowUpCircle, RefreshCw, Download, Plus, Database, Loader2 } from 'lucide-react';
import { useRekening } from '../hooks/useSupabaseData';
import { recentTransactions } from '../data/mockData';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
};

const KasBank: React.FC = () => {
  const { data: rekeningData, loading } = useRekening();
  const totalSaldo = rekeningData.reduce((sum: number, r: any) => sum + r.saldo, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-3" />
          <p className="text-gray-600 font-medium">Memuat data kas & bank...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <Building2 className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Kas & Bank</h1>
            <p className="text-gray-500 text-sm">Kelola saldo kas dan rekening bank RW 05</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> Rekonsiliasi
          </button>
          <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2">
            <Download className="w-4 h-4" /> Mutasi
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2">
            <Plus className="w-4 h-4" /> Catat Mutasi
          </button>
        </div>
      </div>

      {/* Total Balance */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
        <p className="text-blue-200 text-sm">Total Saldo Semua Rekening</p>
        <p className="text-3xl font-bold mt-1">{formatCurrency(totalSaldo)}</p>
        <div className="flex gap-6 mt-4">
          <div>
            <p className="text-blue-200 text-xs">Kas Tunai</p>
            <p className="text-lg font-semibold">{formatCurrency(rekeningData[0].saldo)}</p>
          </div>
          <div>
            <p className="text-blue-200 text-xs">Rekening Bank</p>
            <p className="text-lg font-semibold">{formatCurrency(rekeningData[1].saldo + rekeningData[2].saldo)}</p>
          </div>
        </div>
      </div>

      {/* Rekening Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {rekeningData.map((rek) => (
          <div key={rek.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {rek.jenis === 'kas' ? (
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-emerald-600" />
                  </div>
                ) : (
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-blue-600" />
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-800">{rek.nama}</p>
                  <p className="text-xs text-gray-500">{rek.jenis === 'kas' ? 'Kas Kecil' : rek.bank}</p>
                </div>
              </div>
            </div>
            {rek.nomor !== '-' && <p className="text-xs text-gray-400 mb-2">No. Rek: {rek.nomor}</p>}
            <p className="text-2xl font-bold text-gray-800">{formatCurrency(rek.saldo)}</p>
            <div className="flex gap-2 mt-3">
              <button className="flex-1 text-xs bg-emerald-50 text-emerald-700 py-1.5 rounded-md hover:bg-emerald-100 flex items-center justify-center gap-1">
                <ArrowDownCircle className="w-3 h-3" /> Masuk
              </button>
              <button className="flex-1 text-xs bg-red-50 text-red-700 py-1.5 rounded-md hover:bg-red-100 flex items-center justify-center gap-1">
                <ArrowUpCircle className="w-3 h-3" /> Keluar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Buku Kas Harian */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">Buku Kas Harian</h3>
          <div className="flex gap-2">
            <select className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm">
              <option>Desember 2024</option>
              <option>November 2024</option>
            </select>
            <select className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm">
              <option>Semua Rekening</option>
              <option>Kas Tunai</option>
              <option>Bank BSI</option>
              <option>Bank Mandiri</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="text-left text-xs text-gray-500 uppercase">
                <th className="px-4 py-3 font-medium">Tanggal</th>
                <th className="px-4 py-3 font-medium">Keterangan</th>
                <th className="px-4 py-3 font-medium">Rekening</th>
                <th className="px-4 py-3 font-medium">Debit (Masuk)</th>
                <th className="px-4 py-3 font-medium">Kredit (Keluar)</th>
                <th className="px-4 py-3 font-medium">Saldo</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-gray-50 bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-500" colSpan={3}>Saldo Awal</td>
                <td className="px-4 py-3 text-sm text-gray-500">-</td>
                <td className="px-4 py-3 text-sm text-gray-500">-</td>
                <td className="px-4 py-3 text-sm font-semibold text-gray-800">{formatCurrency(totalSaldo)}</td>
              </tr>
              {recentTransactions.slice(0, 6).map((trx, index) => (
                <tr key={trx.id} className="border-t border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-600">{trx.tanggal}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{trx.sumber}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">Kas Tunai</td>
                  <td className="px-4 py-3 text-sm text-emerald-600 font-medium">
                    {trx.tipe === 'penerimaan' ? formatCurrency(trx.nominal) : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-red-600 font-medium">
                    {trx.tipe === 'pengeluaran' ? formatCurrency(trx.nominal) : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-800">
                    {formatCurrency(totalSaldo + (index + 1) * 100000)}
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

export default KasBank;
