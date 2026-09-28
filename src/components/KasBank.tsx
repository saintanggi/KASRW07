import React from 'react';
import { Building2, Wallet, ArrowDownCircle, ArrowUpCircle, RefreshCw, Download, Plus, Database, Loader2 } from 'lucide-react';
import { useRekening } from '../hooks/useSupabaseData';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
};

const KasBank: React.FC = () => {
  const { data: rekeningData, loading, error, refresh } = useRekening();
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
      {/* Connection Status */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-3">
        <Database className="w-5 h-5 text-emerald-600" />
        <div className="flex-1">
          <p className="text-sm font-medium text-emerald-800">✅ Data rekening dari Supabase</p>
          {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
        </div>
        <button onClick={refresh} className="text-xs px-3 py-1.5 bg-white border border-emerald-200 text-emerald-700 rounded-lg hover:bg-emerald-100">Refresh</button>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <Building2 className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Kas & Bank</h1>
            <p className="text-gray-500 text-sm">Kelola saldo kas dan rekening bank RW 07</p>
          </div>
        </div>
        <div className="flex gap-2">
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
      </div>

      {/* Rekening Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {rekeningData.map((rek: any) => (
          <div key={rek.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-3">
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
            {rek.nomor !== '-' && <p className="text-xs text-gray-400 mb-2">No. Rek: {rek.nomor}</p>}
            <p className="text-2xl font-bold text-gray-800">{formatCurrency(rek.saldo)}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default KasBank;
