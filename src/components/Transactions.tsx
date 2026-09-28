import React, { useState } from 'react';
import { Search, Filter, Download, Plus, Eye, Edit, Trash2, ArrowDownCircle, ArrowUpCircle, X } from 'lucide-react';
import { recentTransactions } from '../data/mockData';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
};

interface TransactionsProps {
  type: 'penerimaan' | 'pengeluaran';
}

const Transactions: React.FC<TransactionsProps> = ({ type }) => {
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('semua');

  const filteredTransactions = recentTransactions.filter((trx) => {
    const matchesType = trx.tipe === type;
    const matchesSearch = trx.nomor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trx.kategori.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trx.sumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'semua' || trx.status === filterStatus;
    return matchesType && matchesSearch && matchesStatus;
  });

  const title = type === 'penerimaan' ? 'Penerimaan' : 'Pengeluaran';
  const Icon = type === 'penerimaan' ? ArrowDownCircle : ArrowUpCircle;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${type === 'penerimaan' ? 'bg-emerald-100' : 'bg-red-100'}`}>
            <Icon className={`w-6 h-6 ${type === 'penerimaan' ? 'text-emerald-600' : 'text-red-600'}`} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
            <p className="text-gray-500 text-sm">Kelola data {title.toLowerCase()} RW 05</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2">
            <Download className="w-4 h-4" /> Ekspor
          </button>
          <button
            onClick={() => setShowModal(true)}
            className={`px-4 py-2 text-white rounded-lg text-sm font-medium flex items-center gap-2 ${type === 'penerimaan' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}`}
          >
            <Plus className="w-4 h-4" /> Tambah {title}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari nomor, kategori, atau sumber..."
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
              <option value="terverifikasi">Terverifikasi</option>
              <option value="menunggu">Menunggu</option>
              <option value="disetujui">Disetujui</option>
            </select>
          </div>
          <select className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
            <option>Semua Kategori</option>
            <option>Iuran Warga</option>
            <option>Donasi</option>
            <option>Kebersihan</option>
            <option>Keamanan</option>
            <option>Infrastruktur</option>
            <option>Sosial</option>
          </select>
          <select className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
            <option>Desember 2024</option>
            <option>November 2024</option>
            <option>Oktober 2024</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="text-left text-xs text-gray-500 uppercase">
                <th className="px-4 py-3 font-medium">Nomor</th>
                <th className="px-4 py-3 font-medium">Tanggal</th>
                <th className="px-4 py-3 font-medium">Kategori</th>
                <th className="px-4 py-3 font-medium">Sumber/Deskripsi</th>
                <th className="px-4 py-3 font-medium">Nominal</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((trx) => (
                <tr key={trx.id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium text-gray-800">{trx.nomor}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{trx.tanggal}</td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-700 bg-gray-100 px-2 py-0.5 rounded">{trx.kategori}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{trx.sumber}</td>
                  <td className={`px-4 py-3 text-sm font-semibold ${trx.tipe === 'penerimaan' ? 'text-emerald-600' : 'text-red-600'}`}>
                    {trx.tipe === 'penerimaan' ? '+' : '-'}{formatCurrency(trx.nominal)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium
                      ${trx.status === 'terverifikasi' ? 'bg-green-100 text-green-700' :
                        trx.status === 'menunggu' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-blue-100 text-blue-700'}`}>
                      {trx.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <p className="text-sm text-gray-500">Menampilkan {filteredTransactions.length} transaksi</p>
          <div className="flex items-center gap-1">
            <button className="px-3 py-1 text-sm border border-gray-200 rounded hover:bg-gray-100">Sebelumnya</button>
            <button className="px-3 py-1 text-sm bg-emerald-600 text-white rounded">1</button>
            <button className="px-3 py-1 text-sm border border-gray-200 rounded hover:bg-gray-100">2</button>
            <button className="px-3 py-1 text-sm border border-gray-200 rounded hover:bg-gray-100">Berikutnya</button>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">Tambah {title}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nomor Transaksi</label>
                <input type="text" value="TRX-2024-012" readOnly className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
                <input type="date" defaultValue="2024-12-06" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  <option>Pilih Kategori</option>
                  <option>Iuran Warga</option>
                  <option>Donasi</option>
                  <option>Kebersihan</option>
                  <option>Keamanan</option>
                  <option>Infrastruktur</option>
                  <option>Sosial</option>
                  <option>Operasional</option>
                  <option>Pendapatan Lain</option>
                </select>
              </div>
              {type === 'penerimaan' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sumber</label>
                  <input type="text" placeholder="Contoh: RT 01, Bpk. Ahmad, dll" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                  <textarea placeholder="Deskripsi pengeluaran..." className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" rows={3}></textarea>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nominal (Rp)</label>
                <input type="number" placeholder="0" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Metode Pembayaran</label>
                <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  <option>Tunai</option>
                  <option>Transfer Bank</option>
                  <option>E-Wallet</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rekening</label>
                <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  <option>Kas Tunai RW 05</option>
                  <option>Bank BSI - RW 05</option>
                  <option>Bank Mandiri - RW 05</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bukti Lampiran</label>
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-500">Drag & drop file atau klik untuk upload</p>
                  <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG (maks 5MB)</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan</label>
                <textarea placeholder="Keterangan tambahan..." className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" rows={2}></textarea>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                Batal
              </button>
              <button onClick={() => setShowModal(false)} className={`px-4 py-2 text-white rounded-lg text-sm font-medium ${type === 'penerimaan' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}`}>
                Simpan {title}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transactions;
