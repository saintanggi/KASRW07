# Panduan Deploy Perbaikan Sistem Kas RW 07

Dokumen ini untuk menerapkan perbaikan kode + reset database Supabase.

## Yang sudah diperbaiki

- Semua label utama diganti ke **RW 07**.
- Database dibuat ulang dengan schema rapi dan seed awal RW 07.
- Duplikat iuran dicegah dengan `UNIQUE(warga_id, periode)`.
- Saldo rekening dihitung otomatis dari transaksi valid.
- Audit log otomatis untuk transaksi, iuran, aset, rekening, dan anggaran.
- Dashboard menghitung data dari Supabase, bukan mock data.
- Penerimaan dan pengeluaran bisa tambah/edit/hapus dari UI.
- Iuran bisa dibuat per periode dan dicatat lunas dari UI.
- Aset bisa ditambah dan dihapus dari UI.
- Laporan, pengguna, dan audit trail membaca Supabase.
- Dependency tidak terpakai dihapus dan `npm audit` sudah 0 vulnerability.

---

## 1. Backup dulu

Karena sistem masih baru dan data lama masih acak, script reset memang akan menghapus data lama. Tetapi tetap disarankan backup:

1. Supabase Dashboard
2. Project Anda
3. SQL Editor
4. Jalankan export/manual backup bila diperlukan

---

## 2. Reset database Supabase

Buka file:

```text
supabase/RESET_DATABASE_RW07.sql
```

atau:

```text
supabase/schema.sql
```

Lalu:

1. Login ke Supabase
2. Buka project database Anda
3. Buka **SQL Editor**
4. Klik **New Query**
5. Copy seluruh isi file `supabase/RESET_DATABASE_RW07.sql`
6. Klik **Run**

Jika sukses, hasil akhir akan menampilkan:

```text
Database RW 07 berhasil di-reset dan siap digunakan ✅
```

### Catatan penting

Script ini membuat ulang tabel:

- roles
- rts
- users
- warga
- rekening
- kategori_transaksi
- penerimaan
- pengeluaran
- jurnal
- anggaran
- mutasi_rekening
- iuran
- aset
- audit_logs
- pengaturan

Dan views:

- v_iuran_warga
- v_ringkasan_rt
- v_laporan_arus_kas
- v_dashboard_monthly
- v_dashboard_kpi

---

## 3. Set Environment Variables di Vercel

Di Vercel project:

1. Settings
2. Environment Variables
3. Tambahkan:

```env
VITE_SUPABASE_URL=https://PROJECT-REF.supabase.co
VITE_SUPABASE_ANON_KEY=ANON_KEY_SUPABASE_ANDA
```

Nilai bisa diambil dari:

```text
Supabase Dashboard > Project Settings > API
```

Kode masih punya fallback ke project lama agar tidak langsung blank, tetapi untuk produksi sebaiknya gunakan env Vercel.

---

## 4. Set Node.js Vercel

Package menggunakan Supabase JS versi baru yang meminta Node 22.

Di Vercel, pastikan Node menggunakan versi 22. File `package.json` sudah berisi:

```json
"engines": {
  "node": ">=22"
}
```

---

## 5. Deploy ke GitHub

Setelah file diperbarui di lokal:

```bash
git status
git add .
git commit -m "fix: rombak sistem kas rw07 dan reset supabase schema"
git push origin main
```

Jika branch utama Anda bukan `main`, pakai nama branch yang sesuai.

Vercel biasanya otomatis deploy setelah push ke GitHub.

---

## 6. Test setelah deploy

Cek halaman berikut:

- Dashboard: angka saldo, penerimaan, pengeluaran muncul
- Penerimaan: tambah transaksi baru
- Pengeluaran: tambah transaksi baru, status lunas harus ada tanggal pembayaran
- Kas & Bank: saldo berubah otomatis setelah transaksi valid
- Iuran: klik `Generate Iuran`, lalu `Catat Bayar`
- Aset: tambah aset dan hapus aset
- Laporan: unduh CSV arus kas
- Audit Trail: perubahan data tercatat otomatis

---

## 7. Data awal masih simulasi

Data yang dibuat script adalah data awal yang rapi, bukan data warga asli. Setelah deploy, ganti data berikut:

- Pengaturan RW: kelurahan, kecamatan, alamat, rekening
- Nama ketua RW, bendahara, sekretaris, ketua RT
- Data warga sebenarnya
- Nomor rekening bank
- Saldo awal rekening
- Anggaran tahunan
- Aset/inventaris asli

---

## 8. Catatan keamanan tahap berikutnya

Saat ini aplikasi dibuat agar mudah berjalan sebagai MVP/operator internal. Tahap berikutnya yang disarankan:

1. Tambah login Supabase Auth
2. Aktifkan RLS policy per role
3. Batasi akses NIK/no HP
4. Pisahkan role Bendahara, Ketua RW, RT, Auditor, Warga
5. Tambah backup database berkala

Jangan gunakan mode publik untuk data warga asli tanpa login dan RLS.
