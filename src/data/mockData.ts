export const kpiData = {
  saldoKasTunai: 15750000,
  saldoRekeningBank: 48250000,
  totalPenerimaanBulanIni: 12500000,
  totalPengeluaranBulanIni: 8750000,
};

export const monthlyData = [
  { bulan: 'Jan', pemasukan: 12000000, pengeluaran: 9500000 },
  { bulan: 'Feb', pemasukan: 11000000, pengeluaran: 8000000 },
  { bulan: 'Mar', pemasukan: 13500000, pengeluaran: 10200000 },
  { bulan: 'Apr', pemasukan: 10500000, pengeluaran: 7800000 },
  { bulan: 'Mei', pemasukan: 14000000, pengeluaran: 11000000 },
  { bulan: 'Jun', pemasukan: 12500000, pengeluaran: 9000000 },
  { bulan: 'Jul', pemasukan: 15000000, pengeluaran: 12500000 },
  { bulan: 'Agu', pemasukan: 11500000, pengeluaran: 8500000 },
  { bulan: 'Sep', pemasukan: 13000000, pengeluaran: 9800000 },
  { bulan: 'Okt', pemasukan: 14500000, pengeluaran: 10500000 },
  { bulan: 'Nov', pemasukan: 12000000, pengeluaran: 8200000 },
  { bulan: 'Des', pemasukan: 12500000, pengeluaran: 8750000 },
];

export const anggaranData = [
  { pos: 'Kebersihan', anggaran: 24000000, realisasi: 18500000 },
  { pos: 'Keamanan', anggaran: 36000000, realisasi: 28000000 },
  { pos: 'Sosial', anggaran: 12000000, realisasi: 8500000 },
  { pos: 'Infrastruktur', anggaran: 48000000, realisasi: 32000000 },
  { pos: 'Operasional', anggaran: 18000000, realisasi: 14200000 },
  { pos: 'Kesehatan', anggaran: 6000000, realisasi: 3800000 },
];

export const recentTransactions = [
  { id: 1, nomor: 'TRX-2024-001', tanggal: '2024-12-01', tipe: 'penerimaan', kategori: 'Iuran Warga', nominal: 2500000, sumber: 'RT 01', status: 'terverifikasi' },
  { id: 2, nomor: 'TRX-2024-002', tanggal: '2024-12-01', tipe: 'pengeluaran', kategori: 'Kebersihan', nominal: 1500000, sumber: 'Gaji Petugas Kebersihan', status: 'terverifikasi' },
  { id: 3, nomor: 'TRX-2024-003', tanggal: '2024-12-02', tipe: 'penerimaan', kategori: 'Donasi', nominal: 5000000, sumber: 'Bpk. Ahmad', status: 'terverifikasi' },
  { id: 4, nomor: 'TRX-2024-004', tanggal: '2024-12-03', tipe: 'pengeluaran', kategori: 'Infrastruktur', nominal: 3500000, sumber: 'Perbaikan Jalan', status: 'menunggu' },
  { id: 5, nomor: 'TRX-2024-005', tanggal: '2024-12-03', tipe: 'penerimaan', kategori: 'Iuran Warga', nominal: 1800000, sumber: 'RT 02', status: 'terverifikasi' },
  { id: 6, nomor: 'TRX-2024-006', tanggal: '2024-12-04', tipe: 'pengeluaran', kategori: 'Keamanan', nominal: 2000000, sumber: 'Gaji Satpam', status: 'terverifikasi' },
  { id: 7, nomor: 'TRX-2024-007', tanggal: '2024-12-04', tipe: 'penerimaan', kategori: 'Iuran Warga', nominal: 3200000, sumber: 'RT 03', status: 'menunggu' },
  { id: 8, nomor: 'TRX-2024-008', tanggal: '2024-12-05', tipe: 'pengeluaran', kategori: 'Sosial', nominal: 750000, sumber: 'Santunan', status: 'disetujui' },
  { id: 9, nomor: 'TRX-2024-009', tanggal: '2024-12-05', tipe: 'penerimaan', kategori: 'Pendapatan Lain', nominal: 500000, sumber: 'Sewa Lapangan', status: 'terverifikasi' },
  { id: 10, nomor: 'TRX-2024-010', tanggal: '2024-12-06', tipe: 'pengeluaran', kategori: 'Operasional', nominal: 350000, sumber: 'ATK & Fotocopy', status: 'terverifikasi' },
];

