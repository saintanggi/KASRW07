import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

export type TransactionType = 'penerimaan' | 'pengeluaran';

const MONTHS_ID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const MONTHS_ID_LONG = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

export function toNumber(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function currentYear(): number {
  return new Date().getFullYear();
}

export function currentPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function formatPeriodLabel(period: string): string {
  const [year, month] = period.split('-');
  const idx = Number(month) - 1;
  if (!year || idx < 0 || idx > 11) return period;
  return `${MONTHS_ID_LONG[idx]} ${year}`;
}

function monthStart(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
}

function nextMonthStart(date = new Date()): string {
  const next = new Date(date.getFullYear(), date.getMonth() + 1, 1);
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-01`;
}

function getYearFromDate(value?: string | null): number | null {
  if (!value) return null;
  const year = Number(value.slice(0, 4));
  return Number.isFinite(year) ? year : null;
}

function isDateInCurrentMonth(value?: string | null): boolean {
  if (!value) return false;
  return value >= monthStart() && value < nextMonthStart();
}

export function makeTransactionNumber(type: TransactionType): string {
  const prefix = type === 'penerimaan' ? 'IN' : 'OUT';
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const suffix = String(now.getTime()).slice(-6);
  return `${prefix}-${y}${m}${d}-${suffix}`;
}

function normalizeError(error: unknown): string {
  if (!error) return '';
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && 'message' in error) {
    return String((error as { message?: unknown }).message || 'Terjadi kesalahan');
  }
  return 'Terjadi kesalahan';
}

export function useDashboardData() {
  const [data, setData] = useState({
    kpi: {
      saldoKasTunai: 0,
      saldoRekeningBank: 0,
      totalPenerimaanBulanIni: 0,
      totalPengeluaranBulanIni: 0,
    },
    monthlyData: [] as any[],
    anggaranData: [] as any[],
    recentTransactions: [] as any[],
    pendingApprovals: [] as any[],
    notifications: [] as any[],
    periodeLabel: formatPeriodLabel(currentPeriod()),
    tahunAnggaran: currentYear(),
    loading: true,
    error: null as string | null,
  });

  const refresh = useCallback(async () => {
    setData((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const [rekeningRes, penerimaanRes, pengeluaranRes, anggaranRes, iuranRes, kategoriRes, monthlyViewRes] = await Promise.all([
        supabase.from('rekening').select('*').order('id'),
        supabase.from('penerimaan').select('*').order('tanggal', { ascending: false }),
        supabase.from('pengeluaran').select('*').order('tanggal_pengajuan', { ascending: false }),
        supabase.from('anggaran').select('*').order('tahun', { ascending: false }),
        supabase.from('iuran').select('id,status,periode'),
        supabase.from('kategori_transaksi').select('id,nama_kategori'),
        supabase.from('v_dashboard_monthly').select('*').order('periode'),
      ]);

      const rekeningRows = rekeningRes.data || [];
      const penerimaanRows = penerimaanRes.data || [];
      const pengeluaranRows = pengeluaranRes.data || [];
      const anggaranRowsAll = anggaranRes.data || [];
      const iuranRows = iuranRes.data || [];
      const kategoriMap = new Map((kategoriRes.data || []).map((row: any) => [Number(row.id), row.nama_kategori]));

      const saldoKas = rekeningRows
        .filter((row: any) => row.jenis === 'kas')
        .reduce((sum: number, row: any) => sum + toNumber(row.saldo_saat_ini), 0);
      const saldoBank = rekeningRows
        .filter((row: any) => row.jenis === 'bank')
        .reduce((sum: number, row: any) => sum + toNumber(row.saldo_saat_ini), 0);

      const totalPenerimaanBulanIni = penerimaanRows
        .filter((row: any) => row.status === 'terverifikasi' && isDateInCurrentMonth(row.tanggal))
        .reduce((sum: number, row: any) => sum + toNumber(row.nominal), 0);

      const totalPengeluaranBulanIni = pengeluaranRows
        .filter((row: any) => row.status === 'lunas' && isDateInCurrentMonth(row.tanggal_pembayaran || row.tanggal_pengajuan))
        .reduce((sum: number, row: any) => sum + toNumber(row.nominal), 0);

      let monthlyData: any[] = [];
      if (!monthlyViewRes.error && monthlyViewRes.data && monthlyViewRes.data.length > 0) {
        monthlyData = monthlyViewRes.data.map((row: any) => ({
          bulan: row.bulan || MONTHS_ID[Number(row.periode?.slice(5, 7)) - 1] || row.periode,
          periode: row.periode,
          pemasukan: toNumber(row.pemasukan),
          pengeluaran: toNumber(row.pengeluaran),
        }));
      } else {
        const now = new Date();
        const months = Array.from({ length: 12 }, (_, index) => {
          const d = new Date(now.getFullYear(), now.getMonth() - 11 + index, 1);
          const period = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          return { date: d, period };
        });
        monthlyData = months.map(({ date, period }) => ({
          bulan: MONTHS_ID[date.getMonth()],
          periode: period,
          pemasukan: penerimaanRows
            .filter((row: any) => row.status === 'terverifikasi' && String(row.tanggal || '').startsWith(period))
            .reduce((sum: number, row: any) => sum + toNumber(row.nominal), 0),
          pengeluaran: pengeluaranRows
            .filter((row: any) => row.status === 'lunas' && String(row.tanggal_pembayaran || row.tanggal_pengajuan || '').startsWith(period))
            .reduce((sum: number, row: any) => sum + toNumber(row.nominal), 0),
        }));
      }

      const availableYears = Array.from(new Set(anggaranRowsAll.map((row: any) => Number(row.tahun)).filter(Boolean))).sort((a, b) => b - a);
      const selectedYear = availableYears.includes(currentYear()) ? currentYear() : (availableYears[0] || currentYear());

      const realisasiByCategory = new Map<number, number>();
      pengeluaranRows
        .filter((row: any) => row.status === 'lunas' && getYearFromDate(row.tanggal_pembayaran || row.tanggal_pengajuan) === selectedYear)
        .forEach((row: any) => {
          const categoryId = Number(row.kategori_id || 0);
          realisasiByCategory.set(categoryId, (realisasiByCategory.get(categoryId) || 0) + toNumber(row.nominal));
        });

      const anggaranData = anggaranRowsAll
        .filter((row: any) => Number(row.tahun) === selectedYear)
        .map((row: any) => ({
          id: row.id,
          kategori_id: row.kategori_id,
          pos: kategoriMap.get(Number(row.kategori_id)) || 'Tanpa Kategori',
          anggaran: toNumber(row.jumlah_anggaran),
          realisasi: realisasiByCategory.get(Number(row.kategori_id)) ?? toNumber(row.realisasi),
        }));

      const recentTransactions = [
        ...penerimaanRows.map((row: any) => ({
          key: `p-${row.id}`,
          id: row.id,
          nomor: row.nomor,
          tanggal: row.tanggal,
          tipe: 'penerimaan',
          kategori: kategoriMap.get(Number(row.kategori_id)) || 'Tanpa Kategori',
          nominal: toNumber(row.nominal),
          sumber: row.sumber,
          status: row.status,
        })),
        ...pengeluaranRows.map((row: any) => ({
          key: `g-${row.id}`,
          id: row.id,
          nomor: row.nomor,
          tanggal: row.tanggal_pembayaran || row.tanggal_pengajuan,
          tipe: 'pengeluaran',
          kategori: kategoriMap.get(Number(row.kategori_id)) || 'Tanpa Kategori',
          nominal: toNumber(row.nominal),
          sumber: row.deskripsi,
          status: row.status,
        })),
      ]
        .sort((a: any, b: any) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime())
        .slice(0, 10);

      const pendingApprovals = pengeluaranRows
        .filter((row: any) => row.status === 'menunggu')
        .slice(0, 5)
        .map((row: any) => ({
          id: row.id,
          nomor: row.nomor,
          pengaju: 'Pengurus RW/RT',
          nominal: toNumber(row.nominal),
          kategori: kategoriMap.get(Number(row.kategori_id)) || 'Tanpa Kategori',
          tanggal: row.tanggal_pengajuan,
          deskripsi: row.deskripsi,
        }));

      const unpaidIuran = iuranRows.filter((row: any) => row.periode === currentPeriod() && row.status !== 'lunas').length;
      const notifications = [
        {
          id: 1,
          type: pendingApprovals.length > 0 ? 'warning' : 'success',
          message: `${pendingApprovals.length} pengajuan pengeluaran menunggu persetujuan`,
          time: 'real-time',
        },
        {
          id: 2,
          type: unpaidIuran > 0 ? 'info' : 'success',
          message: `${unpaidIuran} iuran periode ${formatPeriodLabel(currentPeriod())} belum lunas`,
          time: 'real-time',
        },
        {
          id: 3,
          type: 'success',
          message: 'Data dashboard diambil dari Supabase',
          time: 'baru saja',
        },
      ];

      setData({
        kpi: {
          saldoKasTunai: saldoKas,
          saldoRekeningBank: saldoBank,
          totalPenerimaanBulanIni,
          totalPengeluaranBulanIni,
        },
        monthlyData,
        anggaranData,
        recentTransactions,
        pendingApprovals,
        notifications,
        periodeLabel: formatPeriodLabel(currentPeriod()),
        tahunAnggaran: selectedYear,
        loading: false,
        error: [rekeningRes, penerimaanRes, pengeluaranRes, anggaranRes, iuranRes, kategoriRes].filter((res: any) => res.error).map((res: any) => res.error.message).join(' | ') || null,
      });
    } catch (error) {
      setData((prev) => ({ ...prev, loading: false, error: normalizeError(error) }));
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return useMemo(() => ({ ...data, refresh }), [data, refresh]);
}

export function useRekening() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data: rows, error: queryError } = await supabase
      .from('rekening')
      .select('*')
      .order('id');

    if (queryError) {
      setError(queryError.message);
      setData([]);
    } else {
      setError(null);
      setData((rows || []).map((row: any) => ({
        id: row.id,
        nama: row.nama_rekening,
        jenis: row.jenis,
        nomor: row.nomor || '-',
        bank: row.bank || '-',
        saldo: toNumber(row.saldo_saat_ini),
        saldo_awal: toNumber(row.saldo_awal),
        is_active: row.is_active,
      })));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, loading, error, refresh };
}

function useTransactionData(type: TransactionType) {
  const [data, setData] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [rekening, setRekening] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    const table = type === 'penerimaan' ? 'penerimaan' : 'pengeluaran';
    const orderColumn = type === 'penerimaan' ? 'tanggal' : 'tanggal_pengajuan';

    const [trxRes, catRes, rekRes] = await Promise.all([
      supabase.from(table).select('*').order(orderColumn, { ascending: false }),
      supabase.from('kategori_transaksi').select('*').order('nama_kategori'),
      supabase.from('rekening').select('*').order('id'),
    ]);

    const kategoriMap = new Map((catRes.data || []).map((row: any) => [Number(row.id), row.nama_kategori]));
    const rekeningMap = new Map((rekRes.data || []).map((row: any) => [Number(row.id), row.nama_rekening]));

    if (trxRes.error) {
      setError(trxRes.error.message);
      setData([]);
    } else {
      setData((trxRes.data || []).map((row: any) => ({
        id: row.id,
        nomor: row.nomor,
        tanggal: type === 'penerimaan' ? row.tanggal : row.tanggal_pengajuan,
        tanggal_pembayaran: row.tanggal_pembayaran,
        tipe: type,
        kategori_id: row.kategori_id,
        kategori: kategoriMap.get(Number(row.kategori_id)) || 'Tanpa Kategori',
        rekening_id: row.rekening_id,
        rekening: rekeningMap.get(Number(row.rekening_id)) || '-',
        nominal: toNumber(row.nominal),
        sumber: type === 'penerimaan' ? row.sumber : row.deskripsi,
        metode_bayar: row.metode_bayar,
        keterangan: row.keterangan,
        status: row.status,
        raw: row,
      })));
    }

    if (!catRes.error) {
      setCategories((catRes.data || []).filter((row: any) => row.is_active !== false && (row.tipe === type || row.tipe === 'semua')));
    }
    if (!rekRes.error) {
      setRekening((rekRes.data || []).filter((row: any) => row.is_active !== false));
    }
    setLoading(false);
  }, [type]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const create = useCallback(async (input: Record<string, any>) => {
    setSaving(true);
    setError(null);
    try {
      const nominal = toNumber(input.nominal);
      if (nominal <= 0) throw new Error('Nominal harus lebih dari 0.');

      if (type === 'penerimaan') {
        const payload = {
          nomor: input.nomor || makeTransactionNumber('penerimaan'),
          tanggal: input.tanggal || todayISO(),
          sumber: input.sumber || '-',
          kategori_id: input.kategori_id ? Number(input.kategori_id) : null,
          rekening_id: input.rekening_id ? Number(input.rekening_id) : null,
          nominal,
          metode_bayar: input.metode_bayar || null,
          keterangan: input.keterangan || null,
          status: input.status || 'terverifikasi',
        };
        const { error: insertError } = await supabase.from('penerimaan').insert(payload);
        if (insertError) throw new Error(insertError.message);
      } else {
        const status = input.status || 'menunggu';
        const payload = {
          nomor: input.nomor || makeTransactionNumber('pengeluaran'),
          tanggal_pengajuan: input.tanggal || todayISO(),
          tanggal_pembayaran: status === 'lunas' ? (input.tanggal_pembayaran || input.tanggal || todayISO()) : (input.tanggal_pembayaran || null),
          kategori_id: input.kategori_id ? Number(input.kategori_id) : null,
          rekening_id: input.rekening_id ? Number(input.rekening_id) : null,
          nominal,
          deskripsi: input.sumber || input.deskripsi || '-',
          status,
        };
        const { error: insertError } = await supabase.from('pengeluaran').insert(payload);
        if (insertError) throw new Error(insertError.message);
      }
      await refresh();
    } catch (err) {
      const message = normalizeError(err);
      setError(message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [refresh, type]);

  const update = useCallback(async (id: number, input: Record<string, any>) => {
    setSaving(true);
    setError(null);
    try {
      const nominal = toNumber(input.nominal);
      if (nominal <= 0) throw new Error('Nominal harus lebih dari 0.');

      if (type === 'penerimaan') {
        const payload = {
          tanggal: input.tanggal || todayISO(),
          sumber: input.sumber || '-',
          kategori_id: input.kategori_id ? Number(input.kategori_id) : null,
          rekening_id: input.rekening_id ? Number(input.rekening_id) : null,
          nominal,
          metode_bayar: input.metode_bayar || null,
          keterangan: input.keterangan || null,
          status: input.status || 'terverifikasi',
        };
        const { error: updateError } = await supabase.from('penerimaan').update(payload).eq('id', id);
        if (updateError) throw new Error(updateError.message);
      } else {
        const status = input.status || 'menunggu';
        const payload = {
          tanggal_pengajuan: input.tanggal || todayISO(),
          tanggal_pembayaran: status === 'lunas' ? (input.tanggal_pembayaran || input.tanggal || todayISO()) : (input.tanggal_pembayaran || null),
          kategori_id: input.kategori_id ? Number(input.kategori_id) : null,
          rekening_id: input.rekening_id ? Number(input.rekening_id) : null,
          nominal,
          deskripsi: input.sumber || input.deskripsi || '-',
          status,
        };
        const { error: updateError } = await supabase.from('pengeluaran').update(payload).eq('id', id);
        if (updateError) throw new Error(updateError.message);
      }
      await refresh();
    } catch (err) {
      const message = normalizeError(err);
      setError(message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [refresh, type]);

  const remove = useCallback(async (id: number) => {
    setSaving(true);
    setError(null);
    try {
      const table = type === 'penerimaan' ? 'penerimaan' : 'pengeluaran';
      const { error: deleteError } = await supabase.from(table).delete().eq('id', id);
      if (deleteError) throw new Error(deleteError.message);
      await refresh();
    } catch (err) {
      const message = normalizeError(err);
      setError(message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [refresh, type]);

  return { data, categories, rekening, loading, saving, error, refresh, create, update, remove };
}

export function usePenerimaan() {
  return useTransactionData('penerimaan');
}

export function usePengeluaran() {
  return useTransactionData('pengeluaran');
}

export function useAnggaran() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tahun, setTahun] = useState(currentYear());

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [anggaranRes, pengeluaranRes, kategoriRes] = await Promise.all([
      supabase.from('anggaran').select('*').order('tahun', { ascending: false }),
      supabase.from('pengeluaran').select('kategori_id, nominal, status, tanggal_pembayaran, tanggal_pengajuan'),
      supabase.from('kategori_transaksi').select('id,nama_kategori'),
    ]);

    if (anggaranRes.error) {
      setError(anggaranRes.error.message);
      setData([]);
      setLoading(false);
      return;
    }

    const rows = anggaranRes.data || [];
    const kategoriMap = new Map((kategoriRes.data || []).map((row: any) => [Number(row.id), row.nama_kategori]));
    const years = Array.from(new Set(rows.map((row: any) => Number(row.tahun)).filter(Boolean))).sort((a, b) => b - a);
    const selectedYear = years.includes(currentYear()) ? currentYear() : (years[0] || currentYear());
    setTahun(selectedYear);

    const realisasiByCategory = new Map<number, number>();
    (pengeluaranRes.data || [])
      .filter((row: any) => row.status === 'lunas' && getYearFromDate(row.tanggal_pembayaran || row.tanggal_pengajuan) === selectedYear)
      .forEach((row: any) => {
        const categoryId = Number(row.kategori_id || 0);
        realisasiByCategory.set(categoryId, (realisasiByCategory.get(categoryId) || 0) + toNumber(row.nominal));
      });

    setData(rows.filter((row: any) => Number(row.tahun) === selectedYear).map((row: any) => ({
      id: row.id,
      pos: kategoriMap.get(Number(row.kategori_id)) || 'Tanpa Kategori',
      kategori_id: row.kategori_id,
      anggaran: toNumber(row.jumlah_anggaran),
      realisasi: realisasiByCategory.get(Number(row.kategori_id)) ?? toNumber(row.realisasi),
      catatan: row.catatan,
    })));
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, loading, error, tahun, refresh };
}

export function useIuran() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [iuranRes, wargaRes, rtsRes] = await Promise.all([
      supabase.from('iuran').select('*').order('periode', { ascending: false }).order('id', { ascending: true }),
      supabase.from('warga').select('id,nama,nik,rt_id'),
      supabase.from('rts').select('id,nomor_rt'),
    ]);

    if (iuranRes.error) {
      setError(iuranRes.error.message);
      setData([]);
      setLoading(false);
      return;
    }

    const wargaMap = new Map((wargaRes.data || []).map((row: any) => [Number(row.id), row]));
    const rtMap = new Map((rtsRes.data || []).map((row: any) => [Number(row.id), row.nomor_rt]));

    const deduped = new Map<string, any>();
    (iuranRes.data || []).forEach((row: any) => {
      const key = `${row.warga_id || row.id}-${row.periode}`;
      const current = deduped.get(key);
      const rank = row.status === 'lunas' ? 2 : row.status === 'terlambat' ? 1 : 0;
      const currentRank = current?.status === 'lunas' ? 2 : current?.status === 'terlambat' ? 1 : 0;
      if (!current || rank > currentRank || toNumber(row.jumlah_bayar) > toNumber(current.jumlah_bayar)) {
        deduped.set(key, row);
      }
    });

    setData(Array.from(deduped.values()).map((row: any) => {
      const warga = wargaMap.get(Number(row.warga_id));
      return {
        id: row.id,
        warga_id: row.warga_id,
        nama: warga?.nama || 'Tanpa Nama',
        rt: rtMap.get(Number(warga?.rt_id)) || '-',
        rt_id: warga?.rt_id,
        nik: warga?.nik || '-',
        tagihan: toNumber(row.jumlah_tagihan),
        jumlah_bayar: toNumber(row.jumlah_bayar),
        status: row.status,
        periode: row.periode,
        periodeLabel: formatPeriodLabel(row.periode),
        tanggal_jatuh_tempo: row.tanggal_jatuh_tempo,
        tanggal_bayar: row.tanggal_bayar,
        metode_bayar: row.metode_bayar,
      };
    }));
    const warnings = [wargaRes.error?.message, rtsRes.error?.message].filter(Boolean).join(' | ');
    setError(warnings || null);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const markPaid = useCallback(async (id: number, jumlahBayar?: number, metodeBayar = 'Tunai') => {
    setSaving(true);
    setError(null);
    try {
      const item = data.find((row) => row.id === id);
      const bayar = jumlahBayar ?? item?.tagihan ?? 0;
      const { error: updateError } = await supabase
        .from('iuran')
        .update({
          status: 'lunas',
          jumlah_bayar: bayar,
          tanggal_bayar: todayISO(),
          metode_bayar: metodeBayar,
        })
        .eq('id', id);
      if (updateError) throw new Error(updateError.message);
      await refresh();
    } catch (err) {
      const message = normalizeError(err);
      setError(message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [data, refresh]);

  const generateIuranForPeriod = useCallback(async (periode: string, jumlahTagihan: number) => {
    setSaving(true);
    setError(null);
    try {
      if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(periode)) throw new Error('Format periode harus YYYY-MM.');
      if (jumlahTagihan < 0) throw new Error('Jumlah tagihan tidak valid.');

      const [wargaRes, existingRes] = await Promise.all([
        supabase.from('warga').select('id').eq('status', 'aktif'),
        supabase.from('iuran').select('warga_id').eq('periode', periode),
      ]);
      if (wargaRes.error) throw new Error(wargaRes.error.message);
      if (existingRes.error) throw new Error(existingRes.error.message);

      const existing = new Set((existingRes.data || []).map((row: any) => Number(row.warga_id)));
      const rows = (wargaRes.data || [])
        .filter((row: any) => !existing.has(Number(row.id)))
        .map((row: any) => ({
          warga_id: row.id,
          periode,
          jumlah_tagihan: jumlahTagihan,
          jumlah_bayar: 0,
          status: 'belum',
          tanggal_jatuh_tempo: `${periode}-10`,
        }));

      if (rows.length > 0) {
        const { error: insertError } = await supabase.from('iuran').insert(rows);
        if (insertError) throw new Error(insertError.message);
      }
      await refresh();
      return rows.length;
    } catch (err) {
      const message = normalizeError(err);
      setError(message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [refresh]);

  return { data, loading, saving, error, refresh, markPaid, generateIuranForPeriod };
}

export function useAset() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data: rows, error: queryError } = await supabase
      .from('aset')
      .select('*')
      .order('id');

    if (queryError) {
      setError(queryError.message);
      setData([]);
    } else {
      setData((rows || []).map((row: any) => ({
        id: row.id,
        kode: row.kode_aset,
        nama: row.nama,
        kategori: row.kategori || '-',
        nilai: toNumber(row.nilai_perolehan),
        tanggal_perolehan: row.tanggal_perolehan,
        lokasi: row.lokasi || '-',
        kondisi: row.kondisi,
        keterangan: row.keterangan,
      })));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const create = useCallback(async (input: Record<string, any>) => {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        kode_aset: input.kode_aset || input.kode || `AST-${Date.now().toString().slice(-6)}`,
        nama: input.nama,
        kategori: input.kategori || null,
        nilai_perolehan: toNumber(input.nilai_perolehan ?? input.nilai),
        tanggal_perolehan: input.tanggal_perolehan || todayISO(),
        lokasi: input.lokasi || null,
        kondisi: input.kondisi || 'Baik',
        keterangan: input.keterangan || null,
      };
      if (!payload.nama) throw new Error('Nama aset wajib diisi.');
      const { error: insertError } = await supabase.from('aset').insert(payload);
      if (insertError) throw new Error(insertError.message);
      await refresh();
    } catch (err) {
      const message = normalizeError(err);
      setError(message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [refresh]);

  const remove = useCallback(async (id: number) => {
    setSaving(true);
    setError(null);
    try {
      const { error: deleteError } = await supabase.from('aset').delete().eq('id', id);
      if (deleteError) throw new Error(deleteError.message);
      await refresh();
    } catch (err) {
      const message = normalizeError(err);
      setError(message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [refresh]);

  return { data, loading, saving, error, refresh, create, remove };
}

export function usePengguna() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [usersRes, rolesRes, rtsRes] = await Promise.all([
      supabase.from('users').select('*').order('nama'),
      supabase.from('roles').select('id,nama_role'),
      supabase.from('rts').select('id,nomor_rt'),
    ]);

    if (usersRes.error) {
      setError(usersRes.error.message);
      setData([]);
    } else {
      const roleMap = new Map((rolesRes.data || []).map((row: any) => [Number(row.id), row.nama_role]));
      const rtMap = new Map((rtsRes.data || []).map((row: any) => [Number(row.id), row.nomor_rt]));
      setData((usersRes.data || []).map((row: any) => ({
        id: row.id,
        nama: row.nama,
        email: row.email,
        role: roleMap.get(Number(row.role_id)) || 'Tanpa Role',
        rt: rtMap.get(Number(row.rt_id)) || '-',
        status: row.is_active ? 'aktif' : 'nonaktif',
        lastLogin: row.last_login ? new Date(row.last_login).toLocaleString('id-ID') : '-',
      })));
      const warnings = [rolesRes.error?.message, rtsRes.error?.message].filter(Boolean).join(' | ');
      setError(warnings || null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, loading, error, refresh };
}

export function useAuditLogs() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data: rows, error: queryError } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    if (queryError) {
      setError(queryError.message);
      setData([]);
    } else {
      setData((rows || []).map((row: any) => ({
        id: row.id,
        user: row.user_name || 'system',
        action: row.action,
        table: row.table_name || '-',
        record: row.record_id || '-',
        waktu: row.created_at ? new Date(row.created_at).toLocaleString('id-ID') : '-',
        detail: `${row.action} pada ${row.table_name || '-'}`,
        old_data: row.old_data,
        new_data: row.new_data,
      })));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, loading, error, refresh };
}

export function useLaporanData() {
  const dashboard = useDashboardData();
  const [arusKas, setArusKas] = useState<any[]>([]);
  const [loadingArusKas, setLoadingArusKas] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshArusKas = useCallback(async () => {
    setLoadingArusKas(true);
    setError(null);
    const { data: rows, error: queryError } = await supabase
      .from('v_laporan_arus_kas')
      .select('*')
      .order('tanggal', { ascending: false });

    if (queryError) {
      setError(queryError.message);
      setArusKas([]);
    } else {
      setArusKas((rows || []).map((row: any) => ({
        tanggal: row.tanggal,
        tipe: row.tipe,
        referensi: row.referensi,
        kategori: row.kategori || '-',
        rekening: row.rekening || '-',
        uraian: row.uraian || '-',
        masuk: toNumber(row.masuk),
        keluar: toNumber(row.keluar),
        status: row.status,
      })));
    }
    setLoadingArusKas(false);
  }, []);

  useEffect(() => {
    refreshArusKas();
  }, [refreshArusKas]);

  return {
    ...dashboard,
    arusKas,
    loadingArusKas,
    laporanError: error,
    refreshArusKas,
  };
}
