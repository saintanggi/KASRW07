# 🚀 PANDUAN LENGKAP: Setup Database Supabase

## ✅ LANGKAH 1: Jalankan SQL di Supabase

### Cara 1: Via Supabase Dashboard (RECOMMENDED)

1. **Buka Supabase Dashboard**
   - Login ke: https://supabase.com
   - Pilih project: `sistem-keuangan-rw`

2. **Buka SQL Editor**
   - Klik menu **"SQL Editor"** di sidebar kiri (ikon terminal)
   - Klik tombol **"New query"**

3. **Copy-Paste Script SQL**
   - Buka file: `supabase/schema.sql`
   - **Copy SEMUA isi file** (Ctrl+A, Ctrl+C)
   - **Paste** ke SQL Editor di Supabase
   - Klik tombol **"Run"** (atau Ctrl+Enter)

4. **Tunggu Proses**
   - Tunggu 5-10 detik sampai semua tabel terbuat
   - Jika sukses, akan muncul hasil query terakhir:
     ```
     status: "Database berhasil dibuat! 🎉"
     roles: 7
     rts: 5
     warga: 15
     ...
     ```

### Cara 2: Via Supabase CLI (Untuk Developer)

```bash
# Install Supabase CLI
npm install -g supabase

# Login ke Supabase
supabase login

# Link ke project
supabase link --project-ref aplsaypiqyrewwvwczsr

# Jalankan migration
supabase db push
```

---

## ✅ LANGKAH 2: Verifikasi Database

### Cek Tabel di Table Editor

1. Klik menu **"Table Editor"** di sidebar
2. Anda akan melihat 15 tabel:
   - ✅ roles
   - ✅ rts
   - ✅ users
   - ✅ warga
   - ✅ rekening
   - ✅ kategori_transaksi
   - ✅ penerimaan
   - ✅ pengeluaran
   - ✅ jurnal
   - ✅ anggaran
   - ✅ mutasi_rekening
   - ✅ iuran
   - ✅ aset
   - ✅ audit_logs
   - ✅ pengaturan

3. Klik salah satu tabel untuk melihat data sample

### Test Query di SQL Editor

```sql
-- Test 1: Lihat semua roles
SELECT * FROM roles;

-- Test 2: Lihat data warga
SELECT * FROM warga LIMIT 10;

-- Test 3: Lihat penerimaan
SELECT * FROM penerimaan ORDER BY tanggal DESC;

-- Test 4: Lihat ringkasan per RT
SELECT * FROM v_ringkasan_rt;
```

---

## ✅ LANGKAH 3: Setup Environment Variables

File `.env` sudah dibuat dengan credentials Anda:

```env
VITE_SUPABASE_URL=https://aplsaypiqyrewwvwczsr.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**PENTING**: Jangan commit file `.env` ke GitHub!

---

## ✅ LANGKAH 4: Install Dependencies

```bash
# Install package Supabase (sudah dilakukan)
npm install @supabase/supabase-js

# Jalankan aplikasi
npm run dev
```

---

## ✅ LANGKAH 5: Test Koneksi dari React

Buat file test di `src/test-supabase.ts`:

```typescript
import { supabase } from './lib/supabase';

export async function testConnection() {
  console.log('Testing Supabase connection...');
  
  // Test 1: Fetch roles
  const { data: roles, error: error1 } = await supabase
    .from('roles')
    .select('*');
  
  if (error1) {
    console.error('Error fetching roles:', error1);
    return false;
  }
  console.log('✅ Roles loaded:', roles);

  // Test 2: Fetch warga
  const { data: warga, error: error2 } = await supabase
    .from('warga')
    .select('*')
    .limit(5);
  
  if (error2) {
    console.error('Error fetching warga:', error2);
    return false;
  }
  console.log('✅ Warga loaded:', warga);

  // Test 3: Fetch penerimaan
  const { data: penerimaan, error: error3 } = await supabase
    .from('penerimaan')
    .select(`
      *,
      kategori:kategori_transaksi(nama_kategori),
      rekening:rekening(nama_rekening)
    `)
    .order('tanggal', { ascending: false })
    .limit(5);
  
  if (error3) {
    console.error('Error fetching penerimaan:', error3);
    return false;
  }
  console.log('✅ Penerimaan loaded:', penerimaan);

  console.log('🎉 All tests passed! Database is ready.');
  return true;
}
```

Panggil di `App.tsx`:

```typescript
import { useEffect } from 'react';
import { testConnection } from './test-supabase';

