-- =========================================================
-- RESET DATABASE SISTEM KAS RW 07 - SUPABASE
-- Versi: 2026-09-28
--
-- PENTING:
-- 1. Script ini MEROMBAK ULANG database dan MENGHAPUS data lama.
-- 2. Cocok untuk sistem baru / data lama masih dummy dan acak.
-- 3. Jalankan di Supabase SQL Editor.
-- 4. Setelah sukses, deploy ulang aplikasi dari repo.
-- =========================================================

BEGIN;

-- Extension untuk UUID modern
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =========================================================
-- DROP VIEW & TABLE LAMA
-- =========================================================
DROP VIEW IF EXISTS v_dashboard_kpi CASCADE;
DROP VIEW IF EXISTS v_dashboard_monthly CASCADE;
DROP VIEW IF EXISTS v_laporan_arus_kas CASCADE;
DROP VIEW IF EXISTS v_iuran_warga CASCADE;
DROP VIEW IF EXISTS v_ringkasan_rt CASCADE;

DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS iuran CASCADE;
DROP TABLE IF EXISTS mutasi_rekening CASCADE;
DROP TABLE IF EXISTS jurnal CASCADE;
DROP TABLE IF EXISTS pengeluaran CASCADE;
DROP TABLE IF EXISTS penerimaan CASCADE;
DROP TABLE IF EXISTS anggaran CASCADE;
DROP TABLE IF EXISTS aset CASCADE;
DROP TABLE IF EXISTS warga CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS rekening CASCADE;
DROP TABLE IF EXISTS kategori_transaksi CASCADE;
DROP TABLE IF EXISTS rts CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS pengaturan CASCADE;

DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS recalculate_rekening_balance(INTEGER) CASCADE;
DROP FUNCTION IF EXISTS refresh_rekening_balance_trigger() CASCADE;
DROP FUNCTION IF EXISTS audit_change_trigger() CASCADE;

