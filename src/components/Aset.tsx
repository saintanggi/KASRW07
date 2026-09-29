import React, { useState } from 'react';
import { ClipboardList, Plus, Download, Edit, Trash2, Database, Loader2, RefreshCw, X, AlertCircle } from 'lucide-react';
import { todayISO, useAset } from '../hooks/useSupabaseData';
import type { Permissions } from '../lib/permissions';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value || 0);
};

const initialForm = {
  kode_aset: '',
  nama: '',
  kategori: 'Perlengkapan',
  nilai_perolehan: '',
  tanggal_perolehan: todayISO(),
  lokasi: '',
  kondisi: 'Baik',
  keterangan: '',
};

interface AsetProps {
  permissions?: Permissions;
}

const Aset: React.FC<AsetProps> = ({ permissions }) => {
  const { data: asetData, loading, saving, error, refresh, create, remove } = useAset();
  const canManage = Boolean(permissions?.canManageAset);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [formError, setFormError] = useState<string | null>(null);
  const totalNilai = asetData.reduce((sum: number, a: any) => sum + a.nilai, 0);

  const openModal = () => {
    if (!canManage) return;
    setForm({ ...initialForm, tanggal_perolehan: todayISO() });
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
      if (!canManage) throw new Error('Role Anda tidak boleh mengelola aset.');
      if (!form.nama.trim()) throw new Error('Nama aset wajib diisi.');
      await create(form);
      closeModal();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Gagal menambah aset.');
    }
  };

  const handleDelete = async (aset: any) => {
    if (!canManage) return;
    if (!window.confirm(`Hapus aset ${aset.nama}?`)) return;
    try {
      await remove(aset.id);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gagal menghapus aset.');
    }
  };

  const exportCsv = () => {
    const header = ['Kode', 'Nama', 'Kategori', 'Nilai', 'Tanggal Perolehan', 'Lokasi', 'Kondisi', 'Keterangan'];
    const rows = asetData.map((a: any) => [a.kode, a.nama, a.kategori, a.nilai, a.tanggal_perolehan, a.lokasi, a.kondisi, a.keterangan || '']);
    const csv = [header, ...rows].map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `aset-rw07-${todayISO()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

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
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-3">
        <Database className="w-5 h-5 text-emerald-600" />
        <div className="flex-1">
          <p className="text-sm font-medium text-emerald-800">✅ Data aset dari Supabase</p>
          {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
        </div>
        <button onClick={refresh} className="text-xs px-3 py-1.5 bg-white border border-emerald-200 text-emerald-700 rounded-lg hover:bg-emerald-100 flex items-center gap-1">
          <RefreshCw className="w-3 h-3" /> Refresh
        </button>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
            <ClipboardList className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Inventaris & Aset</h1>
            <p className="text-gray-500 text-sm">Kelola aset dan inventaris RW 07</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCsv} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2">
            <Download className="w-4 h-4" /> Ekspor CSV
          </button>
          {canManage && (
            <button onClick={openModal} disabled={saving} className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 flex items-center gap-2 disabled:opacity-60">
              <Plus className="w-4 h-4" /> Tambah Aset
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100"><p className="text-sm text-gray-500">Total Aset</p><p className="text-xl font-bold text-gray-800">{asetData.length} item</p></div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100"><p className="text-sm text-gray-500">Nilai Total Aset</p><p className="text-xl font-bold text-gray-800">{formatCurrency(totalNilai)}</p></div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100"><p className="text-sm text-gray-500">Kondisi Baik</p><p className="text-xl font-bold text-gray-800">{asetData.filter((a: any) => a.kondisi === 'Baik').length} item</p></div>
      </div>

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
                <tr key={aset.id || aset.kode} className="border-t border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-mono font-medium text-gray-800">{aset.kode}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-800">{aset.nama}</td>
                  <td className="px-4 py-3"><span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">{aset.kategori}</span></td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-800">{formatCurrency(aset.nilai)}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{aset.lokasi}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2.5 py-1 rounded-full font-medium ${aset.kondisi === 'Baik' ? 'bg-green-100 text-green-700' : aset.kondisi === 'Cukup' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{aset.kondisi}</span></td>
                  <td className="px-4 py-3">
                    {canManage ? (
                      <div className="flex items-center gap-1">
                        <button className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded" title="Edit belum aktif"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(aset)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded" title="Hapus aset"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">Lihat saja</span>
                    )}
                  </td>
                </tr>
              ))}
              {asetData.length === 0 && <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-500">Belum ada aset. Klik Tambah Aset untuk mulai.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div><h2 className="text-lg font-bold text-gray-800">Tambah Aset</h2><p className="text-xs text-gray-500">Masukkan data inventaris/aset RW 07.</p></div>
              <button onClick={closeModal} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {formError && <div className="md:col-span-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {formError}</div>}
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Kode Aset</label><input value={form.kode_aset} onChange={(e) => setForm({ ...form, kode_aset: e.target.value })} placeholder="Otomatis jika kosong" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Nama Aset</label><input value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label><input value={form.kategori} onChange={(e) => setForm({ ...form, kategori: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Nilai Perolehan</label><input type="number" min="0" value={form.nilai_perolehan} onChange={(e) => setForm({ ...form, nilai_perolehan: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Perolehan</label><input type="date" value={form.tanggal_perolehan} onChange={(e) => setForm({ ...form, tanggal_perolehan: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Kondisi</label><select value={form.kondisi} onChange={(e) => setForm({ ...form, kondisi: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"><option>Baik</option><option>Cukup</option><option>Rusak Ringan</option><option>Rusak Berat</option></select></div>
              <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Lokasi</label><input value={form.lokasi} onChange={(e) => setForm({ ...form, lokasi: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" /></div>
              <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Keterangan</label><textarea rows={2} value={form.keterangan} onChange={(e) => setForm({ ...form, keterangan: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" /></div>
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3"><button onClick={closeModal} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Batal</button><button onClick={handleSubmit} disabled={saving} className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 disabled:opacity-60">Simpan</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Aset;