function App() {
  useEffect(() => {
    testConnection();
  }, []);

  return (
    // ... your app
  );
}
```

---

## 📊 Struktur Database yang Sudah Dibuat

```
┌─────────────────────────────────────────────┐
│  DATABASE: sistem-keuangan-rw               │
├─────────────────────────────────────────────┤
│                                             │
│  TABEL MASTER:                              │
│  ├── roles (7 roles)                        │
│  ├── rts (5 RT)                             │
│  ├── users (kosong, siap diisi)             │
│  ├── warga (15 warga sample)                │
│  ├── rekening (3 rekening)                  │
│  └── kategori_transaksi (9 kategori)        │
│                                             │
│  TABEL TRANSAKSI:                           │
│  ├── penerimaan (8 transaksi sample)        │
│  ├── pengeluaran (6 transaksi sample)       │
│  ├── jurnal (kosong, auto-generate)         │
│  ├── anggaran (6 pos anggaran 2024)         │
│  ├── mutasi_rekening (kosong)               │
│  └── iuran (15 iuran sample)                │
│                                             │
│  TABEL LAIN:                                │
│  ├── aset (7 aset sample)                   │
│  ├── audit_logs (kosong, auto-log)          │
│  └── pengaturan (9 konfigurasi)             │
│                                             │
│  VIEWS:                                     │
│  ├── v_laporan_arus_kas                     │
│  ├── v_iuran_warga                          │
│  └── v_ringkasan_rt                         │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 🔧 Troubleshooting

### Error: "relation already exists"
**Solusi**: Script sudah handle ini dengan `DROP TABLE IF EXISTS`. Jika masih error, hapus manual di Table Editor.

### Error: "permission denied"
**Solusi**: Pastikan Anda login sebagai owner project di Supabase.

### Error: "foreign key constraint"
**Solusi**: Urutan CREATE TABLE sudah benar. Jika error, jalankan ulang script dari awal.

### Data tidak muncul di React
**Solusi**: 
1. Cek console browser untuk error
2. Pastikan `.env` sudah diisi dengan benar
3. Restart development server: `npm run dev`

---

## 🎯 Next Steps

Setelah database siap, Anda bisa:

1. **Update komponen React** untuk fetch data dari Supabase
2. **Implementasi CRUD operations** untuk setiap modul
3. **Setup authentication** dengan Supabase Auth
4. **Enable Row Level Security (RLS)** untuk keamanan data
5. **Deploy ke production** dengan environment variables yang benar

---

## 📞 Bantuan Lebih Lanjut

- **Supabase Docs**: https://supabase.com/docs
- **JavaScript Client**: https://supabase.com/docs/reference/javascript
- **Discord Community**: https://discord.supabase.com

---

## ✅ Checklist Setup

- [ ] Login ke Supabase Dashboard
- [ ] Buka SQL Editor
- [ ] Copy-paste script dari `supabase/schema.sql`
- [ ] Klik "Run" dan tunggu selesai
- [ ] Verifikasi 15 tabel terbuat di Table Editor
- [ ] Cek data sample di beberapa tabel
- [ ] File `.env` sudah ada dengan credentials
- [ ] Install `@supabase/supabase-js`
- [ ] Jalankan `npm run dev`
- [ ] Test koneksi dari React (lihat console)

**Selamat! Database Anda siap digunakan! 🎉**