-- =========================================================
-- MASTER DATA
-- =========================================================
CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  nama_role VARCHAR(50) NOT NULL UNIQUE,
  deskripsi TEXT,
  permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE rts (
  id SERIAL PRIMARY KEY,
  nomor_rt VARCHAR(10) NOT NULL UNIQUE,
  ketua_rt VARCHAR(100),
  alamat TEXT,
  jumlah_warga INTEGER NOT NULL DEFAULT 0 CHECK (jumlah_warga >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL DEFAULT '-',
  role_id INTEGER REFERENCES roles(id) ON DELETE SET NULL,
  rt_id INTEGER REFERENCES rts(id) ON DELETE SET NULL,
  telepon VARCHAR(30),
  alamat TEXT,
  foto_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE warga (
  id SERIAL PRIMARY KEY,
  rt_id INTEGER REFERENCES rts(id) ON DELETE SET NULL,
  nama VARCHAR(100) NOT NULL,
  nik VARCHAR(20) UNIQUE,
  alamat TEXT,
  no_hp VARCHAR(30),
  email VARCHAR(150),
  status VARCHAR(20) NOT NULL DEFAULT 'aktif' CHECK (status IN ('aktif', 'nonaktif', 'pindah', 'meninggal')),
  tanggal_daftar DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE rekening (
  id SERIAL PRIMARY KEY,
  nama_rekening VARCHAR(120) NOT NULL,
  jenis VARCHAR(20) NOT NULL CHECK (jenis IN ('kas', 'bank')),
  nomor VARCHAR(80),
  bank VARCHAR(80),
  saldo_awal NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (saldo_awal >= 0),
  saldo_saat_ini NUMERIC(15,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE kategori_transaksi (
  id SERIAL PRIMARY KEY,
  kode VARCHAR(20) NOT NULL UNIQUE,
  nama_kategori VARCHAR(120) NOT NULL,
  tipe VARCHAR(20) NOT NULL CHECK (tipe IN ('penerimaan', 'pengeluaran', 'semua')),
  deskripsi TEXT,
  anggaran_tahunan NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (anggaran_tahunan >= 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================
-- TRANSAKSI
-- =========================================================
CREATE TABLE penerimaan (
  id SERIAL PRIMARY KEY,
  nomor VARCHAR(50) NOT NULL UNIQUE,
  tanggal DATE NOT NULL,
  sumber VARCHAR(150) NOT NULL,
  kategori_id INTEGER REFERENCES kategori_transaksi(id) ON DELETE SET NULL,
  rekening_id INTEGER REFERENCES rekening(id) ON DELETE SET NULL,
  nominal NUMERIC(15,2) NOT NULL CHECK (nominal > 0),
  metode_bayar VARCHAR(50),
  bukti_file TEXT,
  keterangan TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'terverifikasi' CHECK (status IN ('draft', 'menunggu', 'terverifikasi', 'ditolak')),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE pengeluaran (
  id SERIAL PRIMARY KEY,
  nomor VARCHAR(50) NOT NULL UNIQUE,
  tanggal_pengajuan DATE NOT NULL,
  tanggal_pembayaran DATE,
  pengaju_id UUID REFERENCES users(id) ON DELETE SET NULL,
  kategori_id INTEGER REFERENCES kategori_transaksi(id) ON DELETE SET NULL,
  rekening_id INTEGER REFERENCES rekening(id) ON DELETE SET NULL,
  nominal NUMERIC(15,2) NOT NULL CHECK (nominal > 0),
  deskripsi TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'menunggu' CHECK (status IN ('menunggu', 'disetujui', 'ditolak', 'lunas')),
  bukti_pengajuan TEXT,
  bukti_pembayaran TEXT,
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  catatan_approval TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT pengeluaran_lunas_wajib_tanggal CHECK (status <> 'lunas' OR tanggal_pembayaran IS NOT NULL)
);

CREATE TABLE jurnal (
  id SERIAL PRIMARY KEY,
  tanggal DATE NOT NULL,
  kode_ref VARCHAR(50),
  akun_debit VARCHAR(120),
  akun_kredit VARCHAR(120),
  nominal NUMERIC(15,2) NOT NULL CHECK (nominal > 0),
  keterangan TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE anggaran (
  id SERIAL PRIMARY KEY,
  tahun INTEGER NOT NULL CHECK (tahun BETWEEN 2020 AND 2100),
  kategori_id INTEGER REFERENCES kategori_transaksi(id) ON DELETE CASCADE,
  jumlah_anggaran NUMERIC(15,2) NOT NULL CHECK (jumlah_anggaran >= 0),
  realisasi NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (realisasi >= 0),
  catatan TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tahun, kategori_id)
);

CREATE TABLE mutasi_rekening (
  id SERIAL PRIMARY KEY,
  rekening_id INTEGER REFERENCES rekening(id) ON DELETE CASCADE,
  tanggal DATE NOT NULL,
  tipe VARCHAR(10) NOT NULL CHECK (tipe IN ('masuk', 'keluar')),
  nominal NUMERIC(15,2) NOT NULL CHECK (nominal > 0),
  saldo_sesudah NUMERIC(15,2),
  referensi_tabel VARCHAR(50),
  referensi_id INTEGER,
  keterangan TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE iuran (
  id SERIAL PRIMARY KEY,
  warga_id INTEGER REFERENCES warga(id) ON DELETE CASCADE,
  periode VARCHAR(7) NOT NULL CHECK (periode ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
  jumlah_tagihan NUMERIC(15,2) NOT NULL CHECK (jumlah_tagihan >= 0),
  jumlah_bayar NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (jumlah_bayar >= 0),
  status VARCHAR(20) NOT NULL DEFAULT 'belum' CHECK (status IN ('belum', 'lunas', 'terlambat')),
  tanggal_jatuh_tempo DATE,
  tanggal_bayar DATE,
  bukti_pembayaran TEXT,
  metode_bayar VARCHAR(50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(warga_id, periode),
  CONSTRAINT iuran_lunas_wajib_bayar CHECK (status <> 'lunas' OR jumlah_bayar >= jumlah_tagihan)
);

CREATE TABLE aset (
  id SERIAL PRIMARY KEY,
  kode_aset VARCHAR(50) NOT NULL UNIQUE,
  nama VARCHAR(200) NOT NULL,
  kategori VARCHAR(100),
  nilai_perolehan NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (nilai_perolehan >= 0),
  tanggal_perolehan DATE,
  lokasi VARCHAR(200),
  kondisi VARCHAR(50) NOT NULL DEFAULT 'Baik' CHECK (kondisi IN ('Baik', 'Cukup', 'Rusak Ringan', 'Rusak Berat')),
  foto TEXT,
  keterangan TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  user_name VARCHAR(120),
  action VARCHAR(50) NOT NULL,
  table_name VARCHAR(100),
  record_id VARCHAR(100),
  old_data JSONB,
  new_data JSONB,
  ip_address VARCHAR(50),
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE pengaturan (
  id SERIAL PRIMARY KEY,
  key VARCHAR(100) NOT NULL UNIQUE,
  value JSONB,
  deskripsi TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================
-- INDEXES
-- =========================================================
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role_id ON users(role_id);
CREATE INDEX idx_users_rt_id ON users(rt_id);
CREATE INDEX idx_warga_rt_id ON warga(rt_id);
CREATE INDEX idx_warga_status ON warga(status);
CREATE INDEX idx_penerimaan_tanggal ON penerimaan(tanggal);
CREATE INDEX idx_penerimaan_status ON penerimaan(status);
CREATE INDEX idx_penerimaan_kategori ON penerimaan(kategori_id);
CREATE INDEX idx_pengeluaran_tanggal ON pengeluaran(tanggal_pengajuan);
CREATE INDEX idx_pengeluaran_status ON pengeluaran(status);
CREATE INDEX idx_pengeluaran_kategori ON pengeluaran(kategori_id);
CREATE INDEX idx_iuran_warga_id ON iuran(warga_id);
CREATE INDEX idx_iuran_status ON iuran(status);
CREATE INDEX idx_iuran_periode ON iuran(periode);
CREATE INDEX idx_mutasi_rekening_id ON mutasi_rekening(rekening_id);
CREATE INDEX idx_mutasi_tanggal ON mutasi_rekening(tanggal);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_anggaran_tahun ON anggaran(tahun);

-- =========================================================
-- FUNCTIONS & TRIGGERS
-- =========================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rts_updated_at BEFORE UPDATE ON rts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_warga_updated_at BEFORE UPDATE ON warga FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rekening_updated_at BEFORE UPDATE ON rekening FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_kategori_updated_at BEFORE UPDATE ON kategori_transaksi FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_penerimaan_updated_at BEFORE UPDATE ON penerimaan FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pengeluaran_updated_at BEFORE UPDATE ON pengeluaran FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_anggaran_updated_at BEFORE UPDATE ON anggaran FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_iuran_updated_at BEFORE UPDATE ON iuran FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_aset_updated_at BEFORE UPDATE ON aset FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pengaturan_updated_at BEFORE UPDATE ON pengaturan FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Recalculate saldo rekening otomatis dari saldo_awal + transaksi valid.
CREATE OR REPLACE FUNCTION recalculate_rekening_balance(p_rekening_id INTEGER)
RETURNS VOID AS $$
BEGIN
  IF p_rekening_id IS NULL THEN
    RETURN;
  END IF;

  UPDATE rekening r
  SET saldo_saat_ini = r.saldo_awal
    + COALESCE((
        SELECT SUM(p.nominal)
        FROM penerimaan p
        WHERE p.rekening_id = p_rekening_id
          AND p.status = 'terverifikasi'
      ), 0)
    - COALESCE((
        SELECT SUM(pg.nominal)
        FROM pengeluaran pg
        WHERE pg.rekening_id = p_rekening_id
          AND pg.status = 'lunas'
      ), 0)
  WHERE r.id = p_rekening_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION refresh_rekening_balance_trigger()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM recalculate_rekening_balance(NEW.rekening_id);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.rekening_id IS DISTINCT FROM NEW.rekening_id THEN
      PERFORM recalculate_rekening_balance(OLD.rekening_id);
    END IF;
    PERFORM recalculate_rekening_balance(NEW.rekening_id);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM recalculate_rekening_balance(OLD.rekening_id);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER refresh_rekening_after_penerimaan
AFTER INSERT OR UPDATE OR DELETE ON penerimaan
FOR EACH ROW EXECUTE FUNCTION refresh_rekening_balance_trigger();

CREATE TRIGGER refresh_rekening_after_pengeluaran
AFTER INSERT OR UPDATE OR DELETE ON pengeluaran
FOR EACH ROW EXECUTE FUNCTION refresh_rekening_balance_trigger();

-- Audit otomatis untuk tabel inti.
CREATE OR REPLACE FUNCTION audit_change_trigger()
RETURNS TRIGGER AS $$
DECLARE
  v_record_id TEXT;
  v_action TEXT;
BEGIN
  v_action := TG_OP;
  IF TG_OP = 'DELETE' THEN
    v_record_id := COALESCE(to_jsonb(OLD)->>'id', to_jsonb(OLD)->>'nomor', to_jsonb(OLD)->>'kode_aset');
    INSERT INTO audit_logs(action, table_name, record_id, old_data, new_data, user_name)
    VALUES (v_action, TG_TABLE_NAME, v_record_id, to_jsonb(OLD), NULL, 'system');
    RETURN OLD;
  ELSE
    v_record_id := COALESCE(to_jsonb(NEW)->>'id', to_jsonb(NEW)->>'nomor', to_jsonb(NEW)->>'kode_aset');
    INSERT INTO audit_logs(action, table_name, record_id, old_data, new_data, user_name)
    VALUES (v_action, TG_TABLE_NAME, v_record_id, CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END, to_jsonb(NEW), 'system');
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_penerimaan AFTER INSERT OR UPDATE OR DELETE ON penerimaan FOR EACH ROW EXECUTE FUNCTION audit_change_trigger();
CREATE TRIGGER audit_pengeluaran AFTER INSERT OR UPDATE OR DELETE ON pengeluaran FOR EACH ROW EXECUTE FUNCTION audit_change_trigger();
CREATE TRIGGER audit_iuran AFTER INSERT OR UPDATE OR DELETE ON iuran FOR EACH ROW EXECUTE FUNCTION audit_change_trigger();
CREATE TRIGGER audit_aset AFTER INSERT OR UPDATE OR DELETE ON aset FOR EACH ROW EXECUTE FUNCTION audit_change_trigger();
CREATE TRIGGER audit_rekening AFTER INSERT OR UPDATE OR DELETE ON rekening FOR EACH ROW EXECUTE FUNCTION audit_change_trigger();
CREATE TRIGGER audit_anggaran AFTER INSERT OR UPDATE OR DELETE ON anggaran FOR EACH ROW EXECUTE FUNCTION audit_change_trigger();

-- =========================================================
-- SEED DATA BERSIH RW 07
-- Data ini adalah data awal/simulasi yang rapi, bukan data warga asli.
-- Silakan edit lewat aplikasi atau SQL setelah deploy.
-- =========================================================
INSERT INTO roles (nama_role, deskripsi, permissions) VALUES
  ('Super Admin', 'Akses penuh ke seluruh sistem', '{"all": true}'::jsonb),
  ('Ketua RW', 'Monitoring, approval, dan laporan', '{"dashboard":"read","approval":"write","laporan":"read","audit":"read"}'::jsonb),
  ('Bendahara', 'Mengelola transaksi, kas bank, iuran, dan laporan', '{"dashboard":"read","transaksi":"write","kas_bank":"write","iuran":"write","laporan":"write"}'::jsonb),
  ('Sekretaris', 'Mengelola dokumen, warga, dan laporan', '{"dashboard":"read","warga":"write","laporan":"read"}'::jsonb),
  ('Pengurus RT', 'Input data RT dan monitoring iuran', '{"dashboard":"read","iuran":"write","penerimaan":"create","pengeluaran":"create"}'::jsonb),
  ('Auditor', 'Akses baca untuk audit', '{"dashboard":"read","audit":"read","laporan":"read","transaksi":"read"}'::jsonb),
  ('Warga', 'Melihat data iuran pribadi', '{"iuran_pribadi":"read"}'::jsonb);

INSERT INTO rts (nomor_rt, ketua_rt, alamat, jumlah_warga) VALUES
  ('RT 01', 'Ketua RT 01', 'Wilayah RT 01 RW 07', 0),
  ('RT 02', 'Ketua RT 02', 'Wilayah RT 02 RW 07', 0),
  ('RT 03', 'Ketua RT 03', 'Wilayah RT 03 RW 07', 0),
  ('RT 04', 'Ketua RT 04', 'Wilayah RT 04 RW 07', 0),
  ('RT 05', 'Ketua RT 05', 'Wilayah RT 05 RW 07', 0);

INSERT INTO users (nama, email, role_id, rt_id, telepon, is_active) VALUES
  ('Admin RW 07', 'admin@rw07.local', 1, NULL, NULL, true),
  ('Ketua RW 07', 'ketua@rw07.local', 2, NULL, NULL, true),
  ('Bendahara RW 07', 'bendahara@rw07.local', 3, NULL, NULL, true),
  ('Sekretaris RW 07', 'sekretaris@rw07.local', 4, NULL, NULL, true),
  ('Koordinator RT 01', 'rt01@rw07.local', 5, 1, NULL, true),
  ('Auditor RW 07', 'auditor@rw07.local', 6, NULL, NULL, true);

INSERT INTO warga (rt_id, nama, nik, alamat, no_hp, status) VALUES
  (1, 'Warga RT01-001', '3275010100010001', 'Alamat warga RT 01 RW 07', NULL, 'aktif'),
  (1, 'Warga RT01-002', '3275010100010002', 'Alamat warga RT 01 RW 07', NULL, 'aktif'),
  (1, 'Warga RT01-003', '3275010100010003', 'Alamat warga RT 01 RW 07', NULL, 'aktif'),
  (2, 'Warga RT02-001', '3275010200010001', 'Alamat warga RT 02 RW 07', NULL, 'aktif'),
  (2, 'Warga RT02-002', '3275010200010002', 'Alamat warga RT 02 RW 07', NULL, 'aktif'),
  (2, 'Warga RT02-003', '3275010200010003', 'Alamat warga RT 02 RW 07', NULL, 'aktif'),
  (3, 'Warga RT03-001', '3275010300010001', 'Alamat warga RT 03 RW 07', NULL, 'aktif'),
  (3, 'Warga RT03-002', '3275010300010002', 'Alamat warga RT 03 RW 07', NULL, 'aktif'),
  (3, 'Warga RT03-003', '3275010300010003', 'Alamat warga RT 03 RW 07', NULL, 'aktif'),
  (4, 'Warga RT04-001', '3275010400010001', 'Alamat warga RT 04 RW 07', NULL, 'aktif'),
  (4, 'Warga RT04-002', '3275010400010002', 'Alamat warga RT 04 RW 07', NULL, 'aktif'),
  (4, 'Warga RT04-003', '3275010400010003', 'Alamat warga RT 04 RW 07', NULL, 'aktif'),
  (5, 'Warga RT05-001', '3275010500010001', 'Alamat warga RT 05 RW 07', NULL, 'aktif'),
  (5, 'Warga RT05-002', '3275010500010002', 'Alamat warga RT 05 RW 07', NULL, 'aktif'),
  (5, 'Warga RT05-003', '3275010500010003', 'Alamat warga RT 05 RW 07', NULL, 'aktif');

UPDATE rts r
SET jumlah_warga = sub.jumlah
FROM (
  SELECT rt_id, COUNT(*)::integer AS jumlah
  FROM warga
  WHERE status = 'aktif'
  GROUP BY rt_id
) sub
WHERE r.id = sub.rt_id;

INSERT INTO rekening (nama_rekening, jenis, nomor, bank, saldo_awal, saldo_saat_ini) VALUES
  ('Kas Tunai RW 07', 'kas', NULL, NULL, 2500000, 2500000),
  ('Bank Operasional RW 07', 'bank', 'ISI-NOMOR-REKENING', 'Bank Utama', 10000000, 10000000),
  ('Bank Cadangan RW 07', 'bank', 'ISI-NOMOR-REKENING-2', 'Bank Cadangan', 0, 0);

INSERT INTO kategori_transaksi (kode, nama_kategori, tipe, deskripsi, anggaran_tahunan) VALUES
  ('IUR', 'Iuran Warga', 'penerimaan', 'Iuran bulanan warga RW 07', 60000000),
  ('DON', 'Donasi', 'penerimaan', 'Donasi warga atau pihak luar', 12000000),
  ('LAIN-M', 'Penerimaan Lainnya', 'penerimaan', 'Pendapatan lain-lain', 6000000),
  ('KEB', 'Kebersihan', 'pengeluaran', 'Operasional kebersihan lingkungan', 24000000),
  ('KEA', 'Keamanan', 'pengeluaran', 'Operasional keamanan lingkungan', 36000000),
  ('SOS', 'Sosial', 'pengeluaran', 'Kegiatan sosial dan bantuan warga', 12000000),
  ('INF', 'Infrastruktur', 'pengeluaran', 'Perbaikan fasilitas lingkungan', 48000000),
  ('OPE', 'Operasional', 'pengeluaran', 'ATK, rapat, administrasi', 18000000),
  ('KES', 'Kesehatan', 'pengeluaran', 'Posyandu dan kesehatan warga', 6000000);

INSERT INTO anggaran (tahun, kategori_id, jumlah_anggaran, realisasi, catatan) VALUES
  (2026, 4, 24000000, 0, 'Anggaran awal RW 07'),
  (2026, 5, 36000000, 0, 'Anggaran awal RW 07'),
  (2026, 6, 12000000, 0, 'Anggaran awal RW 07'),
  (2026, 7, 48000000, 0, 'Anggaran awal RW 07'),
  (2026, 8, 18000000, 0, 'Anggaran awal RW 07'),
  (2026, 9, 6000000, 0, 'Anggaran awal RW 07');

-- Periode contoh mengikuti bulan saat ini: September 2026.
INSERT INTO iuran (warga_id, periode, jumlah_tagihan, jumlah_bayar, status, tanggal_jatuh_tempo, tanggal_bayar, metode_bayar) VALUES
  (1, '2026-09', 50000, 50000, 'lunas', '2026-09-10', '2026-09-01', 'Tunai'),
  (2, '2026-09', 50000, 50000, 'lunas', '2026-09-10', '2026-09-01', 'Tunai'),
  (3, '2026-09', 50000, 0, 'belum', '2026-09-10', NULL, NULL),
  (4, '2026-09', 50000, 50000, 'lunas', '2026-09-10', '2026-09-02', 'Transfer'),
  (5, '2026-09', 50000, 0, 'belum', '2026-09-10', NULL, NULL),
  (6, '2026-09', 50000, 50000, 'lunas', '2026-09-10', '2026-09-03', 'Tunai'),
  (7, '2026-09', 50000, 50000, 'lunas', '2026-09-10', '2026-09-04', 'Tunai'),
  (8, '2026-09', 50000, 0, 'belum', '2026-09-10', NULL, NULL),
  (9, '2026-09', 50000, 50000, 'lunas', '2026-09-10', '2026-09-04', 'Transfer'),
  (10, '2026-09', 50000, 50000, 'lunas', '2026-09-10', '2026-09-05', 'Tunai'),
  (11, '2026-09', 50000, 0, 'belum', '2026-09-10', NULL, NULL),
  (12, '2026-09', 50000, 50000, 'lunas', '2026-09-10', '2026-09-05', 'Transfer'),
  (13, '2026-09', 50000, 50000, 'lunas', '2026-09-10', '2026-09-06', 'Tunai'),
  (14, '2026-09', 50000, 0, 'belum', '2026-09-10', NULL, NULL),
  (15, '2026-09', 50000, 50000, 'lunas', '2026-09-10', '2026-09-06', 'Tunai');

INSERT INTO penerimaan (nomor, tanggal, sumber, kategori_id, rekening_id, nominal, metode_bayar, keterangan, status) VALUES
  ('IN-202609-001', '2026-09-01', 'Iuran warga September 2026', 1, 1, 2500000, 'Tunai', 'Setoran awal iuran warga', 'terverifikasi'),
  ('IN-202609-002', '2026-09-08', 'Donasi warga', 2, 2, 1000000, 'Transfer', 'Donasi kegiatan lingkungan', 'terverifikasi'),
  ('IN-202609-003', '2026-09-15', 'Penerimaan lainnya', 3, 1, 350000, 'Tunai', 'Penerimaan administrasi', 'menunggu');

INSERT INTO pengeluaran (nomor, tanggal_pengajuan, tanggal_pembayaran, kategori_id, rekening_id, nominal, deskripsi, status) VALUES
  ('OUT-202609-001', '2026-09-05', '2026-09-05', 4, 1, 750000, 'Operasional kebersihan lingkungan', 'lunas'),
  ('OUT-202609-002', '2026-09-10', '2026-09-11', 5, 2, 1200000, 'Operasional keamanan lingkungan', 'lunas'),
  ('OUT-202609-003', '2026-09-18', NULL, 8, 1, 450000, 'Kebutuhan administrasi sekretariat', 'menunggu');

INSERT INTO aset (kode_aset, nama, kategori, nilai_perolehan, tanggal_perolehan, lokasi, kondisi, keterangan) VALUES
  ('AST-RW07-001', 'Peralatan Sekretariat RW 07', 'Perlengkapan', 5000000, '2026-09-01', 'Sekretariat RW 07', 'Baik', 'Data awal, silakan sesuaikan'),
  ('AST-RW07-002', 'Meja Kursi Rapat', 'Furniture', 3500000, '2026-09-01', 'Balai RW 07', 'Baik', 'Data awal, silakan sesuaikan'),
  ('AST-RW07-003', 'Peralatan Kebersihan', 'Perlengkapan', 2000000, '2026-09-01', 'Gudang RW 07', 'Baik', 'Data awal, silakan sesuaikan');

INSERT INTO pengaturan (key, value, deskripsi) VALUES
  ('nama_rw', '"RW 07"'::jsonb, 'Nama Rukun Warga'),
  ('nama_sistem', '"Sistem Kas RW 07"'::jsonb, 'Nama aplikasi'),
  ('kelurahan', '"Isi nama kelurahan"'::jsonb, 'Nama kelurahan'),
  ('kecamatan', '"Isi nama kecamatan"'::jsonb, 'Nama kecamatan'),
  ('kota', '"Jakarta"'::jsonb, 'Kota/Kabupaten'),
  ('alamat_rw', '"Isi alamat sekretariat RW 07"'::jsonb, 'Alamat sekretariat'),
  ('iuran_bulanan', '50000'::jsonb, 'Nominal iuran bulanan per KK'),
  ('warna_tema', '"#059669"'::jsonb, 'Warna tema aplikasi'),
  ('bank_default', '"Bank Utama"'::jsonb, 'Bank utama RW'),
  ('no_rekening_utama', '"ISI-NOMOR-REKENING"'::jsonb, 'Nomor rekening utama');

-- Recalculate saldo rekening setelah seed transaksi
SELECT recalculate_rekening_balance(id) FROM rekening;

-- Realisasi anggaran dihitung dari pengeluaran lunas tahun berjalan.
UPDATE anggaran a
SET realisasi = COALESCE(sub.total, 0)
FROM (
  SELECT kategori_id, EXTRACT(YEAR FROM tanggal_pembayaran)::integer AS tahun, SUM(nominal) AS total
  FROM pengeluaran
  WHERE status = 'lunas' AND tanggal_pembayaran IS NOT NULL
  GROUP BY kategori_id, EXTRACT(YEAR FROM tanggal_pembayaran)::integer
) sub
WHERE a.kategori_id = sub.kategori_id AND a.tahun = sub.tahun;

-- =========================================================
-- VIEWS
-- =========================================================
CREATE VIEW v_iuran_warga AS
SELECT
  i.id,
  i.warga_id,
  w.nama AS nama_warga,
  w.nik,
  w.no_hp,
  w.email,
  w.rt_id,
  r.nomor_rt,
  i.periode,
  i.jumlah_tagihan,
  i.jumlah_bayar,
  i.status,
  i.tanggal_jatuh_tempo,
  i.tanggal_bayar,
  i.metode_bayar,
  i.created_at,
  i.updated_at
FROM iuran i
JOIN warga w ON i.warga_id = w.id
LEFT JOIN rts r ON w.rt_id = r.id;

CREATE VIEW v_ringkasan_rt AS
SELECT
  r.id AS rt_id,
  r.nomor_rt,
  r.ketua_rt,
  COUNT(DISTINCT w.id) FILTER (WHERE w.status = 'aktif') AS jumlah_warga,
  COUNT(DISTINCT i.warga_id) FILTER (WHERE i.status = 'lunas') AS warga_lunas,
  COUNT(DISTINCT i.warga_id) FILTER (WHERE i.status <> 'lunas') AS warga_belum,
  COALESCE(SUM(i.jumlah_tagihan), 0) AS total_tagihan,
  COALESCE(SUM(i.jumlah_bayar), 0) AS total_terkumpul
FROM rts r
LEFT JOIN warga w ON r.id = w.rt_id
LEFT JOIN iuran i ON w.id = i.warga_id AND i.periode = to_char(CURRENT_DATE, 'YYYY-MM')
GROUP BY r.id, r.nomor_rt, r.ketua_rt;

CREATE VIEW v_laporan_arus_kas AS
SELECT
  p.tanggal,
  'penerimaan'::text AS tipe,
  p.nomor AS referensi,
  kt.nama_kategori AS kategori,
  r.nama_rekening AS rekening,
  p.sumber AS uraian,
  p.nominal AS masuk,
  0::numeric AS keluar,
  p.status
FROM penerimaan p
LEFT JOIN kategori_transaksi kt ON p.kategori_id = kt.id
LEFT JOIN rekening r ON p.rekening_id = r.id
WHERE p.status = 'terverifikasi'
UNION ALL
SELECT
  pg.tanggal_pembayaran AS tanggal,
  'pengeluaran'::text AS tipe,
  pg.nomor AS referensi,
  kt.nama_kategori AS kategori,
  r.nama_rekening AS rekening,
  pg.deskripsi AS uraian,
  0::numeric AS masuk,
  pg.nominal AS keluar,
  pg.status
FROM pengeluaran pg
LEFT JOIN kategori_transaksi kt ON pg.kategori_id = kt.id
LEFT JOIN rekening r ON pg.rekening_id = r.id
WHERE pg.status = 'lunas' AND pg.tanggal_pembayaran IS NOT NULL;

CREATE VIEW v_dashboard_monthly AS
WITH months AS (
  SELECT generate_series(
    date_trunc('month', CURRENT_DATE) - interval '11 months',
    date_trunc('month', CURRENT_DATE),
    interval '1 month'
  )::date AS bulan_date
)
SELECT
  to_char(m.bulan_date, 'YYYY-MM') AS periode,
  to_char(m.bulan_date, 'Mon') AS bulan,
  COALESCE(p.total, 0) AS pemasukan,
  COALESCE(pg.total, 0) AS pengeluaran
FROM months m
LEFT JOIN (
  SELECT date_trunc('month', tanggal)::date AS bulan_date, SUM(nominal) AS total
  FROM penerimaan
  WHERE status = 'terverifikasi'
  GROUP BY 1
) p ON p.bulan_date = m.bulan_date
LEFT JOIN (
  SELECT date_trunc('month', tanggal_pembayaran)::date AS bulan_date, SUM(nominal) AS total
  FROM pengeluaran
  WHERE status = 'lunas' AND tanggal_pembayaran IS NOT NULL
  GROUP BY 1
) pg ON pg.bulan_date = m.bulan_date
ORDER BY m.bulan_date;

CREATE VIEW v_dashboard_kpi AS
SELECT
  COALESCE((SELECT SUM(saldo_saat_ini) FROM rekening WHERE jenis = 'kas' AND is_active), 0) AS saldo_kas_tunai,
  COALESCE((SELECT SUM(saldo_saat_ini) FROM rekening WHERE jenis = 'bank' AND is_active), 0) AS saldo_rekening_bank,
  COALESCE((SELECT SUM(nominal) FROM penerimaan WHERE status = 'terverifikasi' AND tanggal >= date_trunc('month', CURRENT_DATE)::date AND tanggal < (date_trunc('month', CURRENT_DATE) + interval '1 month')::date), 0) AS total_penerimaan_bulan_ini,
  COALESCE((SELECT SUM(nominal) FROM pengeluaran WHERE status = 'lunas' AND tanggal_pembayaran >= date_trunc('month', CURRENT_DATE)::date AND tanggal_pembayaran < (date_trunc('month', CURRENT_DATE) + interval '1 month')::date), 0) AS total_pengeluaran_bulan_ini,
  COALESCE((SELECT COUNT(*) FROM pengeluaran WHERE status = 'menunggu'), 0) AS total_pengajuan_menunggu,
  COALESCE((SELECT COUNT(*) FROM iuran WHERE periode = to_char(CURRENT_DATE, 'YYYY-MM') AND status <> 'lunas'), 0) AS total_iuran_belum_lunas;

COMMIT;

-- Paksa Supabase/PostgREST membaca ulang schema dan relasi baru.
NOTIFY pgrst, 'reload schema';

-- =========================================================
-- HASIL AKHIR
-- =========================================================
SELECT 'Database RW 07 berhasil di-reset dan siap digunakan ✅' AS status,
       (SELECT COUNT(*) FROM roles) AS roles,
       (SELECT COUNT(*) FROM rts) AS rts,
       (SELECT COUNT(*) FROM users) AS users,
       (SELECT COUNT(*) FROM warga) AS warga,
       (SELECT COUNT(*) FROM rekening) AS rekening,
       (SELECT COUNT(*) FROM kategori_transaksi) AS kategori,
       (SELECT COUNT(*) FROM penerimaan) AS penerimaan,
       (SELECT COUNT(*) FROM pengeluaran) AS pengeluaran,
       (SELECT COUNT(*) FROM anggaran) AS anggaran,
       (SELECT COUNT(*) FROM iuran) AS iuran,
       (SELECT COUNT(*) FROM aset) AS aset,
       (SELECT COUNT(*) FROM audit_logs) AS audit_logs;
