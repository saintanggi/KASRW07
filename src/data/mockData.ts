// Data statis ringan hanya untuk notifikasi header.
// Data utama aplikasi sudah dibaca dari Supabase melalui hooks/useSupabaseData.ts.
export const notifications = [
  { id: 1, type: 'info', message: 'Sistem Kas RW 07 terhubung ke Supabase', time: 'real-time' },
  { id: 2, type: 'warning', message: 'Lengkapi data warga, rekening, dan pengaturan RW 07', time: 'setup awal' },
  { id: 3, type: 'success', message: 'Database baru sudah memakai struktur anti-duplikat iuran', time: 'v2.0' },
];
