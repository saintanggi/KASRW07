import React, { useMemo, useRef, useState } from 'react';
import {
  AlertCircle, CheckCircle, Database, Download, Edit, FileUp, Loader2,
  Plus, RefreshCw, Search, Trash2, UserCheck, UserX, X,
} from 'lucide-react';
import { todayISO, useWarga } from '../hooks/useSupabaseData';
import type { Permissions } from '../lib/permissions';

const statusColors: Record<string, string> = {
  aktif: 'bg-green-100 text-green-700',
  nonaktif: 'bg-gray-100 text-gray-700',
  pindah: 'bg-yellow-100 text-yellow-700',
  meninggal: 'bg-red-100 text-red-700',
};

const initialForm = {
  id: null as number | null,
  nama: '',
  rt_id: '',
  nik: '',
  alamat: '',
  no_hp: '',
  email: '',
  status: 'aktif',
  tanggal_daftar: todayISO(),
};

function csvEscape(value: unknown) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

function parseCsvLine(line: string) {
  const result: string[] = [];
  let current = '';
  let insideQuote = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];
    if (char === '"' && insideQuote && next === '"') {
      current += '"';
      i += 1;
    } else if (char === '"') {
      insideQuote = !insideQuote;
    } else if (char === ',' && !insideQuote) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function parseCsv(text: string) {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) return [];
  const headers = parseCsvLine(lines[0]).map((header) => header.trim().toLowerCase());
  return lines.slice(1).map((line) => {
    const cells = parseCsvLine(line);
    return headers.reduce<Record<string, string>>((acc, header, index) => {
      acc[header] = cells[index] || '';
      return acc;
    }, {});
  });
}

interface WargaProps {
  permissions?: Permissions;
}

