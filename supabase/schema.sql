-- ============================================
-- SISTEM KEUANGAN RW 05 - SUPABASE DATABASE
-- Jalankan script ini di Supabase SQL Editor
-- ============================================

-- Hapus tabel jika sudah ada (untuk testing)
DROP VIEW IF EXISTS v_laporan_arus_kas;
DROP VIEW IF EXISTS v_iuran_warga;
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS iuran;
DROP TABLE IF EXISTS mutasi_rekening;
DROP TABLE IF EXISTS jurnal;
DROP TABLE IF EXISTS pengeluaran;
DROP TABLE IF EXISTS penerimaan;
DROP TABLE IF EXISTS anggaran;
DROP TABLE IF EXISTS aset;
DROP TABLE IF EXISTS warga;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS rekening;
DROP TABLE IF EXISTS kategori_transaksi;
DROP TABLE IF EXISTS rts;
DROP TABLE IF EXISTS roles;
DROP TABLE IF EXISTS pengaturan;

-- ============================================
-- 1. TABEL ROLES (Peran Pengguna)
-- ============================================
CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  nama_role VARCHAR(50) NOT NULL UNIQUE,
  deskripsi TEXT,
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO roles (nama_role, deskripsi, permissions) VALUES
  ('Super Admin', 'Akses penuh ke seluruh sistem', '{"all": true}'::jsonb),
  ('Ketua RW', 'Melihat laporan dan menyetujui anggaran', '{"dashboard": "read", "approval": "write", "laporan": "read", "anggaran": "approve"}'::jsonb),
  ('Bendahara', 'Input transaksi dan bank reconciliation', '{"dashboard": "read", "transaksi": "write", "kas_bank": "write", "laporan": "write", "iuran": "write"}'::jsonb),
  ('Sekretaris', 'Menyiapkan dokumen dan upload lampiran', '{"dashboard": "read", "dokumen": "write", "laporan": "read"}'::jsonb),
  ('Pengurus RT', 'Mengusulkan iuran dan laporan RT', '{"dashboard": "read", "iuran": "write", "pengeluaran": "create", "penerimaan": "create"}'::jsonb),
  ('Auditor', 'Akses baca untuk audit dan audit trail', '{"dashboard": "read", "audit_logs": "read", "laporan": "read", "transaksi": "read"}'::jsonb),
  ('Warga', 'Melihat riwayat iuran pribadi', '{"dashboard": "read", "iuran_pribadi": "read"}'::jsonb);

