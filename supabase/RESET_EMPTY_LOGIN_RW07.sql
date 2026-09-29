-- =========================================================
-- KOSONGKAN DATA + AKTIFKAN LOGIN / MODE WARGA RW 07
-- Jalankan di Supabase SQL Editor setelah schema database sudah ada.
--
-- Efek:
-- 1. Menghapus data operasional/dummy: user profil, warga, rekening,
--    transaksi, iuran, aset, audit, jurnal, mutasi.
-- 2. Menyisakan data master: roles, RT, kategori, pengaturan.
-- 3. Mengaktifkan RLS: anon hanya bisa melihat view publik,
--    authenticated bisa input/edit data aplikasi.
-- =========================================================

BEGIN;

-- Pastikan master minimal tersedia
INSERT INTO roles (nama_role, deskripsi, permissions) VALUES
  ('Super Admin', 'Akses penuh ke seluruh sistem', '{"all": true}'::jsonb),
  ('Ketua RW', 'Monitoring, approval, dan laporan', '{"dashboard":"read","approval":"write","laporan":"read","audit":"read"}'::jsonb),
  ('Bendahara', 'Mengelola transaksi, kas bank, iuran, dan laporan', '{"dashboard":"read","transaksi":"write","kas_bank":"write","iuran":"write","laporan":"write"}'::jsonb),
  ('Sekretaris', 'Mengelola dokumen, warga, dan laporan', '{"dashboard":"read","warga":"write","laporan":"read"}'::jsonb),
  ('Pengurus RT', 'Input data RT dan monitoring iuran', '{"dashboard":"read","iuran":"write","penerimaan":"create","pengeluaran":"create"}'::jsonb),
  ('Auditor', 'Akses baca untuk audit', '{"dashboard":"read","audit":"read","laporan":"read","transaksi":"read"}'::jsonb),
  ('Warga', 'Melihat data iuran pribadi', '{"iuran_pribadi":"read"}'::jsonb)
ON CONFLICT (nama_role) DO UPDATE SET
  deskripsi = EXCLUDED.deskripsi,
  permissions = EXCLUDED.permissions;

INSERT INTO rts (nomor_rt, ketua_rt, alamat, jumlah_warga) VALUES
  ('RT 01', NULL, 'Wilayah RT 01 RW 07', 0),
  ('RT 02', NULL, 'Wilayah RT 02 RW 07', 0),
  ('RT 03', NULL, 'Wilayah RT 03 RW 07', 0),
  ('RT 04', NULL, 'Wilayah RT 04 RW 07', 0),
  ('RT 05', NULL, 'Wilayah RT 05 RW 07', 0)
ON CONFLICT (nomor_rt) DO UPDATE SET
  ketua_rt = EXCLUDED.ketua_rt,
  alamat = EXCLUDED.alamat,
  jumlah_warga = 0;

INSERT INTO kategori_transaksi (kode, nama_kategori, tipe, deskripsi, anggaran_tahunan, is_active) VALUES
  ('IUR', 'Iuran Warga', 'penerimaan', 'Iuran bulanan warga RW 07', 0, true),
  ('DON', 'Donasi', 'penerimaan', 'Donasi warga atau pihak luar', 0, true),
  ('LAIN-M', 'Penerimaan Lainnya', 'penerimaan', 'Pendapatan lain-lain', 0, true),
  ('KEB', 'Kebersihan', 'pengeluaran', 'Operasional kebersihan lingkungan', 0, true),
  ('KEA', 'Keamanan', 'pengeluaran', 'Operasional keamanan lingkungan', 0, true),
  ('SOS', 'Sosial', 'pengeluaran', 'Kegiatan sosial dan bantuan warga', 0, true),
  ('INF', 'Infrastruktur', 'pengeluaran', 'Perbaikan fasilitas lingkungan', 0, true),
  ('OPE', 'Operasional', 'pengeluaran', 'ATK, rapat, administrasi', 0, true),
  ('KES', 'Kesehatan', 'pengeluaran', 'Posyandu dan kesehatan warga', 0, true)
ON CONFLICT (kode) DO UPDATE SET
  nama_kategori = EXCLUDED.nama_kategori,
  tipe = EXCLUDED.tipe,
  deskripsi = EXCLUDED.deskripsi,
  anggaran_tahunan = EXCLUDED.anggaran_tahunan,
  is_active = true;

INSERT INTO pengaturan (key, value, deskripsi) VALUES
  ('nama_rw', '"RW 07"'::jsonb, 'Nama Rukun Warga'),
  ('nama_sistem', '"Sistem Kas RW 07"'::jsonb, 'Nama aplikasi'),
  ('kelurahan', '"Isi nama kelurahan"'::jsonb, 'Nama kelurahan'),
  ('kecamatan', '"Isi nama kecamatan"'::jsonb, 'Nama kecamatan'),
  ('kota', '"Jakarta"'::jsonb, 'Kota/Kabupaten'),
  ('alamat_rw', '"Isi alamat sekretariat RW 07"'::jsonb, 'Alamat sekretariat'),
  ('iuran_bulanan', '50000'::jsonb, 'Nominal iuran bulanan per KK'),
  ('warna_tema', '"#059669"'::jsonb, 'Warna tema aplikasi')
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  deskripsi = EXCLUDED.deskripsi;

