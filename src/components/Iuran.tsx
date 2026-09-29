import React, { useMemo, useState } from 'react';
import { Users, CheckCircle, XCircle, Download, Plus, Search, Database, Loader2, RefreshCw, X, AlertCircle } from 'lucide-react';
import { currentPeriod, todayISO, useIuran } from '../hooks/useSupabaseData';
import type { Permissions } from '../lib/permissions';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value || 0);
};

interface IuranProps {
  permissions?: Permissions;
}

const Iuran: React.FC<IuranProps> = ({ permissions }) => {
  const { data: wargaData, rts, loading, saving, error, refresh, markPaid, createWarga, generateIuranForPeriod } = useIuran();
  const canManage = Boolean(permissions?.canManageIuran);
  const [filterRT, setFilterRT] = useState('semua');
  const [filterStatus, setFilterStatus] = useState('semua');
  const [searchTerm, setSearchTerm] = useState('');
  const [showWargaModal, setShowWargaModal] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [wargaForm, setWargaForm] = useState({ nama: '', rt_id: '', nik: '', alamat: '', no_hp: '', email: '' });
  const [generateForm, setGenerateForm] = useState({ periode: currentPeriod(), jumlahTagihan: '50000' });

  const totalWarga = wargaData.length;
  const totalLunas = wargaData.filter((w: any) => w.status === 'lunas').length;
  const totalBelum = wargaData.filter((w: any) => w.status !== 'lunas').length;
  const totalTagihan = wargaData.reduce((sum: number, w: any) => sum + w.tagihan, 0);
  const totalTerkumpul = wargaData.filter((w: any) => w.status === 'lunas').reduce((sum: number, w: any) => sum + w.jumlah_bayar, 0);
  const rtOptions = useMemo(() => Array.from(new Set(wargaData.map((w: any) => w.rt).filter(Boolean))).sort(), [wargaData]);

  const filteredWarga = wargaData.filter((w: any) => {
    const matchesRT = filterRT === 'semua' || w.rt === filterRT;
    const matchesStatus = filterStatus === 'semua' || w.status === filterStatus || (filterStatus === 'belum' && w.status !== 'lunas');
    const matchesSearch = `${w.nama || ''} ${w.nik || ''}`.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesRT && matchesStatus && matchesSearch;
  });

  const openWargaModal = () => {
    if (!canManage) return;
    setWargaForm({ nama: '', rt_id: String(rts[0]?.id || ''), nik: '', alamat: '', no_hp: '', email: '' });
    setFormError(null);
    setShowWargaModal(true);
  };

  const handleAddWarga = async () => {
    setFormError(null);
    try {
      if (!canManage) throw new Error('Role Anda tidak boleh mengelola iuran.');
      if (!wargaForm.nama.trim()) throw new Error('Nama warga wajib diisi.');
      if (!wargaForm.rt_id) throw new Error('RT wajib dipilih.');
      await createWarga(wargaForm);
      setShowWargaModal(false);
      setWargaForm({ nama: '', rt_id: '', nik: '', alamat: '', no_hp: '', email: '' });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Gagal menambah warga.');
    }
  };

  const handleGenerateIuran = async () => {
    setFormError(null);
    try {
      if (!canManage) throw new Error('Role Anda tidak boleh generate iuran.');
      const inserted = await generateIuranForPeriod(generateForm.periode, Number(generateForm.jumlahTagihan || 0));
      setShowGenerateModal(false);
      alert(`Berhasil membuat ${inserted} tagihan baru. Data yang sudah ada tidak diduplikasi.`);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Gagal membuat iuran.');
    }
  };

  const exportCsv = () => {
    const header = ['Nama', 'RT', 'NIK', 'Periode', 'Tagihan', 'Bayar', 'Status', 'Tanggal Bayar'];
    const rows = filteredWarga.map((w: any) => [w.nama, w.rt, w.nik, w.periode, w.tagihan, w.jumlah_bayar, w.status, w.tanggal_bayar || '']);
    const csv = [header, ...rows].map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `iuran-rw07-${todayISO()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

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

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
            <Users className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Iuran Warga</h1>
            <p className="text-gray-500 text-sm">Kelola iuran bulanan warga RW 07</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={exportCsv} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2">
            <Download className="w-4 h-4" /> Ekspor CSV
          </button>
          {canManage && (
            <button onClick={openWargaModal} disabled={saving} className="px-4 py-2 border border-indigo-300 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-50 flex items-center gap-2 disabled:opacity-60">
              <Plus className="w-4 h-4" /> Tambah Warga
            </button>
          )}
          {canManage && (
            <button onClick={() => { setFormError(null); setShowGenerateModal(true); }} disabled={saving} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center gap-2 disabled:opacity-60">
              <Plus className="w-4 h-4" /> Generate Iuran
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100"><p className="text-sm text-gray-500">Data Tagihan</p><p className="text-2xl font-bold text-gray-800 mt-1">{totalWarga}</p></div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100"><p className="text-sm text-gray-500">Sudah Bayar</p><p className="text-2xl font-bold text-emerald-600 mt-1">{totalLunas}</p></div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100"><p className="text-sm text-gray-500">Belum Bayar</p><p className="text-2xl font-bold text-red-600 mt-1">{totalBelum}</p></div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100"><p className="text-sm text-gray-500">Total Tagihan</p><p className="text-xl font-bold text-gray-800 mt-1">{formatCurrency(totalTagihan)}</p></div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100"><p className="text-sm text-gray-500">Terkumpul</p><p className="text-xl font-bold text-blue-600 mt-1">{formatCurrency(totalTerkumpul)}</p></div>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} type="text" placeholder="Cari nama warga atau NIK..." className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <select value={filterRT} onChange={(e) => setFilterRT(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
            <option value="semua">Semua RT</option>
            {rtOptions.map((rt) => <option key={rt} value={rt}>{rt}</option>)}
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
            <option value="semua">Semua Status</option>
            <option value="lunas">Lunas</option>
            <option value="belum">Belum Bayar</option>
            <option value="terlambat">Terlambat</option>
          </select>
        </div>
      </div>

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
                      <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-green-100 text-green-700 font-medium"><CheckCircle className="w-3 h-3" /> Lunas</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-red-100 text-red-700 font-medium"><XCircle className="w-3 h-3" /> {warga.status === 'terlambat' ? 'Terlambat' : 'Belum'}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {canManage && warga.status !== 'lunas' && <button disabled={saving} onClick={() => markPaid(warga.id)} className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-md hover:bg-emerald-700 disabled:opacity-60">Catat Bayar</button>}
                    {!canManage && <span className="text-xs text-gray-400">Lihat saja</span>}
                  </td>
                </tr>
              ))}
              {filteredWarga.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-500">Belum ada tagihan iuran. Tambah warga lalu klik Generate Iuran.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showWargaModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between"><h2 className="text-lg font-bold text-gray-800">Tambah Warga</h2><button onClick={() => setShowWargaModal(false)} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button></div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {formError && <div className="md:col-span-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {formError}</div>}
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Nama</label><input value={wargaForm.nama} onChange={(e) => setWargaForm({ ...wargaForm, nama: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">RT</label><select value={wargaForm.rt_id} onChange={(e) => setWargaForm({ ...wargaForm, rt_id: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"><option value="">Pilih RT</option>{rts.map((rt: any) => <option key={rt.id} value={rt.id}>{rt.nomor_rt}</option>)}</select></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">NIK</label><input value={wargaForm.nik} onChange={(e) => setWargaForm({ ...wargaForm, nik: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">No HP</label><input value={wargaForm.no_hp} onChange={(e) => setWargaForm({ ...wargaForm, no_hp: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input value={wargaForm.email} onChange={(e) => setWargaForm({ ...wargaForm, email: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
              <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label><textarea rows={2} value={wargaForm.alamat} onChange={(e) => setWargaForm({ ...wargaForm, alamat: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3"><button onClick={() => setShowWargaModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm">Batal</button><button onClick={handleAddWarga} disabled={saving} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm disabled:opacity-60">Simpan</button></div>
          </div>
        </div>
      )}

      {showGenerateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between"><h2 className="text-lg font-bold text-gray-800">Generate Iuran</h2><button onClick={() => setShowGenerateModal(false)} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button></div>
            <div className="p-6 space-y-4">
              {formError && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {formError}</div>}
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Periode</label><input value={generateForm.periode} onChange={(e) => setGenerateForm({ ...generateForm, periode: e.target.value })} placeholder="YYYY-MM" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Nominal per Warga</label><input type="number" min="0" value={generateForm.jumlahTagihan} onChange={(e) => setGenerateForm({ ...generateForm, jumlahTagihan: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></div>
              <p className="text-xs text-gray-500">Sistem tidak akan membuat tagihan duplikat untuk warga yang sudah punya iuran pada periode ini.</p>
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3"><button onClick={() => setShowGenerateModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm">Batal</button><button onClick={handleGenerateIuran} disabled={saving} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm disabled:opacity-60">Generate</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Iuran;
