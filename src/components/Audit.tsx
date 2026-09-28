import React, { useState } from 'react';
import { Settings, Search, Filter, Download, Eye, Calendar, Database, Loader2, RefreshCw } from 'lucide-react';
import { useAuditLogs } from '../hooks/useSupabaseData';

const Audit: React.FC = () => {
  const { data: auditLogs, loading, error, refresh } = useAuditLogs();
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('semua');

  const actionColors: Record<string, string> = {
    'INSERT': 'bg-green-100 text-green-700',
    'CREATE': 'bg-green-100 text-green-700',
    'UPDATE': 'bg-blue-100 text-blue-700',
    'DELETE': 'bg-red-100 text-red-700',
    'APPROVE': 'bg-emerald-100 text-emerald-700',
    'REJECT': 'bg-red-100 text-red-700',
    'VIEW': 'bg-gray-100 text-gray-700',
  };

  const filteredLogs = auditLogs.filter((log: any) => {
    const matchesSearch = log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.detail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.table.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = actionFilter === 'semua' || log.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-gray-600 animate-spin mx-auto mb-3" />
          <p className="text-gray-600 font-medium">Memuat audit trail...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
            <Settings className="w-6 h-6 text-gray-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Audit Trail</h1>
            <p className="text-gray-500 text-sm">Log lengkap perubahan data dan aktivitas pengguna</p>
          </div>
        </div>
        <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2">
          <Download className="w-4 h-4" /> Ekspor Log
        </button>
      </div>

      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-3">
        <Database className="w-5 h-5 text-emerald-600" />
        <div className="flex-1">
          <p className="text-sm font-medium text-emerald-800">✅ Audit trail dari Supabase</p>
          {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
        </div>
        <button onClick={refresh} className="text-xs px-3 py-1.5 bg-white border border-emerald-200 text-emerald-700 rounded-lg hover:bg-emerald-100 flex items-center gap-1">
          <RefreshCw className="w-3 h-3" /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Total Aktivitas Hari Ini</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{auditLogs.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Transaksi Dibuat</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{auditLogs.filter(l => l.action === 'CREATE').length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Approval</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{auditLogs.filter(l => l.action === 'APPROVE').length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Rejection</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{auditLogs.filter(l => l.action === 'REJECT').length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari user, aksi, atau detail..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-500">
              <option value="semua">Semua Aksi</option>
              <option value="INSERT">INSERT</option>
              <option value="UPDATE">UPDATE</option>
              <option value="DELETE">DELETE</option>
              <option value="CREATE">CREATE</option>
              <option value="APPROVE">APPROVE</option>
              <option value="REJECT">REJECT</option>
              <option value="VIEW">VIEW</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <input type="date" defaultValue="2026-09-01" className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-500" />
            <span className="text-gray-400">s/d</span>
            <input type="date" defaultValue="2026-09-28" className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-500" />
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="text-left text-xs text-gray-500 uppercase">
                <th className="px-4 py-3 font-medium">Waktu</th>
                <th className="px-4 py-3 font-medium">Pengguna</th>
                <th className="px-4 py-3 font-medium">Aksi</th>
                <th className="px-4 py-3 font-medium">Tabel</th>
                <th className="px-4 py-3 font-medium">Record</th>
                <th className="px-4 py-3 font-medium">Detail</th>
                <th className="px-4 py-3 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{log.waktu}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-gray-600">{log.user.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}</span>
                      </div>
                      <span className="text-sm font-medium text-gray-800">{log.user}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${actionColors[log.action] || 'bg-gray-100 text-gray-700'}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-mono">{log.table}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 font-mono">{log.record}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 max-w-[250px] truncate">{log.detail}</td>
                  <td className="px-4 py-3">
                    <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Lihat Detail">
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <p className="text-sm text-gray-500">Menampilkan {filteredLogs.length} log aktivitas</p>
          <div className="flex items-center gap-1">
            <button className="px-3 py-1 text-sm border border-gray-200 rounded hover:bg-gray-100">Sebelumnya</button>
            <button className="px-3 py-1 text-sm bg-gray-800 text-white rounded">1</button>
            <button className="px-3 py-1 text-sm border border-gray-200 rounded hover:bg-gray-100">Berikutnya</button>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Settings className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-blue-800">Tentang Audit Trail</h4>
            <p className="text-sm text-blue-700 mt-1">
              Semua perubahan data dalam sistem dicatat secara otomatis termasuk siapa yang melakukan, kapan, dan apa yang diubah.
              Log ini disimpan permanen dan tidak dapat dihapus untuk keperluan audit dan transparansi.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Audit;