-- Kosongkan semua data operasional/dummy.
TRUNCATE TABLE
  audit_logs,
  mutasi_rekening,
  jurnal,
  penerimaan,
  pengeluaran,
  iuran,
  aset,
  warga,
  users,
  rekening
RESTART IDENTITY CASCADE;

-- Reset realisasi anggaran dan hapus anggaran dummy agar bisa input dari awal.
TRUNCATE TABLE anggaran RESTART IDENTITY CASCADE;

UPDATE rts SET jumlah_warga = 0;

-- =========================================================
-- PERMISSION + RLS UNTUK LOGIN DAN MODE WARGA
-- =========================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Cabut akses langsung anon ke tabel sensitif.
REVOKE ALL ON TABLE
  public.users,
  public.warga,
  public.rekening,
  public.penerimaan,
  public.pengeluaran,
  public.jurnal,
  public.anggaran,
  public.mutasi_rekening,
  public.iuran,
  public.aset,
  public.audit_logs
FROM anon;

-- Anon hanya baca data master non-sensitif dan view publik.
GRANT SELECT ON TABLE public.roles, public.rts, public.kategori_transaksi, public.pengaturan TO anon, authenticated;
GRANT SELECT ON TABLE public.v_ringkasan_rt, public.v_laporan_arus_kas, public.v_dashboard_monthly, public.v_dashboard_kpi TO anon, authenticated;

-- View detail iuran hanya untuk pengurus login.
GRANT SELECT ON TABLE public.v_iuran_warga TO authenticated;
REVOKE ALL ON TABLE public.v_iuran_warga FROM anon;

-- Pengurus login boleh CRUD semua data aplikasi.
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  public.users,
  public.warga,
  public.rekening,
  public.penerimaan,
  public.pengeluaran,
  public.jurnal,
  public.anggaran,
  public.mutasi_rekening,
  public.iuran,
  public.aset,
  public.audit_logs,
  public.pengaturan
TO authenticated;

GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Aktifkan RLS untuk tabel sensitif.
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warga ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rekening ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.penerimaan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pengeluaran ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jurnal ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anggaran ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mutasi_rekening ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.iuran ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aset ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pengaturan ENABLE ROW LEVEL SECURITY;

-- Master tertentu boleh dibaca publik.
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kategori_transaksi ENABLE ROW LEVEL SECURITY;

-- Drop policy lama jika ada.
DROP POLICY IF EXISTS roles_select_public ON public.roles;
DROP POLICY IF EXISTS rts_select_public ON public.rts;
DROP POLICY IF EXISTS kategori_select_public ON public.kategori_transaksi;
DROP POLICY IF EXISTS pengaturan_select_public ON public.pengaturan;

DROP POLICY IF EXISTS users_auth_all ON public.users;
DROP POLICY IF EXISTS warga_auth_all ON public.warga;
DROP POLICY IF EXISTS rekening_auth_all ON public.rekening;
DROP POLICY IF EXISTS penerimaan_auth_all ON public.penerimaan;
DROP POLICY IF EXISTS pengeluaran_auth_all ON public.pengeluaran;
DROP POLICY IF EXISTS jurnal_auth_all ON public.jurnal;
DROP POLICY IF EXISTS anggaran_auth_all ON public.anggaran;
DROP POLICY IF EXISTS mutasi_auth_all ON public.mutasi_rekening;
DROP POLICY IF EXISTS iuran_auth_all ON public.iuran;
DROP POLICY IF EXISTS aset_auth_all ON public.aset;
DROP POLICY IF EXISTS audit_auth_all ON public.audit_logs;
DROP POLICY IF EXISTS pengaturan_auth_all ON public.pengaturan;

CREATE POLICY roles_select_public ON public.roles FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY rts_select_public ON public.rts FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY kategori_select_public ON public.kategori_transaksi FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY pengaturan_select_public ON public.pengaturan FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY users_auth_all ON public.users FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY warga_auth_all ON public.warga FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY rekening_auth_all ON public.rekening FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY penerimaan_auth_all ON public.penerimaan FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY pengeluaran_auth_all ON public.pengeluaran FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY jurnal_auth_all ON public.jurnal FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY anggaran_auth_all ON public.anggaran FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY mutasi_auth_all ON public.mutasi_rekening FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY iuran_auth_all ON public.iuran FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY aset_auth_all ON public.aset FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY audit_auth_all ON public.audit_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY pengaturan_auth_all ON public.pengaturan FOR ALL TO authenticated USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';

COMMIT;

SELECT 'Data operasional dikosongkan, login/RLS aktif, mode warga siap ✅' AS status,
       (SELECT COUNT(*) FROM warga) AS warga,
       (SELECT COUNT(*) FROM rekening) AS rekening,
       (SELECT COUNT(*) FROM penerimaan) AS penerimaan,
       (SELECT COUNT(*) FROM pengeluaran) AS pengeluaran,
       (SELECT COUNT(*) FROM iuran) AS iuran,
       (SELECT COUNT(*) FROM aset) AS aset;