export const pendingApprovals = [
  { id: 1, nomor: 'TRX-2024-004', pengaju: 'Budi Santoso', nominal: 3500000, kategori: 'Infrastruktur', tanggal: '2024-12-03', deskripsi: 'Perbaikan jalan RT 02 yang rusak' },
  { id: 2, nomor: 'TRX-2024-007', pengaju: 'Siti Aminah', nominal: 3200000, kategori: 'Iuran Warga', tanggal: '2024-12-04', deskripsi: 'Iuran bulan Desember RT 03' },
  { id: 3, nomor: 'TRX-2024-011', pengaju: 'Ahmad Fauzi', nominal: 5000000, kategori: 'Keamanan', tanggal: '2024-12-06', deskripsi: 'Pembelian CCTV baru pos keamanan' },
];

export const rekeningData = [
  { id: 1, nama: 'Kas Tunai RW 05', jenis: 'kas', nomor: '-', bank: '-', saldo: 15750000 },
  { id: 2, nama: 'Bank BSI - RW 05', jenis: 'bank', nomor: '7210-05-123456', bank: 'BSI', saldo: 32500000 },
  { id: 3, nama: 'Bank Mandiri - RW 05', jenis: 'bank', nomor: '132-00-765432', bank: 'Mandiri', saldo: 15750000 },
];

export const wargaData = [
  { id: 1, nama: 'Ahmad Sudirman', rt: 'RT 01', nik: '3201xxxx0001', tagihan: 50000, status: 'lunas', periode: 'Des 2024' },
  { id: 2, nama: 'Budi Santoso', rt: 'RT 01', nik: '3201xxxx0002', tagihan: 50000, status: 'lunas', periode: 'Des 2024' },
  { id: 3, nama: 'Citra Dewi', rt: 'RT 02', nik: '3201xxxx0003', tagihan: 50000, status: 'belum', periode: 'Des 2024' },
  { id: 4, nama: 'Dedi Kurniawan', rt: 'RT 02', nik: '3201xxxx0004', tagihan: 50000, status: 'lunas', periode: 'Des 2024' },
  { id: 5, nama: 'Eka Putri', rt: 'RT 03', nik: '3201xxxx0005', tagihan: 50000, status: 'belum', periode: 'Des 2024' },
  { id: 6, nama: 'Fajar Nugroho', rt: 'RT 03', nik: '3201xxxx0006', tagihan: 50000, status: 'lunas', periode: 'Des 2024' },
  { id: 7, nama: 'Gunawan Pratama', rt: 'RT 04', nik: '3201xxxx0007', tagihan: 50000, status: 'belum', periode: 'Des 2024' },
  { id: 8, nama: 'Heni Susanti', rt: 'RT 04', nik: '3201xxxx0008', tagihan: 50000, status: 'lunas', periode: 'Des 2024' },
  { id: 9, nama: 'Irfan Hakim', rt: 'RT 05', nik: '3201xxxx0009', tagihan: 50000, status: 'belum', periode: 'Des 2024' },
  { id: 10, nama: 'Joko Widodo', rt: 'RT 05', nik: '3201xxxx0010', tagihan: 50000, status: 'lunas', periode: 'Des 2024' },
];

export const usersData = [
  { id: 1, nama: 'H. Suparman', email: 'ketua@rw05.id', role: 'Ketua RW', rt: '-', status: 'aktif', lastLogin: '2024-12-06 08:30' },
  { id: 2, nama: 'Sri Wahyuni', email: 'bendahara@rw05.id', role: 'Bendahara', rt: '-', status: 'aktif', lastLogin: '2024-12-06 09:15' },
  { id: 3, nama: 'Budi Santoso', email: 'budi@rw05.id', role: 'Pengurus RT', rt: 'RT 01', status: 'aktif', lastLogin: '2024-12-05 14:20' },
  { id: 4, nama: 'Siti Aminah', email: 'siti@rw05.id', role: 'Pengurus RT', rt: 'RT 03', status: 'aktif', lastLogin: '2024-12-06 07:45' },
  { id: 5, nama: 'Dr. Rahman', email: 'auditor@rw05.id', role: 'Auditor', rt: '-', status: 'aktif', lastLogin: '2024-12-04 10:00' },
  { id: 6, nama: 'Ahmad Sudirman', email: 'ahmad@email.com', role: 'Warga', rt: 'RT 01', status: 'aktif', lastLogin: '2024-12-03 19:30' },
];

