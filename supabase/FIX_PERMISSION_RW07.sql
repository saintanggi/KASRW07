-- =========================================================
-- FIX PERMISSION API SUPABASE - SISTEM KAS RW 07
-- Jalankan di Supabase SQL Editor jika muncul error:
-- permission denied for table rekening / penerimaan / dst.
--
-- Catatan:
-- Ini membuka akses anon/authenticated untuk MVP/demo tanpa login.
-- Untuk produksi data asli, sebaiknya pakai Supabase Auth + RLS policies.
-- =========================================================

-- Pastikan schema public bisa dipakai API role Supabase
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Beri akses CRUD ke tabel utama yang dipakai aplikasi
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  public.roles,
  public.rts,
  public.users,
  public.warga,
  public.rekening,
  public.kategori_transaksi,
  public.penerimaan,
  public.pengeluaran,
  public.jurnal,
  public.anggaran,
  public.mutasi_rekening,
  public.iuran,
  public.aset,
  public.audit_logs,
  public.pengaturan
TO anon, authenticated;

-- Beri akses baca ke views laporan/dashboard
GRANT SELECT ON TABLE
  public.v_iuran_warga,
  public.v_ringkasan_rt,
  public.v_laporan_arus_kas,
  public.v_dashboard_monthly,
  public.v_dashboard_kpi
TO anon, authenticated;

-- Beri akses sequence SERIAL agar insert dari aplikasi tidak gagal
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Agar tabel/sequence baru berikutnya otomatis dapat permission juga
ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO anon, authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO anon, authenticated;

-- Jika Row Level Security pernah diaktifkan, matikan dulu untuk MVP/demo tanpa login.
-- Nanti untuk produksi, aktifkan RLS lagi dan buat policy per role.
ALTER TABLE IF EXISTS public.roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.rts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.warga DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.rekening DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.kategori_transaksi DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.penerimaan DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.pengeluaran DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.jurnal DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.anggaran DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.mutasi_rekening DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.iuran DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.aset DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.pengaturan DISABLE ROW LEVEL SECURITY;

-- Paksa API Supabase/PostgREST reload schema dan permission
NOTIFY pgrst, 'reload schema';

SELECT 'Permission Supabase RW 07 berhasil diperbaiki ✅' AS status;
