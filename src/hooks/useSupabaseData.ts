import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import * as mockData from '../data/mockData';

// Hook untuk Dashboard
export function useDashboardData() {
  const [data, setData] = useState({
    kpi: mockData.kpiData as any,
    monthlyData: mockData.monthlyData as any[],
    anggaranData: mockData.anggaranData as any[],
    recentTransactions: mockData.recentTransactions as any[],
    pendingApprovals: mockData.pendingApprovals as any[],
    notifications: mockData.notifications as any[],
    loading: true,
    error: null as string | null,
  });

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        // Fetch KPI data
        const [
          { data: kasData },
          { data: bankData },
          { data: penerimaanBulanIni },
          { data: pengeluaranBulanIni },
        ] = await Promise.all([
          supabase.from('rekening').select('saldo_saat_ini').eq('jenis', 'kas').single(),
          supabase.from('rekening').select('saldo_saat_ini').eq('jenis', 'bank'),
          supabase.from('penerimaan').select('nominal').gte('tanggal', '2024-12-01').lte('tanggal', '2024-12-31'),
          supabase.from('pengeluaran').select('nominal').gte('tanggal_pengajuan', '2024-12-01').lte('tanggal_pengajuan', '2024-12-31').eq('status', 'lunas'),
        ]);

        const saldoKas = kasData?.saldo_saat_ini || mockData.kpiData.saldoKasTunai;
        const saldoBank = bankData?.reduce((sum, r) => sum + r.saldo_saat_ini, 0) || mockData.kpiData.saldoRekeningBank;
        const totalPenerimaan = penerimaanBulanIni?.reduce((sum, p) => sum + p.nominal, 0) || mockData.kpiData.totalPenerimaanBulanIni;
        const totalPengeluaran = pengeluaranBulanIni?.reduce((sum, p) => sum + p.nominal, 0) || mockData.kpiData.totalPengeluaranBulanIni;

        // Fetch anggaran
        const { data: anggaranDB } = await supabase
          .from('anggaran')
          .select('*, kategori:kategori_transaksi(nama_kategori)')
          .eq('tahun', 2024);

        const anggaranFormatted = anggaranDB?.map(a => ({
          pos: a.kategori?.nama_kategori || 'Unknown',
          anggaran: a.jumlah_anggaran,
          realisasi: a.realisasi,
        })) || mockData.anggaranData;

        // Fetch transaksi terbaru
        const { data: penerimaanDB } = await supabase
          .from('penerimaan')
          .select('*, kategori:kategori_transaksi(nama_kategori)')
          .order('tanggal', { ascending: false })
          .limit(10);

        const { data: pengeluaranDB } = await supabase
          .from('pengeluaran')
          .select('*, kategori:kategori_transaksi(nama_kategori)')
          .order('tanggal_pengajuan', { ascending: false })
          .limit(10);

        const transactions = [
          ...(penerimaanDB?.map(p => ({
            id: p.id,
            nomor: p.nomor,
            tanggal: p.tanggal,
            tipe: 'penerimaan',
            kategori: p.kategori?.nama_kategori || 'Unknown',
            nominal: p.nominal,
            sumber: p.sumber,
            status: p.status,
          })) || []),
          ...(pengeluaranDB?.map(p => ({
            id: p.id,
            nomor: p.nomor,
            tanggal: p.tanggal_pengajuan,
            tipe: 'pengeluaran',
            kategori: p.kategori?.nama_kategori || 'Unknown',
            nominal: p.nominal,
            sumber: p.deskripsi,
            status: p.status,
          })) || []),
        ].sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()).slice(0, 10);

        // Fetch pending approvals
        const { data: pendingDB } = await supabase
          .from('pengeluaran')
          .select('*')
          .eq('status', 'menunggu')
          .order('tanggal_pengajuan', { ascending: false })
          .limit(3);

        const pendingApprovals = pendingDB?.map(p => ({
          id: p.id,
          nomor: p.nomor,
          pengaju: 'User',
          nominal: p.nominal,
          kategori: 'Kategori',
          tanggal: p.tanggal_pengajuan,
          deskripsi: p.deskripsi,
        })) || mockData.pendingApprovals;

        setData({
          kpi: {
            saldoKasTunai: saldoKas,
            saldoRekeningBank: saldoBank,
            totalPenerimaanBulanIni: totalPenerimaan,
            totalPengeluaranBulanIni: totalPengeluaran,
          },
          monthlyData: mockData.monthlyData as any[], // Tetap pakai mock untuk grafik 12 bulan
          anggaranData: anggaranFormatted,
          recentTransactions: transactions.length > 0 ? transactions : mockData.recentTransactions as any[],
          pendingApprovals: pendingApprovals,
          notifications: mockData.notifications as any[],
          loading: false,
          error: null,
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setData(prev => ({
          ...prev,
          loading: false,
          error: 'Gagal memuat data dari database',
        }));
      }
    }

    fetchDashboardData();
  }, []);

  return data;
}

