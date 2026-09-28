# Koneksi Supabase - Sistem Kas RW 07

Aplikasi membaca konfigurasi Supabase dari environment variable Vite:

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

Untuk kemudahan transisi, kode masih memiliki fallback ke project Supabase lama. Namun untuk deploy produksi, tetap isi environment variable di Vercel.

## Modul yang sudah memakai Supabase

| Modul | Status |
|---|---|
| Dashboard | Data real dari rekening, penerimaan, pengeluaran, anggaran, iuran |
| Penerimaan | CRUD Supabase |
| Pengeluaran | CRUD Supabase |
| Anggaran | Baca Supabase + realisasi dari pengeluaran lunas |
| Kas & Bank | Baca Supabase, saldo dihitung otomatis oleh trigger database |
| Iuran Warga | Baca/tandai lunas/generate tagihan Supabase |
| Inventaris & Aset | Tambah/hapus Supabase |
| Laporan | Baca view Supabase + ekspor CSV |
| Pengguna | Baca users/roles/rts Supabase |
| Audit Trail | Baca audit_logs Supabase |

## File penting

- `src/lib/supabase.ts`
- `src/hooks/useSupabaseData.ts`
- `supabase/RESET_DATABASE_RW07.sql`
- `README_DEPLOY_RW07.md`
