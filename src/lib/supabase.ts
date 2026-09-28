import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aplsaypiqyrewwvwczsr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwbHNheXBpcXlyZXd3dndjenNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA1NzU3MDksImV4cCI6MjEwNjE1MTcwOX0.KNaeFRVUJNTW5ojIzrYrJWhBj0H-nNjLrkGUe8_4F5s';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper types
export interface Role {
  id: number;
  nama_role: string;
  deskripsi: string;
  permissions: Record<string, string | boolean>;
}

export interface RT {
  id: number;
  nomor_rt: string;
  ketua_rt: string;
  alamat: string;
  jumlah_warga: number;
}

export interface User {
  id: string;
  nama: string;
  email: string;
  role_id: number;
  rt_id: number | null;
  telepon: string;
  is_active: boolean;
  last_login: string;
  roles?: Role;
  rts?: RT;
}

export interface Warga {
  id: number;
  rt_id: number;
  nama: string;
  nik: string;
  alamat: string;
  no_hp: string;
  status: string;
  rts?: RT;
}

export interface Rekening {
  id: number;
  nama_rekening: string;
  jenis: 'kas' | 'bank';
  nomor: string | null;
  bank: string | null;
  saldo_awal: number;
  saldo_saat_ini: number;
}

export interface KategoriTransaksi {
  id: number;
  kode: string;
  nama_kategori: string;
  tipe: 'penerimaan' | 'pengeluaran' | 'semua';
  anggaran_tahunan: number;
}

export interface Penerimaan {
  id: number;
  nomor: string;
  tanggal: string;
  sumber: string;
  kategori_id: number;
  rekening_id: number;
  nominal: number;
  metode_bayar: string;
  keterangan: string;
  status: string;
  kategori_transaksi?: KategoriTransaksi;
  rekening?: Rekening;
}

export interface Pengeluaran {
  id: number;
  nomor: string;
  tanggal_pengajuan: string;
  tanggal_pembayaran: string | null;
  kategori_id: number;
  rekening_id: number;
  nominal: number;
  deskripsi: string;
  status: 'menunggu' | 'disetujui' | 'ditolak' | 'lunas';
  approved_by: string | null;
  approved_at: string | null;
  kategori_transaksi?: KategoriTransaksi;
  rekening?: Rekening;
}

export interface Anggaran {
  id: number;
  tahun: number;
  kategori_id: number;
  jumlah_anggaran: number;
  realisasi: number;
  kategori_transaksi?: KategoriTransaksi;
}

export interface Iuran {
  id: number;
  warga_id: number;
  periode: string;
  jumlah_tagihan: number;
  jumlah_bayar: number;
  status: 'belum' | 'lunas' | 'terlambat';
  tanggal_jatuh_tempo: string;
  tanggal_bayar: string | null;
  warga?: Warga;
}

export interface Aset {
  id: number;
  kode_aset: string;
  nama: string;
  kategori: string;
  nilai_perolehan: number;
  tanggal_perolehan: string;
  lokasi: string;
  kondisi: string;
}

export interface AuditLog {
  id: number;
  user_id: string | null;
  user_name: string;
  action: string;
  table_name: string;
  record_id: string;
  old_data: Record<string, any>;
  new_data: Record<string, any>;
  created_at: string;
}
