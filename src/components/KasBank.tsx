import React from 'react';
import { Building2, Wallet, ArrowDownCircle, ArrowUpCircle, RefreshCw, Download, Plus, Database, Loader2 } from 'lucide-react';
import { useRekening } from '../hooks/useSupabaseData';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
};

const KasBank: React.FC = () => {
  const { data: rekeningData, loading, saving, error, refresh, create, remove } = useRekening();
  const totalSaldo = rekeningData.reduce((sum: number, r: any) => sum + r.saldo, 0);

  const handleAdd = async () => {
    const nama = window.prompt('Nama rekening/kas:', 'Kas Tunai RW 07');
    if (!nama) return;
    const jenis = window.prompt('Jenis rekening: ketik kas atau bank', 'kas') || 'kas';
    const bank = jenis === 'bank' ? (window.prompt('Nama bank:', 'Bank Utama') || '') : '';
    const nomor = jenis === 'bank' ? (window.prompt('Nomor rekening:', '') || '') : '';
    const saldoText = window.prompt('Saldo awal:', '0') || '0';
    try {
      await create({ nama, jenis: jenis === 'bank' ? 'bank' : 'kas', bank, nomor, saldo_awal: Number(saldoText) });
      alert('Rekening berhasil ditambahkan.');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gagal menambah rekening.');
    }
  };

  const handleDelete = async (rek: any) => {
    if (!window.confirm(`Hapus ${rek.nama}? Pastikan tidak ada transaksi terkait.`)) return;
    try {
      await remove(rek.id);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gagal menghapus rekening.');
    }
  };

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
          <button onClick={handleAdd} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2 disabled:opacity-60">
            <Plus className="w-4 h-4" /> Tambah Rekening
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
            <button onClick={() => handleDelete(rek)} className="mt-3 text-xs text-red-600 hover:text-red-700">Hapus rekening</button>
          </div>
        ))}
        {rekeningData.length === 0 && (
          <div className="md:col-span-3 bg-white rounded-xl p-8 text-center border border-dashed border-gray-200 text-gray-500">
            Belum ada rekening/kas. Klik <b>Tambah Rekening</b> untuk mulai.
          </div>
        )}
      </div>
    </div>
  );
};

export default KasBank;