export const auditLogs = [
  { id: 1, user: 'Sri Wahyuni', action: 'CREATE', table: 'penerimaan', record: 'TRX-2024-003', waktu: '2024-12-03 10:15:30', detail: 'Menambahkan penerimaan donasi Rp 5.000.000' },
  { id: 2, user: 'Budi Santoso', action: 'CREATE', table: 'pengeluaran', record: 'TRX-2024-004', waktu: '2024-12-03 11:00:00', detail: 'Mengajukan pengeluaran perbaikan jalan Rp 3.500.000' },
  { id: 3, user: 'H. Suparman', action: 'APPROVE', table: 'pengeluaran', record: 'TRX-2024-002', waktu: '2024-12-02 14:30:00', detail: 'Menyetujui pengeluaran gaji petugas kebersihan' },
  { id: 4, user: 'Sri Wahyuni', action: 'UPDATE', table: 'rekening', record: 'Kas Tunai', waktu: '2024-12-02 15:00:00', detail: 'Update saldo kas tunai' },
  { id: 5, user: 'Siti Aminah', action: 'CREATE', table: 'iuran', record: 'Batch Dec 2024', waktu: '2024-12-01 09:00:00', detail: 'Input iuran warga RT 03 bulan Desember' },
  { id: 6, user: 'Sri Wahyuni', action: 'CREATE', table: 'penerimaan', record: 'TRX-2024-005', waktu: '2024-12-03 13:45:00', detail: 'Menambahkan penerimaan iuran RT 02 Rp 1.800.000' },
  { id: 7, user: 'H. Suparman', action: 'REJECT', table: 'pengeluaran', record: 'TRX-2024-008', waktu: '2024-12-04 08:00:00', detail: 'Menolak pengeluaran - bukti tidak lengkap' },
  { id: 8, user: 'Dr. Rahman', action: 'VIEW', table: 'audit_logs', record: '-', waktu: '2024-12-04 10:00:00', detail: 'Melihat audit trail periode November 2024' },
];

export const asetData = [
  { id: 1, kode: 'AST-001', nama: 'Gedung Serbaguna RW 05', kategori: 'Bangunan', nilai: 500000000, lokasi: 'Jl. Melati No. 1', kondisi: 'Baik' },
  { id: 2, kode: 'AST-002', nama: 'CCTV Pos Keamanan', kategori: 'Elektronik', nilai: 15000000, lokasi: 'Pos Keamanan', kondisi: 'Baik' },
  { id: 3, kode: 'AST-003', nama: 'Sound System', kategori: 'Elektronik', nilai: 8000000, lokasi: 'Gedung Serbaguna', kondisi: 'Baik' },
  { id: 4, kode: 'AST-004', nama: 'Tenda 3x3 (2 unit)', kategori: 'Perlengkapan', nilai: 4000000, lokasi: 'Gudang RW', kondisi: 'Cukup' },
  { id: 5, kode: 'AST-005', nama: 'Komputer & Printer', kategori: 'Elektronik', nilai: 12000000, lokasi: 'Sekretariat', kondisi: 'Baik' },
];

export const notifications = [
  { id: 1, type: 'warning', message: '3 pengajuan menunggu persetujuan', time: '5 menit lalu' },
  { id: 2, type: 'info', message: 'Iuran RT 02 bulan Desember telah diterima', time: '1 jam lalu' },
  { id: 3, type: 'success', message: 'Laporan bulanan November berhasil digenerate', time: '2 jam lalu' },
  { id: 4, type: 'error', message: 'Selisih kas kecil Rp 50.000 - perlu investigasi', time: '3 jam lalu' },
];