-- ============================================
-- 2. TABEL RT (Rukun Tetangga)
-- ============================================
CREATE TABLE rts (
  id SERIAL PRIMARY KEY,
  nomor_rt VARCHAR(10) NOT NULL UNIQUE,
  ketua_rt VARCHAR(100),
  alamat TEXT,
  jumlah_warga INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO rts (nomor_rt, ketua_rt, alamat, jumlah_warga) VALUES
  ('RT 01', 'Budi Santoso', 'Jl. Melati Blok A No. 1-20', 45),
  ('RT 02', 'Siti Aminah', 'Jl. Melati Blok B No. 21-40', 52),
  ('RT 03', 'Ahmad Fauzi', 'Jl. Melati Blok C No. 41-60', 38),
  ('RT 04', 'Dewi Lestari', 'Jl. Melati Blok D No. 61-80', 41),
  ('RT 05', 'Eko Prasetyo', 'Jl. Melati Blok E No. 81-100', 36);

-- ============================================
-- 3. TABEL USERS (Pengguna Sistem)
-- ============================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nama VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role_id INTEGER REFERENCES roles(id),
  rt_id INTEGER REFERENCES rts(id),
  telepon VARCHAR(20),
  alamat TEXT,
  foto_url VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 4. TABEL WARGA (Data Warga RW)
-- ============================================
CREATE TABLE warga (
  id SERIAL PRIMARY KEY,
  rt_id INTEGER REFERENCES rts(id),
  nama VARCHAR(100) NOT NULL,
  nik VARCHAR(20) UNIQUE,
  alamat TEXT,
  no_hp VARCHAR(20),
  email VARCHAR(100),
  status VARCHAR(20) DEFAULT 'aktif',
  tanggal_daftar DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert data warga sample
INSERT INTO warga (rt_id, nama, nik, alamat, no_hp, status) VALUES
  (1, 'Ahmad Sudirman', '3201010001', 'Jl. Melati Blok A No. 5', '081234567001', 'aktif'),
  (1, 'Budi Santoso', '3201010002', 'Jl. Melati Blok A No. 8', '081234567002', 'aktif'),
  (1, 'Cahyo Wibowo', '3201010003', 'Jl. Melati Blok A No. 12', '081234567003', 'aktif'),
  (2, 'Citra Dewi', '3201020001', 'Jl. Melati Blok B No. 22', '081234567004', 'aktif'),
  (2, 'Dedi Kurniawan', '3201020002', 'Jl. Melati Blok B No. 25', '081234567005', 'aktif'),
  (2, 'Dian Purnama', '3201020003', 'Jl. Melati Blok B No. 30', '081234567006', 'aktif'),
  (3, 'Eka Putri', '3201030001', 'Jl. Melati Blok C No. 42', '081234567007', 'aktif'),
  (3, 'Fajar Nugroho', '3201030002', 'Jl. Melati Blok C No. 48', '081234567008', 'aktif'),
  (3, 'Fitri Handayani', '3201030003', 'Jl. Melati Blok C No. 55', '081234567009', 'aktif'),
  (4, 'Gunawan Pratama', '3201040001', 'Jl. Melati Blok D No. 62', '081234567010', 'aktif'),
  (4, 'Heni Susanti', '3201040002', 'Jl. Melati Blok D No. 68', '081234567011', 'aktif'),
  (4, 'Hendra Wijaya', '3201040003', 'Jl. Melati Blok D No. 75', '081234567012', 'aktif'),
  (5, 'Irfan Hakim', '3201050001', 'Jl. Melati Blok E No. 82', '081234567013', 'aktif'),
  (5, 'Joko Widodo', '3201050002', 'Jl. Melati Blok E No. 88', '081234567014', 'aktif'),
  (5, 'Kartika Sari', '3201050003', 'Jl. Melati Blok E No. 95', '081234567015', 'aktif');

-- ============================================
-- 5. TABEL REKENING (Kas & Bank)
-- ============================================
CREATE TABLE rekening (
  id SERIAL PRIMARY KEY,
  nama_rekening VARCHAR(100) NOT NULL,
  jenis VARCHAR(20) CHECK (jenis IN ('kas', 'bank')),
  nomor VARCHAR(50),
  bank VARCHAR(50),
  saldo_awal DECIMAL(15,2) DEFAULT 0,
  saldo_saat_ini DECIMAL(15,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO rekening (nama_rekening, jenis, nomor, bank, saldo_awal, saldo_saat_ini) VALUES
  ('Kas Tunai RW 05', 'kas', NULL, NULL, 15750000, 15750000),
  ('Bank BSI - RW 05', 'bank', '7210-05-123456', 'BSI', 32500000, 32500000),
  ('Bank Mandiri - RW 05', 'bank', '132-00-765432', 'Mandiri', 15750000, 15750000);

-- ============================================
-- 6. TABEL KATEGORI TRANSAKSI
-- ============================================
CREATE TABLE kategori_transaksi (
  id SERIAL PRIMARY KEY,
  kode VARCHAR(20) NOT NULL UNIQUE,
  nama_kategori VARCHAR(100) NOT NULL,
  tipe VARCHAR(20) CHECK (tipe IN ('penerimaan', 'pengeluaran', 'semua')),
  deskripsi TEXT,
  anggaran_tahunan DECIMAL(15,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO kategori_transaksi (kode, nama_kategori, tipe, deskripsi, anggaran_tahunan) VALUES
  ('IUR', 'Iuran Warga', 'penerimaan', 'Iuran bulanan warga RW', 60000000),
  ('DON', 'Donasi', 'penerimaan', 'Donasi dari warga atau pihak luar', 24000000),
  ('PEN', 'Pendapatan Lain', 'penerimaan', 'Pendapatan dari sewa, dll', 12000000),
  ('KEB', 'Kebersihan', 'pengeluaran', 'Gaji petugas kebersihan & operasional', 24000000),
  ('KEA', 'Keamanan', 'pengeluaran', 'Gaji satpam & operasional pos', 36000000),
  ('SOS', 'Sosial', 'pengeluaran', 'Santunan, bantuan sosial', 12000000),
  ('INF', 'Infrastruktur', 'pengeluaran', 'Perbaikan jalan, drainase, dll', 48000000),
  ('OPE', 'Operasional', 'pengeluaran', 'ATK, fotocopy, rapat', 18000000),
  ('KES', 'Kesehatan', 'pengeluaran', 'Posyandu, obat-obatan', 6000000);

-- ============================================
-- 7. TABEL PENERIMAAN
-- ============================================
CREATE TABLE penerimaan (
  id SERIAL PRIMARY KEY,
  nomor VARCHAR(50) NOT NULL UNIQUE,
  tanggal DATE NOT NULL,
  sumber VARCHAR(100),
  kategori_id INTEGER REFERENCES kategori_transaksi(id),
  rekening_id INTEGER REFERENCES rekening(id),
  nominal DECIMAL(15,2) NOT NULL,
  metode_bayar VARCHAR(50),
  bukti_file VARCHAR(255),
  keterangan TEXT,
  status VARCHAR(20) DEFAULT 'terverifikasi',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample data penerimaan
INSERT INTO penerimaan (nomor, tanggal, sumber, kategori_id, rekening_id, nominal, metode_bayar, keterangan, status) VALUES
  ('TRX-2024-001', '2024-12-01', 'RT 01', 1, 1, 2500000, 'Tunai', 'Iuran bulan Desember RT 01', 'terverifikasi'),
  ('TRX-2024-003', '2024-12-02', 'Bpk. Ahmad', 2, 2, 5000000, 'Transfer', 'Donasi pembangunan masjid', 'terverifikasi'),
  ('TRX-2024-005', '2024-12-03', 'RT 02', 1, 1, 1800000, 'Tunai', 'Iuran bulan Desember RT 02', 'terverifikasi'),
  ('TRX-2024-007', '2024-12-04', 'RT 03', 1, 2, 3200000, 'Transfer', 'Iuran bulan Desember RT 03', 'menunggu'),
  ('TRX-2024-009', '2024-12-05', 'Sewa Lapangan', 3, 1, 500000, 'Tunai', 'Sewa lapangan untuk acara', 'terverifikasi'),
  ('TRX-2024-010', '2024-11-01', 'RT 01', 1, 1, 2300000, 'Tunai', 'Iuran bulan November RT 01', 'terverifikasi'),
  ('TRX-2024-011', '2024-11-05', 'RT 02', 1, 1, 2000000, 'Tunai', 'Iuran bulan November RT 02', 'terverifikasi'),
  ('TRX-2024-012', '2024-11-10', 'Donatur Anonim', 2, 2, 10000000, 'Transfer', 'Donasi untuk kegiatan sosial', 'terverifikasi');

-- ============================================
-- 8. TABEL PENGELUARAN
-- ============================================
CREATE TABLE pengeluaran (
  id SERIAL PRIMARY KEY,
  nomor VARCHAR(50) NOT NULL UNIQUE,
  tanggal_pengajuan DATE NOT NULL,
  tanggal_pembayaran DATE,
  pengaju_id UUID REFERENCES users(id),
  kategori_id INTEGER REFERENCES kategori_transaksi(id),
  rekening_id INTEGER REFERENCES rekening(id),
  nominal DECIMAL(15,2) NOT NULL,
  deskripsi TEXT,
  status VARCHAR(20) DEFAULT 'menunggu' CHECK (status IN ('menunggu', 'disetujui', 'ditolak', 'lunas')),
  bukti_pengajuan VARCHAR(255),
  bukti_pembayaran VARCHAR(255),
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  catatan_approval TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample data pengeluaran
INSERT INTO pengeluaran (nomor, tanggal_pengajuan, tanggal_pembayaran, kategori_id, rekening_id, nominal, deskripsi, status) VALUES
  ('TRX-2024-002', '2024-12-01', '2024-12-02', 4, 1, 1500000, 'Gaji Petugas Kebersihan bulan Desember', 'lunas'),
  ('TRX-2024-004', '2024-12-03', NULL, 7, 1, 3500000, 'Perbaikan jalan RT 02 yang rusak', 'menunggu'),
  ('TRX-2024-006', '2024-12-04', '2024-12-05', 5, 2, 2000000, 'Gaji Satpam bulan Desember', 'lunas'),
  ('TRX-2024-008', '2024-12-05', NULL, 6, 1, 750000, 'Santunan warga sakit', 'disetujui'),
  ('TRX-2024-010', '2024-12-06', '2024-12-06', 8, 1, 350000, 'ATK & Fotocopy untuk sekretariat', 'lunas'),
  ('TRX-2024-011', '2024-12-06', NULL, 5, 2, 5000000, 'Pembelian CCTV baru pos keamanan', 'menunggu');

-- ============================================
-- 9. TABEL JURNAL (Akuntansi)
-- ============================================
CREATE TABLE jurnal (
  id SERIAL PRIMARY KEY,
  tanggal DATE NOT NULL,
  kode_ref VARCHAR(50),
  akun_debit VARCHAR(100),
  akun_kredit VARCHAR(100),
  nominal DECIMAL(15,2) NOT NULL,
  keterangan TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 10. TABEL ANGGARAN
-- ============================================
CREATE TABLE anggaran (
  id SERIAL PRIMARY KEY,
  tahun INTEGER NOT NULL,
  kategori_id INTEGER REFERENCES kategori_transaksi(id),
  jumlah_anggaran DECIMAL(15,2) NOT NULL,
  realisasi DECIMAL(15,2) DEFAULT 0,
  catatan TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tahun, kategori_id)
);

-- Insert anggaran 2024
INSERT INTO anggaran (tahun, kategori_id, jumlah_anggaran, realisasi) VALUES
  (2024, 4, 24000000, 18500000),
  (2024, 5, 36000000, 28000000),
  (2024, 6, 12000000, 8500000),
  (2024, 7, 48000000, 32000000),
  (2024, 8, 18000000, 14200000),
  (2024, 9, 6000000, 3800000);

-- ============================================
-- 11. TABEL MUTASI REKENING
-- ============================================
CREATE TABLE mutasi_rekening (
  id SERIAL PRIMARY KEY,
  rekening_id INTEGER REFERENCES rekening(id),
  tanggal DATE NOT NULL,
  tipe VARCHAR(10) CHECK (tipe IN ('masuk', 'keluar')),
  nominal DECIMAL(15,2) NOT NULL,
  saldo_sesudah DECIMAL(15,2),
  referensi_id INTEGER,
  keterangan TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 12. TABEL IURAN WARGA
-- ============================================
CREATE TABLE iuran (
  id SERIAL PRIMARY KEY,
  warga_id INTEGER REFERENCES warga(id),
  periode VARCHAR(20) NOT NULL,
  jumlah_tagihan DECIMAL(15,2) NOT NULL,
  jumlah_bayar DECIMAL(15,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'belum' CHECK (status IN ('belum', 'lunas', 'terlambat')),
  tanggal_jatuh_tempo DATE,
  tanggal_bayar DATE,
  bukti_pembayaran VARCHAR(255),
  metode_bayar VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample data iuran
INSERT INTO iuran (warga_id, periode, jumlah_tagihan, jumlah_bayar, status, tanggal_jatuh_tempo, tanggal_bayar) VALUES
  (1, 'Des 2024', 50000, 50000, 'lunas', '2024-12-10', '2024-12-01'),
  (2, 'Des 2024', 50000, 50000, 'lunas', '2024-12-10', '2024-12-02'),
  (3, 'Des 2024', 50000, 0, 'belum', '2024-12-10', NULL),
  (4, 'Des 2024', 50000, 50000, 'lunas', '2024-12-10', '2024-12-03'),
  (5, 'Des 2024', 50000, 50000, 'lunas', '2024-12-10', '2024-12-01'),
  (6, 'Des 2024', 50000, 0, 'belum', '2024-12-10', NULL),
  (7, 'Des 2024', 50000, 50000, 'lunas', '2024-12-10', '2024-12-04'),
  (8, 'Des 2024', 50000, 50000, 'lunas', '2024-12-10', '2024-12-02'),
  (9, 'Des 2024', 50000, 0, 'belum', '2024-12-10', NULL),
  (10, 'Des 2024', 50000, 50000, 'lunas', '2024-12-10', '2024-12-05'),
  (11, 'Des 2024', 50000, 50000, 'lunas', '2024-12-10', '2024-12-03'),
  (12, 'Des 2024', 50000, 0, 'belum', '2024-12-10', NULL),
  (13, 'Des 2024', 50000, 50000, 'lunas', '2024-12-10', '2024-12-06'),
  (14, 'Des 2024', 50000, 50000, 'lunas', '2024-12-10', '2024-12-01'),
  (15, 'Des 2024', 50000, 0, 'belum', '2024-12-10', NULL);

-- ============================================
-- 13. TABEL ASET/INVENTARIS
-- ============================================
CREATE TABLE aset (
  id SERIAL PRIMARY KEY,
  kode_aset VARCHAR(50) NOT NULL UNIQUE,
  nama VARCHAR(200) NOT NULL,
  kategori VARCHAR(100),
  nilai_perolehan DECIMAL(15,2),
  tanggal_perolehan DATE,
  lokasi VARCHAR(200),
  kondisi VARCHAR(50) CHECK (kondisi IN ('Baik', 'Cukup', 'Rusak Ringan', 'Rusak Berat')),
  foto VARCHAR(255),
  keterangan TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample data aset
INSERT INTO aset (kode_aset, nama, kategori, nilai_perolehan, tanggal_perolehan, lokasi, kondisi) VALUES
  ('AST-001', 'Gedung Serbaguna RW 05', 'Bangunan', 500000000, '2015-06-15', 'Jl. Melati No. 1', 'Baik'),
  ('AST-002', 'CCTV Pos Keamanan (4 unit)', 'Elektronik', 15000000, '2023-03-20', 'Pos Keamanan', 'Baik'),
  ('AST-003', 'Sound System Portable', 'Elektronik', 8000000, '2022-08-10', 'Gedung Serbaguna', 'Baik'),
  ('AST-004', 'Tenda 3x3 (2 unit)', 'Perlengkapan', 4000000, '2021-05-05', 'Gudang RW', 'Cukup'),
  ('AST-005', 'Komputer Desktop & Printer', 'Elektronik', 12000000, '2022-01-15', 'Sekretariat', 'Baik'),
  ('AST-006', 'Meja & Kursi Rapat (1 set)', 'Furniture', 5000000, '2020-11-20', 'Gedung Serbaguna', 'Baik'),
  ('AST-007', 'Proyektor', 'Elektronik', 7500000, '2023-07-01', 'Gedung Serbaguna', 'Baik');

-- ============================================
-- 14. TABEL AUDIT LOGS
-- ============================================
CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  user_name VARCHAR(100),
  action VARCHAR(50) NOT NULL,
  table_name VARCHAR(100),
  record_id VARCHAR(100),
  old_data JSONB,
  new_data JSONB,
  ip_address VARCHAR(50),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 15. TABEL PENGATURAN
-- ============================================
CREATE TABLE pengaturan (
  id SERIAL PRIMARY KEY,
  key VARCHAR(100) NOT NULL UNIQUE,
  value JSONB,
  deskripsi TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO pengaturan (key, value, deskripsi) VALUES
  ('nama_rw', '"RW 05"'::jsonb, 'Nama Rukun Warga'),
  ('kelurahan', '"Sukamaju"'::jsonb, 'Nama Kelurahan'),
  ('kecamatan', '"Cimanggis"'::jsonb, 'Nama Kecamatan'),
  ('kota', '"Depok"'::jsonb, 'Nama Kota'),
  ('logo_url', '""'::jsonb, 'URL Logo RW'),
  ('iuran_bulanan', '50000'::jsonb, 'Nominal iuran bulanan per KK'),
  ('warna_tema', '"#059669"'::jsonb, 'Warna tema aplikasi'),
  ('bank_default', '"BSI"'::jsonb, 'Bank utama RW'),
  ('no_rekening_utama', '"7210-05-123456"'::jsonb, 'Nomor rekening utama');

-- ============================================
-- INDEXES (Untuk Performa Query)
-- ============================================
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role_id ON users(role_id);
CREATE INDEX idx_users_rt_id ON users(rt_id);
CREATE INDEX idx_warga_rt_id ON warga(rt_id);
CREATE INDEX idx_warga_nik ON warga(nik);
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
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_anggaran_tahun ON anggaran(tahun);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Auto update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rts_updated_at BEFORE UPDATE ON rts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_warga_updated_at BEFORE UPDATE ON warga FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rekening_updated_at BEFORE UPDATE ON rekening FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_penerimaan_updated_at BEFORE UPDATE ON penerimaan FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pengeluaran_updated_at BEFORE UPDATE ON pengeluaran FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_anggaran_updated_at BEFORE UPDATE ON anggaran FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_iuran_updated_at BEFORE UPDATE ON iuran FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_aset_updated_at BEFORE UPDATE ON aset FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pengaturan_updated_at BEFORE UPDATE ON pengaturan FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VIEWS (Untuk Laporan)
-- ============================================

-- View Laporan Arus Kas
CREATE VIEW v_laporan_arus_kas AS
SELECT 
  tanggal,
  'penerimaan' as tipe,
  nominal,
  kategori_id,
  rekening_id,
  nomor as referensi
FROM penerimaan
WHERE status = 'terverifikasi'
UNION ALL
SELECT 
  tanggal_pembayaran as tanggal,
  'pengeluaran' as tipe,
  nominal,
  kategori_id,
  rekening_id,
  nomor as referensi
FROM pengeluaran
WHERE status = 'lunas' AND tanggal_pembayaran IS NOT NULL
ORDER BY tanggal DESC;

-- View Iuran Warga Lengkap
CREATE VIEW v_iuran_warga AS
SELECT 
  i.id,
  w.nama as nama_warga,
  w.nik,
  w.no_hp,
  r.nomor_rt,
  i.periode,
  i.jumlah_tagihan,
  i.jumlah_bayar,
  i.status,
  i.tanggal_jatuh_tempo,
  i.tanggal_bayar
FROM iuran i
JOIN warga w ON i.warga_id = w.id
JOIN rts r ON w.rt_id = r.id;

-- View Ringkasan per RT
CREATE VIEW v_ringkasan_rt AS
SELECT 
  r.id as rt_id,
  r.nomor_rt,
  r.ketua_rt,
  COUNT(DISTINCT w.id) as jumlah_warga,
  COUNT(DISTINCT CASE WHEN i.status = 'lunas' THEN w.id END) as warga_lunas,
  COALESCE(SUM(i.jumlah_tagihan), 0) as total_tagihan,
  COALESCE(SUM(i.jumlah_bayar), 0) as total_terkumpul
FROM rts r
LEFT JOIN warga w ON r.id = w.rt_id
LEFT JOIN iuran i ON w.id = i.warga_id AND i.periode = 'Des 2024'
GROUP BY r.id, r.nomor_rt, r.ketua_rt;

-- ============================================
-- SELESAI! Database siap digunakan
-- ============================================
SELECT 'Database berhasil dibuat! 🎉' as status, 
       (SELECT COUNT(*) FROM roles) as roles,
       (SELECT COUNT(*) FROM rts) as rts,
       (SELECT COUNT(*) FROM warga) as warga,
       (SELECT COUNT(*) FROM rekening) as rekening,
       (SELECT COUNT(*) FROM kategori_transaksi) as kategori,
       (SELECT COUNT(*) FROM penerimaan) as penerimaan,
       (SELECT COUNT(*) FROM pengeluaran) as pengeluaran,
       (SELECT COUNT(*) FROM anggaran) as anggaran,
       (SELECT COUNT(*) FROM iuran) as iuran,
       (SELECT COUNT(*) FROM aset) as aset;