const Warga: React.FC<WargaProps> = ({ permissions }) => {
  const { data: wargaData, rts, loading, saving, error, refresh, create, update, setStatus, remove, bulkImport } = useWarga();
  const canManage = Boolean(permissions?.canManageWarga);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRT, setFilterRT] = useState('semua');
  const [filterStatus, setFilterStatus] = useState('semua');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const rtOptions = useMemo(() => rts.map((rt: any) => ({ id: String(rt.id), label: rt.nomor_rt })), [rts]);

  const summary = useMemo(() => ({
    total: wargaData.length,
    aktif: wargaData.filter((row: any) => row.status === 'aktif').length,
    nonaktif: wargaData.filter((row: any) => row.status === 'nonaktif').length,
    pindah: wargaData.filter((row: any) => row.status === 'pindah').length,
  }), [wargaData]);

  const filteredWarga = useMemo(() => wargaData.filter((row: any) => {
    const haystack = `${row.nama || ''} ${row.nik || ''} ${row.no_hp || ''} ${row.email || ''} ${row.alamat || ''}`.toLowerCase();
    const matchesSearch = haystack.includes(searchTerm.toLowerCase());
    const matchesRT = filterRT === 'semua' || String(row.rt_id) === filterRT;
    const matchesStatus = filterStatus === 'semua' || row.status === filterStatus;
    return matchesSearch && matchesRT && matchesStatus;
  }), [wargaData, searchTerm, filterRT, filterStatus]);

  const openCreate = () => {
    if (!canManage) return;
    setForm({ ...initialForm, rt_id: String(rts[0]?.id || ''), tanggal_daftar: todayISO() });
    setFormError(null);
    setShowModal(true);
  };

  const openEdit = (row: any) => {
    setForm({
      id: row.id,
      nama: row.nama || '',
      rt_id: row.rt_id ? String(row.rt_id) : '',
      nik: row.nik || '',
      alamat: row.alamat || '',
      no_hp: row.no_hp || '',
      email: row.email || '',
      status: row.status || 'aktif',
      tanggal_daftar: row.tanggal_daftar || todayISO(),
    });
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
      if (!canManage) throw new Error('Role Anda tidak boleh mengubah data warga.');
      if (!form.nama.trim()) throw new Error('Nama warga wajib diisi.');
      if (!form.rt_id) throw new Error('RT wajib dipilih.');
      if (form.id) await update(form.id, form);
      else await create(form);
      closeModal();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Gagal menyimpan warga.');
    }
  };

  const handleStatus = async (row: any, status: string) => {
    if (!canManage) return;
    const ok = window.confirm(`Ubah status ${row.nama} menjadi ${status}?`);
    if (!ok) return;
    try {
      await setStatus(row.id, status);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gagal mengubah status.');
    }
  };

  const handleDelete = async (row: any) => {
    if (!canManage) return;
    const ok = window.confirm(`Hapus permanen data ${row.nama}? Lebih aman gunakan Nonaktifkan jika data pernah dipakai iuran.`);
    if (!ok) return;
    try {
      await remove(row.id);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gagal menghapus warga.');
    }
  };

  const exportCsv = () => {
    const header = ['nama', 'rt', 'rt_id', 'nik', 'alamat', 'no_hp', 'email', 'status', 'tanggal_daftar'];
    const rows = filteredWarga.map((row: any) => [row.nama, row.rt, row.rt_id, row.nik, row.alamat, row.no_hp, row.email, row.status, row.tanggal_daftar]);
    const csv = [header, ...rows].map((row) => row.map(csvEscape).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `data-warga-rw07-${todayISO()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadTemplate = () => {
    const csv = [
      ['nama', 'rt', 'nik', 'alamat', 'no_hp', 'email', 'status'],
      ['Contoh Warga', 'RT 01', '317xxxxxxxxxxxxx', 'Alamat rumah', '08123456789', 'warga@email.com', 'aktif'],
    ].map((row) => row.map(csvEscape).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'template-import-warga-rw07.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      if (!canManage) throw new Error('Role Anda tidak boleh import data warga.');
      const text = await file.text();
      const rows = parseCsv(text);
      if (rows.length === 0) throw new Error('File CSV kosong atau format tidak valid.');
      const imported = await bulkImport(rows);
      alert(`Berhasil import/upsert ${imported} data warga.`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gagal import CSV.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mx-auto mb-3" />
          <p className="text-gray-600 font-medium">Memuat data warga...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-3">
        <Database className="w-5 h-5 text-emerald-600" />
        <div className="flex-1">
          <p className="text-sm font-medium text-emerald-800">✅ Data warga dari Supabase</p>
          {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
        </div>
        <button onClick={refresh} className="text-xs px-3 py-1.5 bg-white border border-emerald-200 text-emerald-700 rounded-lg hover:bg-emerald-100 flex items-center gap-1">
          <RefreshCw className="w-3 h-3" /> Refresh
        </button>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
            <UserCheck className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Data Warga</h1>
            <p className="text-gray-500 text-sm">Kelola warga, RT, status, import dan export data RW 07</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={downloadTemplate} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2">
            <Download className="w-4 h-4" /> Template CSV
          </button>
          <input ref={fileInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleImportFile} />
          {canManage && (
            <button onClick={() => fileInputRef.current?.click()} disabled={saving} className="px-4 py-2 border border-emerald-300 text-emerald-700 rounded-lg text-sm font-medium hover:bg-emerald-50 flex items-center gap-2 disabled:opacity-60">
              <FileUp className="w-4 h-4" /> Import CSV
            </button>
          )}
          <button onClick={exportCsv} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2">
            <Download className="w-4 h-4" /> Export CSV
          </button>
          {canManage && (
            <button onClick={openCreate} disabled={saving} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 flex items-center gap-2 disabled:opacity-60">
              <Plus className="w-4 h-4" /> Tambah Warga
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100"><p className="text-sm text-gray-500">Total Warga</p><p className="text-2xl font-bold text-gray-800">{summary.total}</p></div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100"><p className="text-sm text-gray-500">Aktif</p><p className="text-2xl font-bold text-emerald-600">{summary.aktif}</p></div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100"><p className="text-sm text-gray-500">Nonaktif</p><p className="text-2xl font-bold text-gray-600">{summary.nonaktif}</p></div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100"><p className="text-sm text-gray-500">Pindah</p><p className="text-2xl font-bold text-yellow-600">{summary.pindah}</p></div>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex-1 min-w-[220px] relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} type="text" placeholder="Cari nama, NIK, HP, email, alamat..." className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <select value={filterRT} onChange={(e) => setFilterRT(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
            <option value="semua">Semua RT</option>
            {rtOptions.map((rt) => <option key={rt.id} value={rt.id}>{rt.label}</option>)}
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
            <option value="semua">Semua Status</option>
            <option value="aktif">Aktif</option>
            <option value="nonaktif">Nonaktif</option>
            <option value="pindah">Pindah</option>
            <option value="meninggal">Meninggal</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="text-left text-xs text-gray-500 uppercase">
                <th className="px-4 py-3 font-medium">Nama</th>
                <th className="px-4 py-3 font-medium">RT</th>
                <th className="px-4 py-3 font-medium">NIK</th>
                <th className="px-4 py-3 font-medium">Kontak</th>
                <th className="px-4 py-3 font-medium">Alamat</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredWarga.map((row: any) => (
                <tr key={row.id} className="border-t border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-800">{row.nama}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{row.rt}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 font-mono">{row.nik || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600"><div>{row.no_hp || '-'}</div><div className="text-xs text-gray-400">{row.email || ''}</div></td>
                  <td className="px-4 py-3 text-sm text-gray-600 max-w-[260px] truncate">{row.alamat || '-'}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[row.status] || statusColors.nonaktif}`}>{row.status}</span></td>
                  <td className="px-4 py-3">
                    {canManage ? (
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(row)} className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded" title="Edit / Pindah RT"><Edit className="w-4 h-4" /></button>
                        {row.status === 'aktif' ? (
                          <button onClick={() => handleStatus(row, 'nonaktif')} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded" title="Nonaktifkan"><UserX className="w-4 h-4" /></button>
                        ) : (
                          <button onClick={() => handleStatus(row, 'aktif')} className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded" title="Aktifkan"><CheckCircle className="w-4 h-4" /></button>
                        )}
                        <button onClick={() => handleDelete(row)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded" title="Hapus permanen"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">Lihat saja</span>
                    )}
                  </td>
                </tr>
              ))}
              {filteredWarga.length === 0 && <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-500">Belum ada data warga. Klik Tambah Warga atau Import CSV.</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 text-sm text-gray-500">Menampilkan {filteredWarga.length} warga</div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div><h2 className="text-lg font-bold text-gray-800">{form.id ? 'Edit Warga' : 'Tambah Warga'}</h2><p className="text-xs text-gray-500">Edit RT untuk memindahkan warga ke RT lain.</p></div>
              <button onClick={closeModal} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {formError && <div className="md:col-span-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {formError}</div>}
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Nama</label><input value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">RT</label><select value={form.rt_id} onChange={(e) => setForm({ ...form, rt_id: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"><option value="">Pilih RT</option>{rtOptions.map((rt) => <option key={rt.id} value={rt.id}>{rt.label}</option>)}</select></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">NIK</label><input value={form.nik} onChange={(e) => setForm({ ...form, nik: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">No HP</label><input value={form.no_hp} onChange={(e) => setForm({ ...form, no_hp: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Status</label><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"><option value="aktif">Aktif</option><option value="nonaktif">Nonaktif</option><option value="pindah">Pindah</option><option value="meninggal">Meninggal</option></select></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Daftar</label><input type="date" value={form.tanggal_daftar} onChange={(e) => setForm({ ...form, tanggal_daftar: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" /></div>
              <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label><textarea rows={3} value={form.alamat} onChange={(e) => setForm({ ...form, alamat: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" /></div>
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3"><button onClick={closeModal} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Batal</button><button onClick={handleSubmit} disabled={saving} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-60">Simpan</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Warga;
