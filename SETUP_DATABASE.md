# Setup Database Supabase - Sistem Kas RW 07

Gunakan file utama berikut untuk reset database:

```text
supabase/RESET_DATABASE_RW07.sql
```

Langkah:

1. Buka Supabase Dashboard.
2. Pilih project Anda.
3. Masuk ke **SQL Editor**.
4. Buat query baru.
5. Copy seluruh isi `supabase/RESET_DATABASE_RW07.sql`.
6. Klik **Run**.
7. Pastikan output menampilkan: `Database RW 07 berhasil di-reset dan siap digunakan ✅`.

> Peringatan: script ini menghapus data lama. Cocok untuk sistem baru yang datanya masih dummy/acak.

Setelah database selesai, deploy kode dari repo dan set env Vercel:

```env
VITE_SUPABASE_URL=https://PROJECT-REF.supabase.co
VITE_SUPABASE_ANON_KEY=ANON_KEY_SUPABASE_ANDA
```

Detail lengkap ada di `README_DEPLOY_RW07.md`.
