import React, { useMemo, useState } from 'react';
import {
  Search, Filter, Download, Plus, Eye, Edit, Trash2, ArrowDownCircle,
  ArrowUpCircle, X, Database, Loader2, RefreshCw, AlertCircle,
} from 'lucide-react';
import { makeTransactionNumber, todayISO, usePenerimaan, usePengeluaran } from '../hooks/useSupabaseData';
import type { Permissions } from '../lib/permissions';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value || 0);
};

interface TransactionsProps {
  type: 'penerimaan' | 'pengeluaran';
  permissions?: Permissions;
}

const defaultForm = (type: 'penerimaan' | 'pengeluaran') => ({
  id: null as number | null,
  nomor: makeTransactionNumber(type),
  tanggal: todayISO(),
  tanggal_pembayaran: '',
  kategori_id: '',
  rekening_id: '',
  nominal: '',
  sumber: '',
  metode_bayar: 'Tunai',
  keterangan: '',
  status: type === 'penerimaan' ? 'terverifikasi' : 'menunggu',
});

const Transactions: React.FC<TransactionsProps> = ({ type, permissions }) => {
  const penerimaan = usePenerimaan();
  const pengeluaran = usePengeluaran();
  const service = type === 'penerimaan' ? penerimaan : pengeluaran;

  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('semua');
  const [form, setForm] = useState(defaultForm(type));
  const [formError, setFormError] = useState<string | null>(null);

  const allTransactions = service.data;
  const loading = service.loading;
  const title = type === 'penerimaan' ? 'Penerimaan' : 'Pengeluaran';
  const Icon = type === 'penerimaan' ? ArrowDownCircle : ArrowUpCircle;
  const canCreate = type === 'penerimaan' ? permissions?.canCreatePenerimaan : permissions?.canCreatePengeluaran;
  const canEdit = type === 'penerimaan' ? permissions?.canEditPenerimaan : permissions?.canEditPengeluaran;
  const canDelete = type === 'penerimaan' ? permissions?.canDeletePenerimaan : permissions?.canDeletePengeluaran;
  const formIsReadOnly = Boolean(form.id && !canEdit);

  const filteredTransactions = useMemo(() => allTransactions.filter((trx: any) => {
    const haystack = `${trx.nomor || ''} ${trx.kategori || ''} ${trx.sumber || ''} ${trx.status || ''}`.toLowerCase();
    const matchesSearch = haystack.includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'semua' || trx.status === filterStatus;
    return matchesSearch && matchesStatus;
  }), [allTransactions, filterStatus, searchTerm]);

  const openCreate = () => {
    if (!canCreate) return;
    setForm(defaultForm(type));
    setFormError(null);
    setShowModal(true);
  };

  const openEdit = (trx: any) => {
    setForm({
      id: trx.id,
      nomor: trx.nomor,
      tanggal: trx.tanggal || todayISO(),
      tanggal_pembayaran: trx.tanggal_pembayaran || '',
      kategori_id: trx.kategori_id ? String(trx.kategori_id) : '',
      rekening_id: trx.rekening_id ? String(trx.rekening_id) : '',
      nominal: String(trx.nominal || ''),
      sumber: trx.sumber || '',
      metode_bayar: trx.metode_bayar || 'Tunai',
      keterangan: trx.keterangan || '',
      status: trx.status || (type === 'penerimaan' ? 'terverifikasi' : 'menunggu'),
    });
    setFormError(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setForm(defaultForm(type));
    setFormError(null);
  };

  const handleSubmit = async () => {
    setFormError(null);
    try {
      if (form.id && !canEdit) throw new Error('Role Anda tidak boleh mengedit transaksi ini.');
      if (!form.id && !canCreate) throw new Error('Role Anda tidak boleh menambah transaksi ini.');
      if (!form.kategori_id) throw new Error('Kategori wajib dipilih.');
      if (!form.rekening_id) throw new Error('Rekening wajib dipilih.');
      if (!form.sumber.trim()) throw new Error(type === 'penerimaan' ? 'Sumber wajib diisi.' : 'Deskripsi wajib diisi.');
      if (Number(form.nominal) <= 0) throw new Error('Nominal harus lebih dari 0.');

      if (form.id) {
        await service.update(form.id, form);
      } else {
        await service.create(form);
      }
      closeModal();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Gagal menyimpan data.');
    }
  };

  const handleDelete = async (trx: any) => {
    if (!canDelete) return;
    const ok = window.confirm(`Hapus transaksi ${trx.nomor}? Saldo rekening akan dihitung ulang otomatis.`);
    if (!ok) return;
    try {
      await service.remove(trx.id);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gagal menghapus transaksi.');
    }
  };

  const handleApprove = async (trx: any) => {
    if (!permissions?.canApprovePengeluaran) return;
    const note = window.prompt('Catatan approval (opsional):', '') || '';
    if (!window.confirm(`Setujui pengeluaran ${trx.nomor}?`)) return;
    try {
      await service.approve(trx.id, note);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gagal menyetujui pengeluaran.');
    }
  };

  const handleReject = async (trx: any) => {
    if (!permissions?.canRejectPengeluaran) return;
    const note = window.prompt('Alasan penolakan:', 'Bukti/catatan belum lengkap') || '';
    if (!window.confirm(`Tolak pengeluaran ${trx.nomor}?`)) return;
    try {
      await service.reject(trx.id, note);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gagal menolak pengeluaran.');
    }
  };

  const handlePay = async (trx: any) => {
    if (!permissions?.canPayPengeluaran) return;
    const paymentDate = window.prompt('Tanggal pembayaran (YYYY-MM-DD):', todayISO()) || todayISO();
    if (!window.confirm(`Tandai ${trx.nomor} sebagai lunas/dibayar?`)) return;
    try {
      await service.markPaid(trx.id, paymentDate);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gagal menandai lunas.');
    }
  };

  const exportCsv = () => {
    const header = ['Nomor', 'Tanggal', 'Kategori', 'Sumber/Deskripsi', 'Nominal', 'Status'];
    const rows = filteredTransactions.map((trx: any) => [trx.nomor, trx.tanggal, trx.kategori, trx.sumber, trx.nominal, trx.status]);
    const csv = [header, ...rows].map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${type}-${todayISO()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mx-auto mb-3" />
          <p className="text-gray-600 font-medium">Memuat data {title.toLowerCase()}...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-3">
        <Database className="w-5 h-5 text-emerald-600" />
        <div className="flex-1">
          <p className="text-sm font-medium text-emerald-800">
            ✅ Data {title.toLowerCase()} aktif dari Supabase ({filteredTransactions.length} transaksi)
          </p>
          {service.error && <p className="text-xs text-red-600 mt-1">{service.error}</p>}
        </div>
        <button onClick={service.refresh} className="text-xs px-3 py-1.5 bg-white border border-emerald-200 text-emerald-700 rounded-lg hover:bg-emerald-100 flex items-center gap-1">
          <RefreshCw className="w-3 h-3" /> Refresh
        </button>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${type === 'penerimaan' ? 'bg-emerald-100' : 'bg-red-100'}`}>
            <Icon className={`w-6 h-6 ${type === 'penerimaan' ? 'text-emerald-600' : 'text-red-600'}`} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
            <p className="text-gray-500 text-sm">Kelola data {title.toLowerCase()} RW 07</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCsv} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2">
            <Download className="w-4 h-4" /> Ekspor CSV
          </button>
          {canCreate && (
            <button
              onClick={openCreate}
              className={`px-4 py-2 text-white rounded-lg text-sm font-medium flex items-center gap-2 ${type === 'penerimaan' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}`}
            >
              <Plus className="w-4 h-4" /> Tambah {title}
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari nomor, kategori, sumber/deskripsi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="semua">Semua Status</option>
              {type === 'penerimaan' ? (
                <>
                  <option value="terverifikasi">Terverifikasi</option>
                  <option value="menunggu">Menunggu</option>
                  <option value="draft">Draft</option>
                  <option value="ditolak">Ditolak</option>
                </>
              ) : (
                <>
                  <option value="menunggu">Menunggu</option>
                  <option value="disetujui">Disetujui</option>
                  <option value="lunas">Lunas</option>
                  <option value="ditolak">Ditolak</option>
                </>
              )}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="text-left text-xs text-gray-500 uppercase">
                <th className="px-4 py-3 font-medium">Nomor</th>
                <th className="px-4 py-3 font-medium">Tanggal</th>
                <th className="px-4 py-3 font-medium">Kategori</th>
                <th className="px-4 py-3 font-medium">Rekening</th>
                <th className="px-4 py-3 font-medium">Sumber/Deskripsi</th>
                <th className="px-4 py-3 font-medium">Nominal</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sm text-gray-500">Belum ada data.</td>
                </tr>
              )}
              {filteredTransactions.map((trx: any) => (
                <tr key={`${type}-${trx.id}`} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3"><span className="text-sm font-medium text-gray-800">{trx.nomor}</span></td>
                  <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{trx.tanggal}</td>
                  <td className="px-4 py-3"><span className="text-sm text-gray-700 bg-gray-100 px-2 py-0.5 rounded">{trx.kategori}</span></td>
                  <td className="px-4 py-3 text-sm text-gray-600">{trx.rekening}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 max-w-[280px] truncate">{trx.sumber}</td>
                  <td className={`px-4 py-3 text-sm font-semibold ${trx.tipe === 'penerimaan' ? 'text-emerald-600' : 'text-red-600'}`}>
                    {trx.tipe === 'penerimaan' ? '+' : '-'}{formatCurrency(trx.nominal)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium
                        ${trx.status === 'terverifikasi' || trx.status === 'lunas' ? 'bg-green-100 text-green-700' :
                          trx.status === 'menunggu' ? 'bg-yellow-100 text-yellow-700' :
                          trx.status === 'ditolak' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                        {trx.status}
                      </span>
                      {type === 'pengeluaran' && trx.catatan_approval && (
                        <p className="text-[11px] text-gray-500 max-w-[160px] truncate" title={trx.catatan_approval}>{trx.catatan_approval}</p>
                      )}
                      {type === 'pengeluaran' && trx.tanggal_pembayaran && (
                        <p className="text-[11px] text-green-600">Bayar: {trx.tanggal_pembayaran}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 flex-wrap">
                      <button onClick={() => openEdit(trx)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Lihat Detail">
                        <Eye className="w-4 h-4" />
                      </button>
                      {canEdit && (
                        <button onClick={() => openEdit(trx)} className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors" title="Edit">
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                      {type === 'pengeluaran' && trx.status === 'menunggu' && permissions?.canApprovePengeluaran && (
                        <button onClick={() => handleApprove(trx)} className="px-2 py-1 text-[11px] font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded" title="Setujui">
                          Setujui
                        </button>
                      )}
                      {type === 'pengeluaran' && trx.status === 'menunggu' && permissions?.canRejectPengeluaran && (
                        <button onClick={() => handleReject(trx)} className="px-2 py-1 text-[11px] font-medium text-white bg-red-600 hover:bg-red-700 rounded" title="Tolak">
                          Tolak
                        </button>
                      )}
                      {type === 'pengeluaran' && trx.status === 'disetujui' && permissions?.canPayPengeluaran && (
                        <button onClick={() => handlePay(trx)} className="px-2 py-1 text-[11px] font-medium text-white bg-blue-600 hover:bg-blue-700 rounded" title="Tandai Lunas">
                          Lunas
                        </button>
                      )}
                      {canDelete && (
                        <button onClick={() => handleDelete(trx)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Hapus">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <p className="text-sm text-gray-500">Menampilkan {filteredTransactions.length} transaksi</p>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-800">{form.id ? (formIsReadOnly ? 'Detail' : 'Edit') : 'Tambah'} {title}</h2>
                <p className="text-xs text-gray-500">{formIsReadOnly ? 'Role Anda hanya dapat melihat detail data ini.' : 'Data akan langsung tersimpan ke Supabase.'}</p>
              </div>
              <button onClick={closeModal} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {formError && (
                <div className="md:col-span-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> {formError}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nomor Transaksi</label>
                <input type="text" value={form.nomor} readOnly className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal {type === 'pengeluaran' ? 'Pengajuan' : ''}</label>
                <input type="date" value={form.tanggal} onChange={(e) => setForm({ ...form, tanggal: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              {type === 'pengeluaran' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Pembayaran</label>
                  <input type="date" value={form.tanggal_pembayaran} onChange={(e) => setForm({ ...form, tanggal_pembayaran: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                <select value={form.kategori_id} onChange={(e) => setForm({ ...form, kategori_id: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  <option value="">Pilih Kategori</option>
                  {service.categories.map((cat: any) => <option key={cat.id} value={cat.id}>{cat.nama_kategori}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rekening</label>
                <select value={form.rekening_id} onChange={(e) => setForm({ ...form, rekening_id: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  <option value="">Pilih Rekening</option>
                  {service.rekening.map((rek: any) => <option key={rek.id} value={rek.id}>{rek.nama_rekening}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nominal (Rp)</label>
                <input type="number" min="0" value={form.nominal} onChange={(e) => setForm({ ...form, nominal: e.target.value })} placeholder="0" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  {type === 'penerimaan' ? (
                    <>
                      <option value="terverifikasi">Terverifikasi</option>
                      <option value="menunggu">Menunggu</option>
                      <option value="draft">Draft</option>
                      <option value="ditolak">Ditolak</option>
                    </>
                  ) : (
                    <>
                      <option value="menunggu">Menunggu</option>
                      <option value="disetujui">Disetujui</option>
                      <option value="lunas">Lunas</option>
                      <option value="ditolak">Ditolak</option>
                    </>
                  )}
                </select>
              </div>
              {type === 'penerimaan' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Metode Bayar</label>
                  <select value={form.metode_bayar} onChange={(e) => setForm({ ...form, metode_bayar: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    <option>Tunai</option>
                    <option>Transfer</option>
                    <option>QRIS</option>
                    <option>Lainnya</option>
                  </select>
                </div>
              )}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">{type === 'penerimaan' ? 'Sumber' : 'Deskripsi'}</label>
                <textarea value={form.sumber} onChange={(e) => setForm({ ...form, sumber: e.target.value })} rows={3} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder={type === 'penerimaan' ? 'Contoh: Iuran warga RT 01' : 'Contoh: Operasional kebersihan'} />
              </div>
              {type === 'penerimaan' && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan</label>
                  <textarea value={form.keterangan} onChange={(e) => setForm({ ...form, keterangan: e.target.value })} rows={2} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={closeModal} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Batal</button>
              {!formIsReadOnly && (
                <button disabled={service.saving} onClick={handleSubmit} className={`px-4 py-2 text-white rounded-lg text-sm font-medium disabled:opacity-60 ${type === 'penerimaan' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}`}>
                  {service.saving ? 'Menyimpan...' : `Simpan ${title}`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transactions;
