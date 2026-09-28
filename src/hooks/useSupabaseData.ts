import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// Mock data sebagai fallback
const mockKpiData = {
  saldoKasTunai: 15750000,
  saldoRekeningBank: 48250000,
  totalPenerimaanBulanIni: 12500000,
  totalPengeluaranBulanIni: 8750000,
};

const mockMonthlyData = [
  { bulan: 'Jan', pemasukan: 12000000, pengeluaran: 9500000 },
  { bulan: 'Feb', pemasukan: 11000000, pengeluaran: 8000000 },
  { bulan: 'Mar', pemasukan: 13500000, pengeluaran: 10200000 },
  { bulan: 'Apr', pemasukan: 10500000, pengeluaran: 7800000 },
  { bulan: 'Mei', pemasukan: 14000000, pengeluaran: 11000000 },
  { bulan: 'Jun', pemasukan: 12500000, pengeluaran: 9000000 },
  { bulan: 'Jul', pemasukan: 15000000, pengeluaran: 12500000 },
  { bulan: 'Agu', pemasukan: 11500000, pengeluaran: 8500000 },
  { bulan: 'Sep', pemasukan: 13000000, pengeluaran: 9800000 },
  { bulan: 'Okt', pemasukan: 14500000, pengeluaran: 10500000 },
  { bulan: 'Nov', pemasukan: 12000000, pengeluaran: 8200000 },
  { bulan: 'Des', pemasukan: 12500000, pengeluaran: 8750000 },
];

const mockAnggaranData = [
  { pos: 'Kebersihan', anggaran: 24000000, realisasi: 18500000 },
  { pos: 'Keamanan', anggaran: 36000000, realisasi: 28000000 },
  { pos: 'Sosial', anggaran: 12000000, realisasi: 8500000 },
  { pos: 'Infrastruktur', anggaran: 48000000, realisasi: 32000000 },
  { pos: 'Operasional', anggaran: 18000000, realisasi: 14200000 },
  { pos: 'Kesehatan', anggaran: 6000000, realisasi: 3800000 },
];

const mockRecentTransactions = [
  { id: 1, nomor: 'TRX-2024-001', tanggal: '2024-12-01', tipe: 'penerimaan', kategori: 'Iuran Warga', nominal: 2500000, sumber: 'RT 01', status: 'terverifikasi' },
  { id: 2, nomor: 'TRX-2024-002', tanggal: '2024-12-01', tipe: 'pengeluaran', kategori: 'Kebersihan', nominal: 1500000, sumber: 'Gaji Petugas', status: 'terverifikasi' },
  { id: 3, nomor: 'TRX-2024-003', tanggal: '2024-12-02', tipe: 'penerimaan', kategori: 'Donasi', nominal: 5000000, sumber: 'Bpk. Ahmad', status: 'terverifikasi' },
  { id: 4, nomor: 'TRX-2024-004', tanggal: '2024-12-03', tipe: 'pengeluaran', kategori: 'Infrastruktur', nominal: 3500000, sumber: 'Perbaikan Jalan', status: 'menunggu' },
  { id: 5, nomor: 'TRX-2024-005', tanggal: '2024-12-03', tipe: 'penerimaan', kategori: 'Iuran Warga', nominal: 1800000, sumber: 'RT 02', status: 'terverifikasi' },
  { id: 6, nomor: 'TRX-2024-006', tanggal: '2024-12-04', tipe: 'pengeluaran', kategori: 'Keamanan', nominal: 2000000, sumber: 'Gaji Satpam', status: 'terverifikasi' },
  { id: 7, nomor: 'TRX-2024-007', tanggal: '2024-12-04', tipe: 'penerimaan', kategori: 'Iuran Warga', nominal: 3200000, sumber: 'RT 03', status: 'menunggu' },
];

const mockPendingApprovals = [
  { id: 1, nomor: 'TRX-2024-004', pengaju: 'Budi Santoso', nominal: 3500000, kategori: 'Infrastruktur', tanggal: '2024-12-03', deskripsi: 'Perbaikan jalan RT 02' },
  { id: 2, nomor: 'TRX-2024-007', pengaju: 'Siti Aminah', nominal: 3200000, kategori: 'Iuran Warga', tanggal: '2024-12-04', deskripsi: 'Iuran Desember RT 03' },
  { id: 3, nomor: 'TRX-2024-011', pengaju: 'Ahmad Fauzi', nominal: 5000000, kategori: 'Keamanan', tanggal: '2024-12-06', deskripsi: 'Pembelian CCTV' },
];

