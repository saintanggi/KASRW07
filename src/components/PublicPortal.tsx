import React, { useEffect, useState } from 'react';
import { ArrowLeft, BarChart3, Database, FileText, Loader2, Shield, Users, Wallet } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatPeriodLabel, currentPeriod, toNumber } from '../hooks/useSupabaseData';

const formatCurrency = (value: number) => new Intl.NumberFormat('id-ID', {
  style: 'currency', currency: 'IDR', minimumFractionDigits: 0,
}).format(value || 0);

interface PublicPortalProps {
  onBackToLogin: () => void;
}

const PublicPortal: React.FC<PublicPortalProps> = ({ onBackToLogin }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kpi, setKpi] = useState({ saldo_kas_tunai: 0, saldo_rekening_bank: 0, total_penerimaan_bulan_ini: 0, total_pengeluaran_bulan_ini: 0 });
  const [arusKas, setArusKas] = useState<any[]>([]);
  const [ringkasanRt, setRingkasanRt] = useState<any[]>([]);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    const [kpiRes, arusRes, rtRes] = await Promise.all([
      supabase.from('v_dashboard_kpi').select('*').maybeSingle(),
      supabase.from('v_laporan_arus_kas').select('*').order('tanggal', { ascending: false }).limit(20),
      supabase.from('v_ringkasan_rt').select('*').order('nomor_rt'),
    ]);

    if (kpiRes.error || arusRes.error || rtRes.error) {
      setError([kpiRes.error?.message, arusRes.error?.message, rtRes.error?.message].filter(Boolean).join(' | '));
    }

    if (kpiRes.data) {
      setKpi({
        saldo_kas_tunai: toNumber((kpiRes.data as any).saldo_kas_tunai),
        saldo_rekening_bank: toNumber((kpiRes.data as any).saldo_rekening_bank),
        total_penerimaan_bulan_ini: toNumber((kpiRes.data as any).total_penerimaan_bulan_ini),
        total_pengeluaran_bulan_ini: toNumber((kpiRes.data as any).total_pengeluaran_bulan_ini),
      });
    }
    setArusKas(arusRes.data || []);
    setRingkasanRt(rtRes.data || []);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  const totalSaldo = kpi.saldo_kas_tunai + kpi.saldo_rekening_bank;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-700 rounded-xl flex items-center justify-center text-white font-bold">RW</div>
            <div>
              <h1 className="font-bold text-gray-800">Portal Warga RW 07</h1>
              <p className="text-xs text-gray-500">Informasi publik tanpa login</p>
            </div>
          </div>
          <button onClick={onBackToLogin} className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Login Pengurus
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
          <Shield className="w-5 h-5 text-emerald-700 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-emerald-800">Mode Warga Aktif</p>
            <p className="text-sm text-emerald-700">Warga hanya melihat ringkasan publik. Input/edit data hanya untuk pengurus yang login.</p>
            {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
          </div>
          <button onClick={refresh} className="text-xs px-3 py-1.5 bg-white border border-emerald-200 text-emerald-700 rounded-lg hover:bg-emerald-100">Refresh</button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center min-h-[320px]">
            <div className="text-center">
              <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mx-auto mb-3" />
              <p className="text-gray-600 font-medium">Memuat informasi publik...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <Wallet className="w-6 h-6 text-emerald-600 mb-3" />
                <p className="text-sm text-gray-500">Total Saldo Publik</p>
                <p className="text-2xl font-bold text-gray-800">{formatCurrency(totalSaldo)}</p>
              </div>
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <BarChart3 className="w-6 h-6 text-green-600 mb-3" />
                <p className="text-sm text-gray-500">Penerimaan Bulan Ini</p>
                <p className="text-2xl font-bold text-green-700">{formatCurrency(kpi.total_penerimaan_bulan_ini)}</p>
              </div>
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <BarChart3 className="w-6 h-6 text-red-600 mb-3" />
                <p className="text-sm text-gray-500">Pengeluaran Bulan Ini</p>
                <p className="text-2xl font-bold text-red-700">{formatCurrency(kpi.total_pengeluaran_bulan_ini)}</p>
              </div>
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <Users className="w-6 h-6 text-blue-600 mb-3" />
                <p className="text-sm text-gray-500">Periode Iuran</p>
                <p className="text-xl font-bold text-gray-800">{formatPeriodLabel(currentPeriod())}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2"><Users className="w-5 h-5 text-blue-600" /> Ringkasan Iuran per RT</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr className="text-left text-xs text-gray-500 uppercase">
                        <th className="px-3 py-2">RT</th>
                        <th className="px-3 py-2">Warga</th>
                        <th className="px-3 py-2">Lunas</th>
                        <th className="px-3 py-2">Terkumpul</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ringkasanRt.map((row: any) => (
                        <tr key={row.rt_id} className="border-t border-gray-50">
                          <td className="px-3 py-2 text-sm font-medium text-gray-800">{row.nomor_rt}</td>
                          <td className="px-3 py-2 text-sm text-gray-600">{row.jumlah_warga || 0}</td>
                          <td className="px-3 py-2 text-sm text-emerald-700">{row.warga_lunas || 0}</td>
                          <td className="px-3 py-2 text-sm font-medium text-gray-800">{formatCurrency(toNumber(row.total_terkumpul))}</td>
                        </tr>
                      ))}
                      {ringkasanRt.length === 0 && <tr><td colSpan={4} className="px-3 py-8 text-center text-sm text-gray-500">Belum ada data warga/iuran.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2"><FileText className="w-5 h-5 text-teal-600" /> Arus Kas Terbaru</h2>
                <div className="space-y-3 max-h-[360px] overflow-y-auto">
                  {arusKas.map((row: any) => (
                    <div key={`${row.tipe}-${row.referensi}`} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{row.referensi}</p>
                          <p className="text-xs text-gray-500">{row.tanggal} • {row.kategori || '-'}</p>
                        </div>
                        <p className={`text-sm font-bold ${toNumber(row.masuk) > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {toNumber(row.masuk) > 0 ? '+' : '-'}{formatCurrency(toNumber(row.masuk) || toNumber(row.keluar))}
                        </p>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 truncate">{row.uraian}</p>
                    </div>
                  ))}
                  {arusKas.length === 0 && <p className="text-sm text-gray-500 text-center py-10">Belum ada arus kas terverifikasi.</p>}
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
              <Database className="w-5 h-5 text-blue-600 mt-0.5" />
              <p className="text-sm text-blue-800">Informasi ini bersifat ringkasan. Detail data warga, NIK, dan input transaksi hanya dapat diakses pengurus melalui login.</p>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default PublicPortal;
