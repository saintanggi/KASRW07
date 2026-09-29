# Stage 2 - Manajemen Warga Lengkap

Update ini menambahkan modul **Data Warga** khusus di sidebar.

## Fitur yang ditambahkan

- Menu baru: **Data Warga**.
- Tambah warga via modal form.
- Edit warga via modal form.
- Pindah RT dengan mengubah field RT pada form edit.
- Ubah status warga:
  - aktif
  - nonaktif
  - pindah
  - meninggal
- Hapus permanen warga jika benar-benar diperlukan.
- Filter:
  - pencarian nama/NIK/HP/email/alamat
  - RT
  - status
- Import CSV warga.
- Download template CSV.
- Export CSV data warga.
- Summary total warga, aktif, nonaktif, pindah.
- Empty state untuk sistem baru yang datanya kosong.

## Format CSV Import

Gunakan header berikut:

```csv
nama,rt,nik,alamat,no_hp,email,status
Contoh Warga,RT 01,317xxxxxxxxxxxxx,Alamat rumah,08123456789,warga@email.com,aktif
```

Kolom wajib:

- `nama`
- `rt` contoh: `RT 01`, `RT 02`, dst.

Kolom opsional:

- `nik`
- `alamat`
- `no_hp`
- `email`
- `status`

Status yang disarankan:

- `aktif`
- `nonaktif`
- `pindah`
- `meninggal`

## Deploy

1. Upload/push semua file ke GitHub.
2. Redeploy Vercel.
3. Tidak perlu menjalankan SQL baru jika tabel `warga` dan `rts` sudah ada.
4. Jika ingin mulai dari data kosong, jalankan:

```text
supabase/RESET_EMPTY_LOGIN_RW07.sql
```

## Rekomendasi setelah Stage 2

Lanjut ke Stage 3: **Role dan Hak Akses**.

Yang perlu dibuat:

- Role-based menu visibility.
- Bendahara bisa input transaksi dan iuran.
- Ketua RW bisa approve pengeluaran.
- Pengurus RT hanya mengelola warga/iuran RT sendiri.
- Auditor hanya baca laporan dan audit.
- Warga hanya lihat mode publik/pribadi.
- RLS Supabase lebih detail per role.
