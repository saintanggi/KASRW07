import React, { useState } from 'react';
import { Building2, Wallet, Download, Plus, Database, Loader2, RefreshCw, Trash2, X, AlertCircle } from 'lucide-react';
import { todayISO, useRekening } from '../hooks/useSupabaseData';
import type { Permissions } from '../lib/permissions';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value || 0);
};

const initialForm = {
  nama: '',
  jenis: 'kas',
  bank: '',
  nomor: '',
  saldo_awal: '',
};

interface KasBankProps {
  permissions?: Permissions;
}

const KasBank: React.FC<KasBankProps> = ({ permissions }) => {
  const { data: rekeningData, loading, saving, error, refresh, create, remove } = useRekening();
  const canManage = Boolean(permissions?.canManageRekening);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [formError, setFormError] = useState<string | null>(null);
  const totalSaldo = rekeningData.reduce((sum: number, r: any) => sum + r.saldo, 0);

  const openModal = () => {
    if (!canManage) return;
    setForm(initialForm);
    setFormError(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setForm(initialForm);
    setFormError(null);
  };

  const handleSubmit = async () => {
    setFormError(null);
    try {
      if (!canManage) throw new Error('Role Anda tidak boleh mengelola kas/bank.');
      if (!form.nama.trim()) throw new Error('Nama rekening/kas wajib diisi.');
      if (!['kas', 'bank'].includes(form.jenis)) throw new Error('Jenis harus kas atau bank.');
      if (form.jenis === 'bank' && !form.bank.trim()) throw new Error('Nama bank wajib diisi untuk rekening bank.');
      await create({ ...form, saldo_awal: Number(form.saldo_awal || 0) });
      closeModal();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Gagal menambah rekening.');
    }
  };

  const handleDelete = async (rek: any) => {
    if (!canManage) return;
    if (!window.confirm(`Hapus ${rek.nama}? Pastikan tidak ada transaksi terkait.`)) return;
    try {
      await remove(rek.id);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gagal menghapus rekening.');
    }
  };

  const exportCsv = () => {
    const header = ['Nama', 'Jenis', 'Bank', 'Nomor', 'Saldo Awal', 'Saldo Saat Ini'];
    const rows = rekeningData.map((rek: any) => [rek.nama, rek.jenis, rek.bank, rek.nomor, rek.saldo_awal, rek.saldo]);
    const csv = [header, ...rows].map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rekening-rw07-${todayISO()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
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
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-3">
        <Database className="w-5 h-5 text-emerald-600" />
        <div className="flex-1">
          <p className="text-sm font-medium text-emerald-800">✅ Data rekening dari Supabase</p>
          {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
        </div>
        <button onClick={refresh} className="text-xs px-3 py-1.5 bg-white border border-emerald-200 text-emerald-700 rounded-lg hover:bg-emerald-100">Refresh</button>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
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
          <button onClick={exportCsv} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2">
            <Download className="w-4 h-4" /> Ekspor CSV
          </button>
          {canManage && (
            <button onClick={openModal} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2 disabled:opacity-60">
              <Plus className="w-4 h-4" /> Tambah Rekening
            </button>
          )}
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
        <p className="text-blue-200 text-sm">Total Saldo Semua Rekening</p>
        <p className="text-3xl font-bold mt-1">{formatCurrency(totalSaldo)}</p>
      </div>

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
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{rek.nama}</p>
                <p className="text-xs text-gray-500">{rek.jenis === 'kas' ? 'Kas Tunai' : rek.bank}</p>
              </div>
            </div>
            {rek.nomor !== '-' && <p className="text-xs text-gray-400 mb-2">No. Rek: {rek.nomor}</p>}
            <p className="text-2xl font-bold text-gray-800">{formatCurrency(rek.saldo)}</p>
            {canManage && (
              <button onClick={() => handleDelete(rek)} className="mt-3 text-xs text-red-600 hover:text-red-700 flex items-center gap-1">
                <Trash2 className="w-3 h-3" /> Hapus rekening
              </button>
            )}
          </div>
        ))}
        {rekeningData.length === 0 && (
          <div className="md:col-span-3 bg-white rounded-xl p-8 text-center border border-dashed border-gray-200 text-gray-500">
            Belum ada rekening/kas. Klik <b>Tambah Rekening</b> untuk mulai.
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-800">Tambah Rekening/Kas</h2>
                <p className="text-xs text-gray-500">Saldo awal akan menjadi saldo saat ini.</p>
              </div>
              <button onClick={closeModal} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-6 space-y-4">
              {formError && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {formError}</div>}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Rekening/Kas</label>
                <input value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Contoh: Kas Tunai RW 07" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Jenis</label>
                  <select value={form.jenis} onChange={(e) => setForm({ ...form, jenis: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="kas">Kas</option>
                    <option value="bank">Bank</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Saldo Awal</label>
                  <input type="number" min="0" value={form.saldo_awal} onChange={(e) => setForm({ ...form, saldo_awal: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="0" />
                </div>
              </div>
              {form.jenis === 'bank' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nama Bank</label>
                    <input value={form.bank} onChange={(e) => setForm({ ...form, bank: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Contoh: BSI" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nomor Rekening</label>
                    <input value={form.nomor} onChange={(e) => setForm({ ...form, nomor: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={closeModal} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Batal</button>
              <button onClick={handleSubmit} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60">Simpan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KasBank;