const mockNotifications = [
  { id: 1, type: 'warning', message: '3 pengajuan menunggu persetujuan', time: '5 menit lalu' },
  { id: 2, type: 'info', message: 'Iuran RT 02 bulan Desember telah diterima', time: '1 jam lalu' },
  { id: 3, type: 'success', message: 'Laporan bulanan November berhasil digenerate', time: '2 jam lalu' },
  { id: 4, type: 'error', message: 'Selisih kas kecil Rp 50.000', time: '3 jam lalu' },
];

// Hook untuk Dashboard
export function useDashboardData() {
  const [data, setData] = useState({
    kpi: mockKpiData,
    monthlyData: mockMonthlyData,
    anggaranData: mockAnggaranData,
    recentTransactions: mockRecentTransactions,
    pendingApprovals: mockPendingApprovals,
    notifications: mockNotifications,
    loading: true,
    error: null as string | null,
  });

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        // Fetch rekening
        const { data: rekeningData, error: rekeningError } = await supabase
          .from('rekening')
          .select('saldo_saat_ini, jenis');

        let saldoKas = mockKpiData.saldoKasTunai;
        let saldoBank = mockKpiData.saldoRekeningBank;

        if (!rekeningError && rekeningData && rekeningData.length > 0) {
          saldoKas = rekeningData.filter(r => r.jenis === 'kas').reduce((sum, r) => sum + r.saldo_saat_ini, 0);
          saldoBank = rekeningData.filter(r => r.jenis === 'bank').reduce((sum, r) => sum + r.saldo_saat_ini, 0);
        }

        // Fetch anggaran
        const { data: anggaranData, error: anggaranError } = await supabase
          .from('anggaran')
          .select('*, kategori_transaksi(nama_kategori)')
          .eq('tahun', 2024);

        let formattedAnggaran = mockAnggaranData;
        if (!anggaranError && anggaranData && anggaranData.length > 0) {
          formattedAnggaran = anggaranData.map(a => ({
            pos: a.kategori_transaksi?.nama_kategori || 'Unknown',
            anggaran: a.jumlah_anggaran,
            realisasi: a.realisasi,
          }));
        }

        // Fetch penerimaan
        const { data: penerimaanData } = await supabase
          .from('penerimaan')
          .select('*, kategori_transaksi(nama_kategori)')
          .order('tanggal', { ascending: false })
          .limit(10);

        // Fetch pengeluaran
        const { data: pengeluaranData } = await supabase
          .from('pengeluaran')
          .select('*, kategori_transaksi(nama_kategori)')
          .order('tanggal_pengajuan', { ascending: false })
          .limit(10);

        // Combine transactions
        let transactions = mockRecentTransactions;
        if ((penerimaanData && penerimaanData.length > 0) || (pengeluaranData && pengeluaranData.length > 0)) {
          transactions = [
            ...(penerimaanData?.map(p => ({
              id: p.id,
              nomor: p.nomor,
              tanggal: p.tanggal,
              tipe: 'penerimaan',
              kategori: p.kategori_transaksi?.nama_kategori || 'Unknown',
              nominal: p.nominal,
              sumber: p.sumber,
              status: p.status,
            })) || []),
            ...(pengeluaranData?.map(p => ({
              id: p.id,
              nomor: p.nomor,
              tanggal: p.tanggal_pengajuan,
              tipe: 'pengeluaran',
              kategori: p.kategori_transaksi?.nama_kategori || 'Unknown',
              nominal: p.nominal,
              sumber: p.deskripsi,
              status: p.status,
            })) || []),
          ].sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()).slice(0, 10);
        }

        // Fetch pending approvals
        const { data: pendingData } = await supabase
          .from('pengeluaran')
          .select('*')
          .eq('status', 'menunggu')
          .order('tanggal_pengajuan', { ascending: false })
          .limit(3);

        let pending = mockPendingApprovals;
        if (pendingData && pendingData.length > 0) {
          pending = pendingData.map(p => ({
            id: p.id,
            nomor: p.nomor,
            pengaju: 'User',
            nominal: p.nominal,
            kategori: 'Kategori',
            tanggal: p.tanggal_pengajuan,
            deskripsi: p.deskripsi,
          }));
        }

        setData({
          kpi: {
            saldoKasTunai: saldoKas,
            saldoRekeningBank: saldoBank,
            totalPenerimaanBulanIni: mockKpiData.totalPenerimaanBulanIni,
            totalPengeluaranBulanIni: mockKpiData.totalPengeluaranBulanIni,
          },
          monthlyData: mockMonthlyData,
          anggaranData: formattedAnggaran,
          recentTransactions: transactions,
          pendingApprovals: pending,
          notifications: mockNotifications,
          loading: false,
          error: null,
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setData(prev => ({ ...prev, loading: false, error: 'Gagal memuat data' }));
      }
    }

    fetchDashboardData();
  }, []);

  return data;
}

