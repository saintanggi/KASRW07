# Stage 5 Update — Laporan PDF/Excel Siap Cetak

## Ringkasan
Tahap 5 menambahkan modul laporan yang bisa diekspor dan dicetak langsung dari aplikasi.

Fitur utama:

- Export **PDF** langsung dari browser.
- Export **Excel .xlsx** langsung dari browser.
- Export **CSV** tetap tersedia.
- Tombol **Cetak / Save as PDF** dengan layout print-friendly.
- Preview tabel laporan di aplikasi.
- Filter cakupan laporan: bulanan, tahunan, semua periode.
- Filter RT untuk laporan yang memiliki data RT, terutama rekap iuran.
- Ringkasan KPI laporan berubah otomatis mengikuti jenis laporan dan filter.

## Jenis laporan yang tersedia

1. **Laporan Arus Kas**
   - Kas masuk/keluar per periode.
   - Kolom: tanggal, tipe, referensi, kategori, rekening, uraian, masuk, keluar, status.

2. **Buku Kas Umum**
   - Debit/kredit dengan saldo berjalan.
   - Cocok untuk cetak buku kas RW.

3. **Realisasi Anggaran**
   - Perbandingan anggaran, realisasi, sisa, dan persentase realisasi.

4. **Laporan Penerimaan**
   - Daftar penerimaan lengkap dengan sumber, rekening, nominal, metode, dan status.

5. **Laporan Pengeluaran**
   - Daftar pengeluaran dengan tanggal pengajuan, tanggal pembayaran, approval, status, dan catatan.

6. **Rekap Iuran Warga**
   - Tagihan, pembayaran, sisa, status, tanggal bayar, dan RT.

7. **Saldo Kas & Bank**
   - Posisi saldo kas dan rekening bank saat ini.

8. **Audit Trail**
   - Log aktivitas sistem, jika data audit sudah tersedia di tabel `audit_logs`.

## File yang berubah

- `src/components/Laporan.tsx`
  - Rebuilt menjadi modul laporan siap PDF/Excel/CSV/Print.

- `src/hooks/useSupabaseData.ts`
  - `useLaporanData()` kini mengambil dataset detail untuk:
    - arus kas,
    - penerimaan,
    - pengeluaran,
    - anggaran,
    - iuran,
    - saldo kas/bank,
    - audit trail.

- `package.json` / `package-lock.json`
  - Dependency baru:
    - `jspdf`
    - `jspdf-autotable`
    - `write-excel-file`

## Database
Tidak perlu SQL baru untuk Stage 5 jika schema yang sudah ada dipakai.

Laporan memakai tabel/view yang sudah tersedia:

- `v_laporan_arus_kas`
- `penerimaan`
- `pengeluaran`
- `anggaran`
- `iuran`
- `warga`
- `rts`
- `rekening`
- `kategori_transaksi`
- `users`
- `audit_logs`

Jika audit trail belum berisi data, laporan Audit Trail akan tampil kosong sampai Stage audit otomatis diterapkan.

## Validasi lokal
Sudah dijalankan:

```bash
npm run typecheck
npm run build
npm audit --omit=dev
```

Hasil:

- TypeScript OK.
- Build Vite OK.
- `npm audit --omit=dev`: 0 vulnerabilities.
- Warning build: chunk Vite besar karena library PDF/Excel ikut masuk bundle. Tidak menghalangi deploy.

## Catatan deploy

1. Upload isi ZIP ke GitHub.
2. Pastikan Vercel menjalankan Node 22 sesuai `package.json`.
3. Redeploy Vercel.
4. Login ke aplikasi, buka menu **Laporan**, pilih jenis laporan, lalu gunakan tombol PDF/Excel/Cetak.

## Rekomendasi tahap berikutnya

1. **Stage 6 — Audit trail otomatis**
   - Catat semua aksi penting: create, update, delete, approve, reject, mark paid.
   - Supaya laporan Audit Trail benar-benar berisi riwayat aktivitas.

2. **Stage 7 — RLS produksi per role**
   - Mengunci hak akses sampai level Supabase, bukan hanya UI.

3. **Stage 8 — Upload bukti/lampiran transaksi**
   - Bukti penerimaan/pengeluaran/iuran via Supabase Storage.

4. **Stage 9 — Nomor dokumen dan tanda tangan laporan**
   - Header resmi, kolom Ketua RW/Bendahara, dan penomoran otomatis untuk laporan cetak.
