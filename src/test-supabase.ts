import { supabase } from './lib/supabase';

export async function testConnection() {
  console.log('🔍 Testing Supabase connection RW 07...');

  const checks = [
    ['roles', supabase.from('roles').select('*', { count: 'exact', head: true })],
    ['rts', supabase.from('rts').select('*', { count: 'exact', head: true })],
    ['warga', supabase.from('warga').select('*', { count: 'exact', head: true })],
    ['rekening', supabase.from('rekening').select('*', { count: 'exact', head: true })],
    ['kategori_transaksi', supabase.from('kategori_transaksi').select('*', { count: 'exact', head: true })],
    ['penerimaan', supabase.from('penerimaan').select('*', { count: 'exact', head: true })],
    ['pengeluaran', supabase.from('pengeluaran').select('*', { count: 'exact', head: true })],
    ['anggaran', supabase.from('anggaran').select('*', { count: 'exact', head: true })],
    ['iuran', supabase.from('iuran').select('*', { count: 'exact', head: true })],
    ['aset', supabase.from('aset').select('*', { count: 'exact', head: true })],
    ['audit_logs', supabase.from('audit_logs').select('*', { count: 'exact', head: true })],
    ['v_iuran_warga', supabase.from('v_iuran_warga').select('*', { count: 'exact', head: true })],
    ['v_laporan_arus_kas', supabase.from('v_laporan_arus_kas').select('*', { count: 'exact', head: true })],
    ['v_ringkasan_rt', supabase.from('v_ringkasan_rt').select('*', { count: 'exact', head: true })],
    ['v_dashboard_monthly', supabase.from('v_dashboard_monthly').select('*', { count: 'exact', head: true })],
  ] as const;

  for (const [name, query] of checks) {
    const { count, error } = await query;
    if (error) {
      console.error(`❌ ${name}:`, error.message);
      return false;
    }
    console.log(`✅ ${name}: ${count ?? 0} row`);
  }

  console.log('🎉 Supabase RW 07 siap digunakan.');
  return true;
}