// Hook untuk Penerimaan
export function usePenerimaan() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const { data: penerimaanDB, error } = await supabase
        .from('penerimaan')
        .select('*, kategori:kategori_transaksi(nama_kategori), rekening:rekening(nama_rekening)')
        .order('tanggal', { ascending: false });

      if (error) {
        console.error('Error fetching penerimaan:', error);
        setData(mockData.recentTransactions.filter((t: any) => t.tipe === 'penerimaan'));
      } else if (penerimaanDB && penerimaanDB.length > 0) {
        setData(penerimaanDB.map(p => ({
          id: p.id,
          nomor: p.nomor,
          tanggal: p.tanggal,
          tipe: 'penerimaan',
          kategori: p.kategori?.nama_kategori || 'Unknown',
          nominal: p.nominal,
          sumber: p.sumber,
          status: p.status,
        })));
      } else {
        setData(mockData.recentTransactions.filter((t: any) => t.tipe === 'penerimaan'));
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
      const { data: pengeluaranDB, error } = await supabase
        .from('pengeluaran')
        .select('*, kategori:kategori_transaksi(nama_kategori), rekening:rekening(nama_rekening)')
        .order('tanggal_pengajuan', { ascending: false });

      if (error) {
        console.error('Error fetching pengeluaran:', error);
        setData(mockData.recentTransactions.filter((t: any) => t.tipe === 'pengeluaran'));
      } else if (pengeluaranDB && pengeluaranDB.length > 0) {
        setData(pengeluaranDB.map(p => ({
          id: p.id,
          nomor: p.nomor,
          tanggal: p.tanggal_pengajuan,
          tipe: 'pengeluaran',
          kategori: p.kategori?.nama_kategori || 'Unknown',
          nominal: p.nominal,
          sumber: p.deskripsi,
          status: p.status,
        })));
      } else {
        setData(mockData.recentTransactions.filter((t: any) => t.tipe === 'pengeluaran'));
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
      const { data: anggaranDB, error } = await supabase
        .from('anggaran')
        .select('*, kategori:kategori_transaksi(nama_kategori)')
        .eq('tahun', 2024);

      if (error) {
        console.error('Error fetching anggaran:', error);
        setData(mockData.anggaranData);
      } else if (anggaranDB && anggaranDB.length > 0) {
        setData(anggaranDB.map(a => ({
          id: a.id,
          pos: a.kategori?.nama_kategori || 'Unknown',
          anggaran: a.jumlah_anggaran,
          realisasi: a.realisasi,
        })));
      } else {
        setData(mockData.anggaranData as any[]);
      }
      setLoading(false);
    }

    fetchData();
  }, []);

  return { data, loading };
}

// Hook untuk Kas & Bank
export function useRekening() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const { data: rekeningDB, error } = await supabase
        .from('rekening')
        .select('*')
        .order('id');

      if (error) {
        console.error('Error fetching rekening:', error);
        setData(mockData.rekeningData);
      } else if (rekeningDB && rekeningDB.length > 0) {
        setData(rekeningDB.map(r => ({
          id: r.id,
          nama: r.nama_rekening,
          jenis: r.jenis,
          nomor: r.nomor || '-',
          bank: r.bank || '-',
          saldo: r.saldo_saat_ini,
        })));
      } else {
        setData(mockData.rekeningData as any[]);
      }
      setLoading(false);
    }

    fetchData();
  }, []);

  return { data, loading };
}

// Hook untuk Iuran Warga
export function useIuran() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const { data: iuranDB, error } = await supabase
        .from('v_iuran_warga')
        .select('*')
        .order('nama_warga');

      if (error) {
        console.error('Error fetching iuran:', error);
        setData(mockData.wargaData);
      } else if (iuranDB && iuranDB.length > 0) {
        setData(iuranDB.map(i => ({
          id: i.id,
          nama: i.nama_warga,
          rt: i.nomor_rt,
          nik: i.nik,
          tagihan: i.jumlah_tagihan,
          status: i.status,
          periode: i.periode,
        })));
      } else {
        setData(mockData.wargaData as any[]);
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
      const { data: asetDB, error } = await supabase
        .from('aset')
        .select('*')
        .order('id');

      if (error) {
        console.error('Error fetching aset:', error);
        setData(mockData.asetData);
      } else if (asetDB && asetDB.length > 0) {
        setData(asetDB.map(a => ({
          id: a.id,
          kode: a.kode_aset,
          nama: a.nama,
          kategori: a.kategori,
          nilai: a.nilai_perolehan,
          lokasi: a.lokasi,
          kondisi: a.kondisi,
        })));
      } else {
        setData(mockData.asetData as any[]);
      }
      setLoading(false);
    }

    fetchData();
  }, []);

  return { data, loading };
}