// Hook untuk Rekening
export function useRekening() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const { data: rekeningData, error } = await supabase
        .from('rekening')
        .select('*')
        .order('id');

      if (!error && rekeningData && rekeningData.length > 0) {
        setData(rekeningData.map(r => ({
          id: r.id,
          nama: r.nama_rekening,
          jenis: r.jenis,
          nomor: r.nomor || '-',
          bank: r.bank || '-',
          saldo: r.saldo_saat_ini,
        })));
      }
      setLoading(false);
    }

    fetchData();
  }, []);

  return { data, loading };
}

// Hook untuk Penerimaan
export function usePenerimaan() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const { data: penerimaanData, error } = await supabase
        .from('penerimaan')
        .select('*, kategori_transaksi(nama_kategori)')
        .order('tanggal', { ascending: false });

      if (!error && penerimaanData && penerimaanData.length > 0) {
        setData(penerimaanData.map(p => ({
          id: p.id,
          nomor: p.nomor,
          tanggal: p.tanggal,
          tipe: 'penerimaan',
          kategori: p.kategori_transaksi?.nama_kategori || 'Unknown',
          nominal: p.nominal,
          sumber: p.sumber,
          status: p.status,
        })));
      } else {
        setData(mockRecentTransactions.filter(t => t.tipe === 'penerimaan'));
      }
      setLoading(false);
    }

    fetchData();
  }, []);

  return { data, loading };
}

// Hook untuk Pengeluaran
export function usePengeluaran() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const { data: pengeluaranData, error } = await supabase
        .from('pengeluaran')
        .select('*, kategori_transaksi(nama_kategori)')
        .order('tanggal_pengajuan', { ascending: false });

      if (!error && pengeluaranData && pengeluaranData.length > 0) {
        setData(pengeluaranData.map(p => ({
          id: p.id,
          nomor: p.nomor,
          tanggal: p.tanggal_pengajuan,
          tipe: 'pengeluaran',
          kategori: p.kategori_transaksi?.nama_kategori || 'Unknown',
          nominal: p.nominal,
          sumber: p.deskripsi,
          status: p.status,
        })));
      } else {
        setData(mockRecentTransactions.filter(t => t.tipe === 'pengeluaran'));
      }
      setLoading(false);
    }

    fetchData();
  }, []);

  return { data, loading };
}

// Hook untuk Anggaran
export function useAnggaran() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const { data: anggaranData, error } = await supabase
        .from('anggaran')
        .select('*, kategori_transaksi(nama_kategori)')
        .eq('tahun', 2024);

      if (!error && anggaranData && anggaranData.length > 0) {
        setData(anggaranData.map(a => ({
          pos: a.kategori_transaksi?.nama_kategori || 'Unknown',
          anggaran: a.jumlah_anggaran,
          realisasi: a.realisasi,
        })));
      } else {
        setData(mockAnggaranData);
      }
      setLoading(false);
    }

    fetchData();
  }, []);

  return { data, loading };
}

// Hook untuk Iuran
export function useIuran() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const { data: iuranData, error } = await supabase
        .from('iuran')
        .select('*, warga(nama, nik, rts(nomor_rt))')
        .order('id');

      if (!error && iuranData && iuranData.length > 0) {
        setData(iuranData.map(i => ({
          id: i.id,
          nama: i.warga?.nama || 'Unknown',
          rt: i.warga?.rts?.nomor_rt || '-',
          nik: i.warga?.nik || '-',
          tagihan: i.jumlah_tagihan,
          status: i.status,
          periode: i.periode,
        })));
      }
      setLoading(false);
    }

    fetchData();
  }, []);

  return { data, loading };
}

// Hook untuk Aset
export function useAset() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const { data: asetData, error } = await supabase
        .from('aset')
        .select('*')
        .order('id');

      if (!error && asetData && asetData.length > 0) {
        setData(asetData.map(a => ({
          kode: a.kode_aset,
          nama: a.nama,
          kategori: a.kategori,
          nilai: a.nilai_perolehan,
          lokasi: a.lokasi,
          kondisi: a.kondisi,
        })));
      }
      setLoading(false);
    }

    fetchData();
  }, []);

  return { data, loading };
}
