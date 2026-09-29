export type HeaderNotification = {
  id: number;
  type: 'warning' | 'info' | 'success' | 'error';
  message: string;
  time: string;
};

// Notifikasi header dibuat kosong supaya sistem baru tidak menampilkan badge palsu.
// Notifikasi real dashboard dihitung dari data Supabase di useDashboardData().
export const notifications: HeaderNotification[] = [];
