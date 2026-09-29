# Stage 3 + Stage 4 Update — Role & Hak Akses + Approval Pengeluaran

## Ringkasan
Update ini melanjutkan Stage 2 dengan dua fitur besar:

1. **Stage 3: Role dan hak akses**
   - Menu sidebar otomatis difilter berdasarkan role login.
   - Tombol aksi penting disembunyikan jika role tidak berhak.
   - Banner role aktif tampil di aplikasi.
   - Role diambil dari tabel Supabase `users` + `roles` + `rts`.

2. **Stage 4: Approval pengeluaran lengkap**
   - Status pengeluaran mengikuti alur: `menunggu` → `disetujui` / `ditolak` → `lunas`.
   - Ketua RW / Super Admin dapat menyetujui atau menolak pengeluaran.
   - Catatan approval/penolakan disimpan ke `catatan_approval`.
   - `approved_by` dan `approved_at` diisi otomatis saat approve/reject.
   - Bendahara / Super Admin dapat menandai pengeluaran yang sudah disetujui menjadi `lunas`.

## Hak akses per role

| Role | Akses utama |
|---|---|
| Super Admin | Semua menu dan semua aksi. |
| Ketua RW | Monitoring, laporan, audit, approval/tolak pengeluaran. |
| Bendahara | Input/edit transaksi, pembayaran/lunas pengeluaran, kas bank, iuran, aset, laporan. |
| Sekretaris | Data warga, aset, laporan. |
| Pengurus RT | Input penerimaan/pengeluaran usulan, warga/iuran RT. |
| Auditor | Lihat data, laporan, audit tanpa input/edit/hapus. |
| Warga | Akses dashboard/laporan terbatas di mode aplikasi. |
| Tanpa Role | Hanya dashboard terbatas. |

> Catatan: pembatasan role saat ini diterapkan di sisi aplikasi/web UI. RLS Supabase pada file reset masih memberi akses luas ke user authenticated untuk memudahkan MVP/deploy awal. Untuk produksi final, disarankan Stage berikutnya menambahkan RLS per role di database.

## Cara mengatur role user
Setelah user register/login pertama kali, profil user dibuat otomatis di tabel `users`. File contoh SQL juga tersedia di `supabase/STAGE3_SET_USER_ROLES_EXAMPLE.sql`. Untuk mengubah role, buka Supabase SQL Editor dan jalankan contoh berikut:

```sql
-- Jadikan email tertentu sebagai Super Admin
UPDATE users
SET role_id = (SELECT id FROM roles WHERE nama_role = 'Super Admin')
WHERE email = 'email-admin@example.com';

-- Jadikan email tertentu sebagai Ketua RW
UPDATE users
SET role_id = (SELECT id FROM roles WHERE nama_role = 'Ketua RW')
WHERE email = 'ketua@example.com';

-- Set RT untuk Pengurus RT / user tertentu
UPDATE users
SET rt_id = (SELECT id FROM rts WHERE nomor_rt = 'RT 01')
WHERE email = 'pengurus-rt01@example.com';
```

Role tersedia: `Super Admin`, `Ketua RW`, `Bendahara`, `Sekretaris`, `Pengurus RT`, `Auditor`, `Warga`.

## Alur approval pengeluaran

1. Bendahara/Pengurus RT/Super Admin membuat pengeluaran baru dengan status `menunggu`.
2. Ketua RW/Super Admin melihat item pada Dashboard atau menu Pengeluaran.
3. Ketua RW/Super Admin klik **Setujui** atau **Tolak** dan dapat menulis catatan.
4. Jika disetujui, status menjadi `disetujui`.
5. Bendahara/Super Admin klik **Lunas** untuk menandai pembayaran selesai.
6. Pengeluaran yang sudah `lunas` masuk perhitungan realisasi dan KPI pengeluaran.

## File penting yang berubah

- `src/lib/permissions.ts` — definisi role, menu, dan hak aksi.
- `src/App.tsx` — login session, profile role, proteksi menu, dan passing permissions.
- `src/components/Sidebar.tsx` — filter menu berdasarkan role.
- `src/components/Dashboard.tsx` — quick action sesuai role dan approval dashboard.
- `src/components/Transactions.tsx` — approve, reject, lunas, dan tombol aksi sesuai role.
- `src/components/Anggaran.tsx`, `KasBank.tsx`, `Warga.tsx`, `Iuran.tsx`, `Aset.tsx`, `Pengguna.tsx` — gating tombol berdasarkan role.
- `src/hooks/useSupabaseData.ts` — field approval dan action `approve`, `reject`, `markPaid` pada pengeluaran.

## Validasi lokal
Sudah dijalankan:

```bash
npm ci && npm run typecheck && npm run build
```

Hasil:
- TypeScript OK.
- Build Vite OK.
- Warning saja: Node lokal v20 sedangkan package minta Node >=22, dan chunk Vite besar. Vercel sebaiknya tetap menggunakan Node 22.

## Rekomendasi tahap berikutnya

1. **Stage 5 — Laporan PDF/Excel siap cetak**: laporan kas bulanan, buku kas umum, rekap iuran, realisasi anggaran.
2. **Stage 6 — Audit trail otomatis**: catat semua create/update/delete/approve/reject/pay ke `audit_logs`.
3. **Stage 7 — RLS produksi per role**: enforce akses langsung di Supabase, bukan hanya UI.
4. **Stage 8 — Bukti lampiran**: upload bukti transaksi/pengeluaran ke Supabase Storage.
