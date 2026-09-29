# Panduan Deploy Sistem Kas RW 07 - Login + Mode Warga

## Update terbaru

Versi ini menambahkan:

- Sistem login pengurus memakai **Supabase Auth**.
- **Mode Warga tanpa login** untuk melihat ringkasan publik.
- Script untuk mengosongkan semua data operasional/dummy.
- Dashboard/menu utama diperbaiki agar tombol navigasi bisa diklik.
- Input awal dari nol: tambah rekening, tambah warga, generate iuran, tambah transaksi, tambah aset.

---

## 1. Upload kode ke GitHub

Upload semua isi folder ke repository GitHub Anda, kecuali:

- `node_modules/`
- `dist/`
- `.env`

Jika memakai terminal:

```bash
git add .
git commit -m "feat: login mode warga dan reset data kosong rw07"
git push origin main
```

---

## 2. Jalankan SQL schema jika database belum pernah dibuat

Jika database Supabase Anda belum punya tabel, jalankan dulu:

```text
supabase/RESET_DATABASE_RW07.sql
```

Cara menjalankan: buka file, copy semua isi SQL, paste ke Supabase SQL Editor, lalu klik Run.

---

## 3. Kosongkan data dummy dan aktifkan login/RLS

Setelah schema ada, jalankan file:

```text
supabase/RESET_EMPTY_LOGIN_RW07.sql
```

File ini akan:

- Menghapus data dummy/transaksi/warga/iuran/aset/rekening/user profil.
- Menyisakan master data roles, RT, kategori, dan pengaturan.
- Mengaktifkan RLS.
- Membuat anon hanya bisa melihat view publik.
- Membuat user login bisa input/edit data.

Output sukses:

```text
Data operasional dikosongkan, login/RLS aktif, mode warga siap ✅
```

---

## 4. Buat akun login pengurus

Aplikasi memakai Supabase Auth.

Cara paling mudah:

1. Buka Supabase Dashboard.
2. Masuk ke **Authentication > Users**.
3. Klik **Add user**.
4. Buat email dan password pengurus.
5. Gunakan email/password itu untuk login di aplikasi.

Alternatif: gunakan tombol daftar di halaman login jika signup Supabase Anda aktif.

---

## 5. Set environment variables di Vercel

Di Vercel:

```text
Project > Settings > Environment Variables
```

Tambahkan:

```env
VITE_SUPABASE_URL=https://PROJECT-REF.supabase.co
VITE_SUPABASE_ANON_KEY=ANON_KEY_SUPABASE_ANDA
```

Pastikan URL **tidak** memakai `/rest/v1`.

Benar:

```env
https://aplsaypiqyrewwvwczsr.supabase.co
```

Salah:

```env
https://aplsaypiqyrewwvwczsr.supabase.co/rest/v1
```

Setelah env diganti, lakukan **Redeploy**.

---

## 6. Alur input dari awal

Setelah login pengurus:

1. Menu **Kas & Bank** > Tambah Rekening.
2. Menu **Iuran Warga** > Tambah Warga.
3. Menu **Iuran Warga** > Generate Iuran periode berjalan.
4. Menu **Penerimaan** > Tambah penerimaan.
5. Menu **Pengeluaran** > Tambah pengeluaran.
6. Menu **Aset** > Tambah aset.
7. Menu **Laporan** > cek arus kas.
8. Menu **Audit Trail** > cek log perubahan.

Mode warga tanpa login hanya melihat informasi publik:

- Ringkasan saldo/penerimaan/pengeluaran.
- Ringkasan iuran per RT.
- Arus kas terbaru yang sudah valid.

---

## 7. Jika muncul error permission

Jalankan:

```text
supabase/RESET_EMPTY_LOGIN_RW07.sql
```

Atau minimal:

```sql
NOTIFY pgrst, 'reload schema';
```

Tunggu 1-2 menit, lalu refresh aplikasi.
