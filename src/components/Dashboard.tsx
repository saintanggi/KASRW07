import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  Wallet, TrendingUp, TrendingDown, Building2,
  CheckCircle, Clock, ArrowRight, Loader2, Database,
} from 'lucide-react';
import { useDashboardData } from '../hooks/useSupabaseData';
import { supabase } from '../lib/supabase';
import type { Permissions } from '../lib/permissions';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
};

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

interface DashboardProps {
  onNavigate?: (menu: string) => void;
  permissions?: Permissions;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate, permissions }) => {
  const { kpi, monthlyData, anggaranData, recentTransactions, pendingApprovals, notifications, loading, error, refresh, periodeLabel, tahunAnggaran } = useDashboardData();

  const totalAnggaran = anggaranData.reduce((sum: number, item: any) => sum + item.anggaran, 0);
  const totalRealisasi = anggaranData.reduce((sum: number, item: any) => sum + item.realisasi, 0);
  const persentaseTotal = totalAnggaran > 0 ? Math.round((totalRealisasi / totalAnggaran) * 100) : 0;

  const approvePengeluaran = async (id: number) => {
    if (!permissions?.canApprovePengeluaran) return;
    const note = window.prompt('Catatan approval (opsional):', '') || '';
    const ok = window.confirm('Setujui pengajuan pengeluaran ini?');
    if (!ok) return;
    const { data: authData } = await supabase.auth.getUser();
    const { error: updateError } = await supabase
      .from('pengeluaran')
      .update({ status: 'disetujui', approved_at: new Date().toISOString(), approved_by: authData.user?.id || null, catatan_approval: note || null })
      .eq('id', id);
    if (updateError) {
      alert(updateError.message);
      return;
    }
    refresh();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mx-auto mb-3" />
          <p className="text-gray-600 font-medium">Memuat data dari Supabase...</p>
          <p className="text-gray-400 text-sm mt-1">Menghubungkan ke database</p>
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
          <p className="text-sm font-medium text-emerald-800">
            ✅ Terhubung ke Supabase Database
          </p>
          <p className="text-xs text-emerald-600">
            Data diambil secara real-time dari database Supabase
          </p>
          {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
        </div>
        <button onClick={refresh} className="text-xs px-3 py-1.5 bg-white border border-emerald-200 text-emerald-700 rounded-lg hover:bg-emerald-100">Refresh</button>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard Keuangan</h1>
          <p className="text-gray-500 text-sm">RW 07 | Periode: {periodeLabel} | Tahun Anggaran: {tahunAnggaran}</p>
        </div>
        <div className="flex gap-2">
          {permissions?.canCreatePenerimaan && (
            <button onClick={() => onNavigate?.('penerimaan')} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors">
              + Tambah Penerimaan
            </button>
          )}
          {permissions?.canCreatePengeluaran && (
            <button onClick={() => onNavigate?.('pengeluaran')} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
              + Tambah Pengeluaran
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Saldo Kas Tunai</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{formatCurrency(kpi.saldoKasTunai)}</p>
            </div>
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Wallet className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
          <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> +2.5% dari bulan lalu
          </p>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Saldo Rekening Bank</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{formatCurrency(kpi.saldoRekeningBank)}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <p className="text-xs text-blue-600 mt-2 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> +5.1% dari bulan lalu
          </p>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Penerimaan Bulan Ini</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{formatCurrency(kpi.totalPenerimaanBulanIni)}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> +8.3% dari bulan lalu
          </p>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Pengeluaran Bulan Ini</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{formatCurrency(kpi.totalPengeluaranBulanIni)}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
            <TrendingDown className="w-3 h-3" /> -3.2% dari bulan lalu
          </p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Line Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Pemasukan vs Pengeluaran (12 Bulan)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="bulan" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}jt`} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Legend />
              <Line type="monotone" dataKey="pemasukan" stroke="#10b981" strokeWidth={2} name="Pemasukan" dot={{ r: 4 }} />
              <Line type="monotone" dataKey="pengeluaran" stroke="#ef4444" strokeWidth={2} name="Pengeluaran" dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Alokasi Anggaran</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={anggaranData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                dataKey="anggaran"
                nameKey="pos"
                label={({ pos, percent }: any) => `${pos} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {anggaranData.map((_: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Budget Progress */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Realisasi Anggaran Tahunan</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {anggaranData.map((item: any, index: number) => {
            const persentase = item.anggaran > 0 ? Math.round((item.realisasi / item.anggaran) * 100) : 0;
            return (
              <div key={index} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">{item.pos}</span>
                  <span className="text-xs font-semibold text-gray-500">{persentase}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full ${persentase > 80 ? 'bg-red-500' : persentase > 60 ? 'bg-yellow-500' : 'bg-emerald-500'}`}
                    style={{ width: `${Math.min(persentase, 100)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-gray-500">{formatCurrency(item.realisasi)}</span>
                  <span className="text-xs text-gray-400">dari {formatCurrency(item.anggaran)}</span>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
          <span className="text-sm font-medium text-gray-600">Total Realisasi: {formatCurrency(totalRealisasi)} dari {formatCurrency(totalAnggaran)}</span>
          <span className="text-sm font-bold text-emerald-600">{persentaseTotal}%</span>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions */}
        <div className="lg:col-span-2 bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Transaksi Terbaru</h3>
            <button onClick={() => onNavigate?.('penerimaan')} className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
              Lihat Semua <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b">
                  <th className="pb-2 font-medium">Nomor</th>
                  <th className="pb-2 font-medium">Tanggal</th>
                  <th className="pb-2 font-medium">Kategori</th>
                  <th className="pb-2 font-medium">Nominal</th>
                  <th className="pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.slice(0, 7).map((trx: any) => (
                  <tr key={trx.key || `${trx.tipe}-${trx.id}`} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2.5 text-sm">
                      <span className={`inline-flex items-center gap-1 ${trx.tipe === 'penerimaan' ? 'text-emerald-600' : 'text-red-600'}`}>
                        {trx.tipe === 'penerimaan' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {trx.nomor}
                      </span>
                    </td>
                    <td className="py-2.5 text-sm text-gray-600">{trx.tanggal}</td>
                    <td className="py-2.5 text-sm text-gray-600">{trx.kategori}</td>
                    <td className={`py-2.5 text-sm font-medium ${trx.tipe === 'penerimaan' ? 'text-emerald-600' : 'text-red-600'}`}>
                      {trx.tipe === 'penerimaan' ? '+' : '-'}{formatCurrency(trx.nominal)}
                    </td>
                    <td className="py-2.5">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium
                        ${trx.status === 'terverifikasi' || trx.status === 'lunas' ? 'bg-green-100 text-green-700' :
                          trx.status === 'menunggu' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-blue-100 text-blue-700'}`}>
                        {trx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pending Approvals & Notifications */}
        <div className="space-y-6">
          {/* Pending Approvals */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Menunggu Persetujuan</h3>
              <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-full">{pendingApprovals.length}</span>
            </div>
            <div className="space-y-3">
              {pendingApprovals.map((item: any) => (
                <div key={item.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{item.nomor}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{item.pengaju} • {item.kategori}</p>
                    </div>
                    <p className="text-sm font-bold text-red-600">{formatCurrency(item.nominal)}</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">{item.deskripsi}</p>
                  <div className="flex gap-2 mt-2">
                    {permissions?.canApprovePengeluaran && (
                      <button onClick={() => approvePengeluaran(item.id)} className="flex-1 text-xs bg-emerald-600 text-white py-1.5 rounded-md hover:bg-emerald-700 flex items-center justify-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Setujui
                      </button>
                    )}
                    <button onClick={() => onNavigate?.('pengeluaran')} className="flex-1 text-xs bg-gray-200 text-gray-700 py-1.5 rounded-md hover:bg-gray-300 flex items-center justify-center gap-1">
                      <Clock className="w-3 h-3" /> Tinjau
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Notifikasi</h3>
            <div className="space-y-3">
              {notifications.map((notif: any) => (
                <div key={notif.id} className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0
                    ${notif.type === 'warning' ? 'bg-yellow-500' :
                      notif.type === 'info' ? 'bg-blue-500' :
                      notif.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700">{notif.message}</p>
                    <p className="text-xs text-gray-400">{notif.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
