import React, { useMemo, useState } from 'react';
import {
  FileText, Download, Printer, Calendar, Filter, Database, Loader2, RefreshCw,
  FileSpreadsheet, FileDown, Eye, BarChart3,
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import writeXlsxFile from 'write-excel-file/browser';
import { currentPeriod, currentYear, formatPeriodLabel, todayISO, useLaporanData } from '../hooks/useSupabaseData';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value || 0);
};

const formatNumber = (value: number) => new Intl.NumberFormat('id-ID').format(value || 0);

const formatDate = (value?: string | null) => {
  if (!value) return '-';
  const isoDate = String(value).slice(0, 10);
  const [year, month, day] = isoDate.split('-');
  if (year && month && day) return `${day}/${month}/${year}`;
  return String(value);
};

const formatDateTime = (value?: string | null) => {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' });
};

const safeFileName = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const csvEscape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;

type ReportKind = 'arus-kas' | 'buku-kas' | 'anggaran' | 'penerimaan' | 'pengeluaran' | 'iuran' | 'kas-bank' | 'audit';
type PeriodScope = 'bulan' | 'tahun' | 'semua';
type ColumnType = 'text' | 'currency' | 'number' | 'date' | 'datetime' | 'percent';

type ReportColumn = {
  key: string;
  header: string;
  type?: ColumnType;
};

type ReportDefinition = {
  id: ReportKind;
  nama: string;
  deskripsi: string;
  icon: string;
  columns: ReportColumn[];
};

const reportDefinitions: ReportDefinition[] = [
  {
    id: 'arus-kas',
    nama: 'Laporan Arus Kas',
    deskripsi: 'Kas masuk dan keluar per periode, siap PDF/Excel.',
    icon: '💰',
    columns: [
      { key: 'tanggal', header: 'Tanggal', type: 'date' },
      { key: 'tipe', header: 'Tipe' },
      { key: 'referensi', header: 'Referensi' },
      { key: 'kategori', header: 'Kategori' },
      { key: 'rekening', header: 'Rekening' },
      { key: 'uraian', header: 'Uraian' },
      { key: 'masuk', header: 'Masuk', type: 'currency' },
      { key: 'keluar', header: 'Keluar', type: 'currency' },
      { key: 'status', header: 'Status' },
    ],
  },
  {
    id: 'buku-kas',
    nama: 'Buku Kas Umum',
    deskripsi: 'Buku kas dengan saldo berjalan kronologis.',
    icon: '📒',
    columns: [
      { key: 'tanggal', header: 'Tanggal', type: 'date' },
      { key: 'referensi', header: 'Bukti/Ref' },
      { key: 'uraian', header: 'Uraian' },
      { key: 'masuk', header: 'Debit', type: 'currency' },
      { key: 'keluar', header: 'Kredit', type: 'currency' },
      { key: 'saldo', header: 'Saldo', type: 'currency' },
    ],
  },
  {
    id: 'anggaran',
    nama: 'Realisasi Anggaran',
    deskripsi: 'Perbandingan anggaran, realisasi, sisa, dan persentase.',
    icon: '📊',
    columns: [
      { key: 'tahun', header: 'Tahun', type: 'number' },
      { key: 'kategori', header: 'Pos Anggaran' },
      { key: 'anggaran', header: 'Anggaran', type: 'currency' },
      { key: 'realisasi', header: 'Realisasi', type: 'currency' },
      { key: 'sisa', header: 'Sisa', type: 'currency' },
      { key: 'persentase', header: 'Realisasi %', type: 'percent' },
      { key: 'catatan', header: 'Catatan' },
    ],
  },
  {
    id: 'penerimaan',
    nama: 'Laporan Penerimaan',
    deskripsi: 'Daftar penerimaan, sumber, rekening, dan status.',
    icon: '📥',
    columns: [
      { key: 'tanggal', header: 'Tanggal', type: 'date' },
      { key: 'nomor', header: 'Nomor' },
      { key: 'kategori', header: 'Kategori' },
      { key: 'rekening', header: 'Rekening' },
      { key: 'sumber', header: 'Sumber' },
      { key: 'nominal', header: 'Nominal', type: 'currency' },
      { key: 'metode_bayar', header: 'Metode' },
      { key: 'status', header: 'Status' },
    ],
  },
  {
    id: 'pengeluaran',
    nama: 'Laporan Pengeluaran',
    deskripsi: 'Daftar pengeluaran lengkap dengan approval dan pembayaran.',
    icon: '📤',
    columns: [
      { key: 'tanggal_pengajuan', header: 'Pengajuan', type: 'date' },
      { key: 'tanggal_pembayaran', header: 'Pembayaran', type: 'date' },
      { key: 'nomor', header: 'Nomor' },
      { key: 'kategori', header: 'Kategori' },
      { key: 'rekening', header: 'Rekening' },
      { key: 'deskripsi', header: 'Deskripsi' },
      { key: 'nominal', header: 'Nominal', type: 'currency' },
      { key: 'status', header: 'Status' },
      { key: 'approved_by', header: 'Disetujui Oleh' },
      { key: 'catatan_approval', header: 'Catatan' },
    ],
  },
  {
    id: 'iuran',
    nama: 'Rekap Iuran Warga',
    deskripsi: 'Tagihan, pembayaran, sisa, status, dan RT.',
    icon: '👥',
    columns: [
      { key: 'periode', header: 'Periode' },
      { key: 'rt', header: 'RT' },
      { key: 'nama', header: 'Nama Warga' },
      { key: 'nik', header: 'NIK' },
      { key: 'tagihan', header: 'Tagihan', type: 'currency' },
      { key: 'jumlah_bayar', header: 'Bayar', type: 'currency' },
      { key: 'sisa', header: 'Sisa', type: 'currency' },
      { key: 'status', header: 'Status' },
      { key: 'tanggal_bayar', header: 'Tgl Bayar', type: 'date' },
    ],
  },
  {
    id: 'kas-bank',
    nama: 'Saldo Kas & Bank',
    deskripsi: 'Posisi saldo kas dan rekening bank saat ini.',
    icon: '🏦',
    columns: [
      { key: 'nama', header: 'Nama Rekening/Kas' },
      { key: 'jenis', header: 'Jenis' },
      { key: 'bank', header: 'Bank' },
      { key: 'nomor', header: 'Nomor' },
      { key: 'saldo_awal', header: 'Saldo Awal', type: 'currency' },
      { key: 'saldo', header: 'Saldo Saat Ini', type: 'currency' },
    ],
  },
  {
    id: 'audit',
    nama: 'Audit Trail',
    deskripsi: 'Log aktivitas sistem untuk kontrol internal.',
    icon: '🔍',
    columns: [
      { key: 'waktu', header: 'Waktu', type: 'datetime' },
      { key: 'user', header: 'User' },
      { key: 'aksi', header: 'Aksi' },
      { key: 'tabel', header: 'Tabel' },
      { key: 'record_id', header: 'Record ID' },
      { key: 'keterangan', header: 'Keterangan' },
    ],
  },
];

function displayCell(row: Record<string, any>, column: ReportColumn, rawForExcel = false) {
  const value = row[column.key];
  if (rawForExcel && ['currency', 'number', 'percent'].includes(column.type || '')) return Number(value || 0);
  if (column.type === 'currency') return formatCurrency(Number(value || 0));
  if (column.type === 'number') return formatNumber(Number(value || 0));
  if (column.type === 'percent') return `${formatNumber(Number(value || 0))}%`;
  if (column.type === 'date') return formatDate(value);
  if (column.type === 'datetime') return formatDateTime(value);
  return value ?? '-';
}

function buildBukuKasRows(rows: any[]) {
  let saldo = 0;
  const ascRows = [...rows].sort((a: any, b: any) => `${a.tanggal || ''}${a.referensi || ''}`.localeCompare(`${b.tanggal || ''}${b.referensi || ''}`));
  return ascRows.map((row: any) => {
    saldo += Number(row.masuk || 0) - Number(row.keluar || 0);
    return { ...row, saldo };
  }).sort((a: any, b: any) => `${b.tanggal || ''}${b.referensi || ''}`.localeCompare(`${a.tanggal || ''}${a.referensi || ''}`));
}

const Laporan: React.FC = () => {
  const {
    monthlyData,
    anggaranData,
    arusKas,
    penerimaanReport,
    pengeluaranReport,
    anggaranReport,
    iuranReport,
    auditReport,
    rekeningReport,
    loading,
    loadingArusKas,
    laporanError,
    error,
    refresh,
    refreshArusKas,
    periodeLabel,
    tahunAnggaran,
  } = useLaporanData();

  const [selectedReport, setSelectedReport] = useState<ReportKind>('arus-kas');
  const [periodScope, setPeriodScope] = useState<PeriodScope>('bulan');
  const [selectedPeriod, setSelectedPeriod] = useState(currentPeriod());
  const [selectedYear, setSelectedYear] = useState(String(tahunAnggaran || currentYear()));
  const [selectedRT, setSelectedRT] = useState('semua');

  const activeDefinition = reportDefinitions.find((item) => item.id === selectedReport) || reportDefinitions[0];

  const availablePeriods = useMemo(() => {
    const periods = new Set<string>([currentPeriod()]);
    [...arusKas, ...penerimaanReport, ...pengeluaranReport, ...iuranReport, ...auditReport].forEach((row: any) => {
      if (row.periode) periods.add(row.periode);
    });
    return Array.from(periods).sort((a, b) => b.localeCompare(a));
  }, [arusKas, auditReport, iuranReport, penerimaanReport, pengeluaranReport]);

  const availableYears = useMemo(() => {
    const years = new Set<number>([Number(tahunAnggaran || currentYear()), currentYear()]);
    [...arusKas, ...penerimaanReport, ...pengeluaranReport, ...iuranReport, ...auditReport, ...anggaranReport].forEach((row: any) => {
      if (row.tahun) years.add(Number(row.tahun));
    });
    return Array.from(years).filter(Boolean).sort((a, b) => b - a);
  }, [anggaranReport, arusKas, auditReport, iuranReport, penerimaanReport, pengeluaranReport, tahunAnggaran]);

  const rtOptions = useMemo(() => {
    const rts = new Set<string>();
    iuranReport.forEach((row: any) => {
      if (row.rt && row.rt !== '-') rts.add(row.rt);
    });
    return Array.from(rts).sort();
  }, [iuranReport]);

  const rawRows = useMemo(() => {
    if (selectedReport === 'buku-kas') return buildBukuKasRows(arusKas);
    if (selectedReport === 'arus-kas') return arusKas;
    if (selectedReport === 'penerimaan') return penerimaanReport;
    if (selectedReport === 'pengeluaran') return pengeluaranReport;
    if (selectedReport === 'iuran') return iuranReport;
    if (selectedReport === 'kas-bank') return rekeningReport;
    if (selectedReport === 'audit') return auditReport;
    if (selectedReport === 'anggaran') {
      if (anggaranReport.length > 0) return anggaranReport;
      return anggaranData.map((row: any) => ({
        tahun: tahunAnggaran,
        kategori: row.pos,
        anggaran: row.anggaran,
        realisasi: row.realisasi,
        sisa: Math.max(Number(row.anggaran || 0) - Number(row.realisasi || 0), 0),
        persentase: Number(row.anggaran || 0) > 0 ? Math.round((Number(row.realisasi || 0) / Number(row.anggaran || 0)) * 100) : 0,
        catatan: '-',
      }));
    }
    return [];
  }, [anggaranData, anggaranReport, arusKas, auditReport, iuranReport, penerimaanReport, pengeluaranReport, rekeningReport, selectedReport, tahunAnggaran]);

  const reportRows = useMemo(() => {
    return rawRows.filter((row: any) => {
      const matchesPeriod = selectedReport === 'kas-bank'
        ? true
        : selectedReport === 'anggaran'
          ? Number(row.tahun) === Number(selectedYear)
          : periodScope === 'semua'
            ? true
            : periodScope === 'tahun'
              ? Number(row.tahun) === Number(selectedYear)
              : row.periode === selectedPeriod;
      const matchesRT = selectedRT === 'semua' || !('rt' in row) || row.rt === selectedRT;
      return matchesPeriod && matchesRT;
    });
  }, [periodScope, rawRows, selectedPeriod, selectedRT, selectedReport, selectedYear]);

  const reportPeriodLabel = useMemo(() => {
    if (selectedReport === 'kas-bank') return `Posisi per ${formatDate(todayISO())}`;
    if (selectedReport === 'anggaran') return `Tahun ${selectedYear}`;
    if (periodScope === 'semua') return 'Semua Periode';
    if (periodScope === 'tahun') return `Tahun ${selectedYear}`;
    return formatPeriodLabel(selectedPeriod);
  }, [periodScope, selectedPeriod, selectedReport, selectedYear]);

  const summary = useMemo(() => {
    if (selectedReport === 'arus-kas' || selectedReport === 'buku-kas') {
      const masuk = reportRows.reduce((sum: number, row: any) => sum + Number(row.masuk || 0), 0);
      const keluar = reportRows.reduce((sum: number, row: any) => sum + Number(row.keluar || 0), 0);
      return [
        { label: 'Total Baris', value: `${reportRows.length}` },
        { label: 'Total Masuk', value: formatCurrency(masuk), color: 'text-emerald-700', bg: 'bg-emerald-50' },
        { label: 'Total Keluar', value: formatCurrency(keluar), color: 'text-red-700', bg: 'bg-red-50' },
        { label: 'Saldo Bersih', value: formatCurrency(masuk - keluar), color: 'text-blue-700', bg: 'bg-blue-50' },
      ];
    }
    if (selectedReport === 'anggaran') {
      const anggaran = reportRows.reduce((sum: number, row: any) => sum + Number(row.anggaran || 0), 0);
      const realisasi = reportRows.reduce((sum: number, row: any) => sum + Number(row.realisasi || 0), 0);
      const sisa = Math.max(anggaran - realisasi, 0);
      return [
        { label: 'Pos Anggaran', value: `${reportRows.length}` },
        { label: 'Total Anggaran', value: formatCurrency(anggaran), color: 'text-teal-700', bg: 'bg-teal-50' },
        { label: 'Total Realisasi', value: formatCurrency(realisasi), color: 'text-emerald-700', bg: 'bg-emerald-50' },
        { label: 'Sisa', value: formatCurrency(sisa), color: 'text-blue-700', bg: 'bg-blue-50' },
      ];
    }
    if (selectedReport === 'iuran') {
      const tagihan = reportRows.reduce((sum: number, row: any) => sum + Number(row.tagihan || 0), 0);
      const bayar = reportRows.reduce((sum: number, row: any) => sum + Number(row.jumlah_bayar || 0), 0);
      return [
        { label: 'Data Tagihan', value: `${reportRows.length}` },
        { label: 'Total Tagihan', value: formatCurrency(tagihan), color: 'text-gray-800', bg: 'bg-gray-50' },
        { label: 'Terkumpul', value: formatCurrency(bayar), color: 'text-emerald-700', bg: 'bg-emerald-50' },
        { label: 'Belum Bayar', value: formatCurrency(Math.max(tagihan - bayar, 0)), color: 'text-red-700', bg: 'bg-red-50' },
      ];
    }
    if (selectedReport === 'kas-bank') {
      const saldo = reportRows.reduce((sum: number, row: any) => sum + Number(row.saldo || 0), 0);
      return [
        { label: 'Jumlah Rekening', value: `${reportRows.length}` },
        { label: 'Total Saldo', value: formatCurrency(saldo), color: 'text-blue-700', bg: 'bg-blue-50' },
        { label: 'Kas', value: `${reportRows.filter((row: any) => row.jenis === 'kas').length}` },
        { label: 'Bank', value: `${reportRows.filter((row: any) => row.jenis === 'bank').length}` },
      ];
    }
    const totalNominal = reportRows.reduce((sum: number, row: any) => sum + Number(row.nominal || 0), 0);
    return [
      { label: 'Total Baris', value: `${reportRows.length}` },
      { label: 'Total Nominal', value: formatCurrency(totalNominal), color: selectedReport === 'pengeluaran' ? 'text-red-700' : 'text-emerald-700', bg: selectedReport === 'pengeluaran' ? 'bg-red-50' : 'bg-emerald-50' },
      { label: 'Periode', value: reportPeriodLabel },
      { label: 'RT Filter', value: selectedRT === 'semua' ? 'Semua RT' : selectedRT },
    ];
  }, [reportPeriodLabel, reportRows, selectedRT, selectedReport]);

  const exportCsv = () => {
    const header = activeDefinition.columns.map((column) => column.header);
    const rows = reportRows.map((row: any) => activeDefinition.columns.map((column) => displayCell(row, column)));
    const csv = [header, ...rows].map((row) => row.map(csvEscape).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${safeFileName(activeDefinition.nama)}-${todayISO()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportExcel = async () => {
    const headerCell = (value: string) => ({
      value,
      fontWeight: 'bold' as const,
      color: '#FFFFFF',
      backgroundColor: '#0F766E',
      align: 'center' as const,
      alignVertical: 'center' as const,
    });

    const summaryRows = [
      [headerCell('Informasi'), headerCell('Nilai')],
      [{ value: 'Nama Laporan' }, { value: activeDefinition.nama }],
      [{ value: 'Periode' }, { value: reportPeriodLabel }],
      [{ value: 'Filter RT' }, { value: selectedRT === 'semua' ? 'Semua RT' : selectedRT }],
      [{ value: 'Tanggal Unduh' }, { value: formatDate(todayISO()) }],
      ...summary.map((item) => ([{ value: item.label }, { value: item.value }])),
    ];

    const dataRows = [
      activeDefinition.columns.map((column) => headerCell(column.header)),
      ...reportRows.map((row: any) => activeDefinition.columns.map((column) => {
        if (column.type === 'currency' || column.type === 'number' || column.type === 'percent') {
          return {
            value: Number(row[column.key] || 0),
            format: column.type === 'percent' ? '0' : '#,##0',
            align: 'right' as const,
          };
        }
        return {
          value: String(displayCell(row, column)),
          wrap: true,
        };
      })),
    ];

    const file = writeXlsxFile([
      {
        sheet: 'Ringkasan',
        data: summaryRows,
        columns: [{ width: 26 }, { width: 42 }],
      },
      {
        sheet: 'Data',
        data: dataRows,
        columns: activeDefinition.columns.map((column) => ({ width: Math.max(14, Math.min(42, column.header.length + 12)) })),
      },
    ]);
    await file.toFile(`${safeFileName(activeDefinition.nama)}-${todayISO()}.xlsx`);
  };

  const exportPdf = () => {
    const landscape = activeDefinition.columns.length > 7;
    const doc = new jsPDF({ orientation: landscape ? 'landscape' : 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text(activeDefinition.nama, 14, 15);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Sistem Kas RW 07', 14, 21);
    doc.text(`Periode: ${reportPeriodLabel}`, 14, 27);
    doc.text(`Filter RT: ${selectedRT === 'semua' ? 'Semua RT' : selectedRT}`, 14, 33);
    doc.text(`Dicetak: ${formatDate(todayISO())}`, pageWidth - 14, 21, { align: 'right' });

    const summaryText = summary.map((item) => `${item.label}: ${item.value}`).join(' | ');
    const splitSummary = doc.splitTextToSize(summaryText, pageWidth - 28);
    doc.text(splitSummary, 14, 40);

    autoTable(doc, {
      startY: 48,
      head: [activeDefinition.columns.map((column) => column.header)],
      body: reportRows.map((row: any) => activeDefinition.columns.map((column) => String(displayCell(row, column)))),
      styles: { fontSize: landscape ? 7 : 8, cellPadding: 2, overflow: 'linebreak' },
      headStyles: { fillColor: [13, 148, 136], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 253, 250] },
      margin: { left: 10, right: 10 },
      didDrawPage: () => {
        const pageNumber = doc.getNumberOfPages();
        doc.setFontSize(8);
        doc.setTextColor(120);
        doc.text(`Halaman ${pageNumber}`, pageWidth - 14, doc.internal.pageSize.getHeight() - 8, { align: 'right' });
      },
    });

    doc.save(`${safeFileName(activeDefinition.nama)}-${todayISO()}.pdf`);
  };

  const printReport = () => {
    const tableHead = activeDefinition.columns.map((column) => `<th>${column.header}</th>`).join('');
    const tableRows = reportRows.map((row: any) => `<tr>${activeDefinition.columns.map((column) => `<td class="${column.type === 'currency' || column.type === 'number' || column.type === 'percent' ? 'num' : ''}">${displayCell(row, column)}</td>`).join('')}</tr>`).join('');
    const summaryHtml = summary.map((item) => `<div><strong>${item.label}</strong><br/>${item.value}</div>`).join('');
    const printWindow = window.open('', '_blank', 'width=1100,height=800');
    if (!printWindow) {
      window.print();
      return;
    }

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>${activeDefinition.nama}</title>
          <style>
            body { font-family: Arial, sans-serif; color: #111827; margin: 24px; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0f766e; padding-bottom: 12px; margin-bottom: 16px; }
            h1 { margin: 0; font-size: 22px; color: #0f766e; }
            p { margin: 4px 0; font-size: 12px; color: #4b5563; }
            .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin: 16px 0; }
            .summary div { border: 1px solid #d1d5db; border-radius: 8px; padding: 8px; font-size: 12px; }
            table { border-collapse: collapse; width: 100%; font-size: 10px; }
            th { background: #0f766e; color: white; text-align: left; padding: 6px; }
            td { border-bottom: 1px solid #e5e7eb; padding: 5px; vertical-align: top; }
            .num { text-align: right; white-space: nowrap; }
            .footer { margin-top: 18px; font-size: 10px; color: #6b7280; }
            @media print { body { margin: 12mm; } .no-print { display: none; } }
          </style>
        </head>
        <body>
          <button class="no-print" onclick="window.print()" style="margin-bottom:12px;padding:8px 12px;background:#0f766e;color:white;border:0;border-radius:6px;cursor:pointer;">Cetak / Save as PDF</button>
          <div class="header">
            <div>
              <h1>${activeDefinition.nama}</h1>
              <p>Sistem Kas RW 07</p>
              <p>Periode: ${reportPeriodLabel} | RT: ${selectedRT === 'semua' ? 'Semua RT' : selectedRT}</p>
            </div>
            <div style="text-align:right">
              <p>Tanggal cetak: ${formatDate(todayISO())}</p>
              <p>Total data: ${reportRows.length}</p>
            </div>
          </div>
          <div class="summary">${summaryHtml}</div>
          <table>
            <thead><tr>${tableHead}</tr></thead>
            <tbody>${tableRows || `<tr><td colspan="${activeDefinition.columns.length}">Belum ada data.</td></tr>`}</tbody>
          </table>
          <div class="footer">Dokumen ini dibuat otomatis oleh Sistem Kas RW 07.</div>
          <script>setTimeout(() => window.print(), 300);</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (loading || loadingArusKas) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-teal-600 animate-spin mx-auto mb-3" />
          <p className="text-gray-600 font-medium">Memuat laporan dari Supabase...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-3">
        <Database className="w-5 h-5 text-emerald-600" />
        <div className="flex-1">
          <p className="text-sm font-medium text-emerald-800">✅ Laporan siap PDF/Excel memakai data Supabase</p>
          {(error || laporanError) && <p className="text-xs text-red-600 mt-1">{error || laporanError}</p>}
        </div>
        <button onClick={() => { refresh(); refreshArusKas(); }} className="text-xs px-3 py-1.5 bg-white border border-emerald-200 text-emerald-700 rounded-lg hover:bg-emerald-100 flex items-center gap-1">
          <RefreshCw className="w-3 h-3" /> Refresh
        </button>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
            <FileText className="w-6 h-6 text-teal-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Laporan</h1>
            <p className="text-gray-500 text-sm">Generate laporan siap cetak PDF dan Excel untuk pengurus RW 07</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={printReport} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2">
            <Printer className="w-4 h-4" /> Cetak
          </button>
          <button onClick={exportPdf} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 flex items-center gap-2">
            <FileDown className="w-4 h-4" /> PDF
          </button>
          <button onClick={() => { void exportExcel(); }} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4" /> Excel
          </button>
          <button onClick={exportCsv} className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 flex items-center gap-2">
            <Download className="w-4 h-4" /> CSV
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Jenis Laporan</label>
            <select value={selectedReport} onChange={(e) => setSelectedReport(e.target.value as ReportKind)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
              {reportDefinitions.map((report) => <option key={report.id} value={report.id}>{report.nama}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Cakupan Periode</label>
            <select value={periodScope} onChange={(e) => setPeriodScope(e.target.value as PeriodScope)} disabled={selectedReport === 'kas-bank' || selectedReport === 'anggaran'} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-gray-50 disabled:text-gray-400">
              <option value="bulan">Bulanan</option>
              <option value="tahun">Tahunan</option>
              <option value="semua">Semua Periode</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1"><Calendar className="w-3 h-3 inline mr-1" />Periode/Tahun</label>
            {periodScope === 'bulan' && selectedReport !== 'anggaran' ? (
              <select value={selectedPeriod} onChange={(e) => setSelectedPeriod(e.target.value)} disabled={selectedReport === 'kas-bank'} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-gray-50 disabled:text-gray-400">
                {availablePeriods.map((period) => <option key={period} value={period}>{formatPeriodLabel(period)}</option>)}
              </select>
            ) : (
              <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} disabled={selectedReport === 'kas-bank' || periodScope === 'semua'} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-gray-50 disabled:text-gray-400">
                {availableYears.map((year) => <option key={year} value={year}>Tahun {year}</option>)}
              </select>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1"><Filter className="w-3 h-3 inline mr-1" />Filter RT</label>
            <select value={selectedRT} onChange={(e) => setSelectedRT(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
              <option value="semua">Semua RT</option>
              {rtOptions.map((rt) => <option key={rt} value={rt}>{rt}</option>)}
            </select>
          </div>
          <div className="bg-teal-50 border border-teal-100 rounded-lg p-3">
            <p className="text-xs text-teal-700 font-medium">Preview aktif</p>
            <p className="text-sm font-bold text-teal-900 truncate">{activeDefinition.nama}</p>
            <p className="text-xs text-teal-700">{reportPeriodLabel}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {summary.map((item) => (
          <div key={item.label} className={`${item.bg || 'bg-white'} rounded-xl p-5 shadow-sm border border-gray-100`}>
            <p className="text-sm text-gray-500">{item.label}</p>
            <p className={`text-xl font-bold mt-1 ${item.color || 'text-gray-800'}`}>{item.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {reportDefinitions.map((report) => (
          <div key={report.id} className={`bg-white rounded-xl p-5 shadow-sm border transition-all ${selectedReport === report.id ? 'border-teal-400 ring-2 ring-teal-100' : 'border-gray-100 hover:shadow-md'}`}>
            <div className="flex items-start justify-between mb-3">
              <span className="text-2xl">{report.icon}</span>
              <span className="text-[11px] px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full font-medium">PDF/XLSX</span>
            </div>
            <h3 className="text-sm font-semibold text-gray-800 mb-1">{report.nama}</h3>
            <p className="text-xs text-gray-500 mb-4 min-h-[34px]">{report.deskripsi}</p>
            <div className="flex gap-2">
              <button onClick={() => setSelectedReport(report.id)} className="flex-1 text-xs bg-teal-50 text-teal-700 py-2 rounded-md hover:bg-teal-100 flex items-center justify-center gap-1 font-medium">
                <Eye className="w-3 h-3" /> Preview
              </button>
              <button onClick={() => setSelectedReport(report.id)} className="flex-1 text-xs bg-red-600 text-white py-2 rounded-md hover:bg-red-700 flex items-center justify-center gap-1 font-medium">
                <FileDown className="w-3 h-3" /> Pilih
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-teal-600" /> Arus Kas 12 Bulan</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="bulan" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(Number(v) / 1000000).toFixed(0)}jt`} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Line type="monotone" dataKey="pemasukan" stroke="#10b981" strokeWidth={2} name="Pemasukan" />
              <Line type="monotone" dataKey="pengeluaran" stroke="#ef4444" strokeWidth={2} name="Pengeluaran" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Realisasi Anggaran Tahun {tahunAnggaran}</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={anggaranData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="pos" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(Number(v) / 1000000).toFixed(0)}jt`} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="anggaran" fill="#14b8a6" name="Anggaran" />
              <Bar dataKey="realisasi" fill="#10b981" name="Realisasi" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Preview: {activeDefinition.nama}</h3>
            <p className="text-sm text-gray-500">{reportPeriodLabel} • {reportRows.length} baris • ekspor ke PDF, Excel, CSV, atau cetak langsung.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={printReport} className="text-sm px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-1"><Printer className="w-4 h-4" /> Cetak</button>
            <button onClick={exportPdf} className="text-sm px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-1"><FileDown className="w-4 h-4" /> PDF</button>
            <button onClick={() => { void exportExcel(); }} className="text-sm px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-1"><FileSpreadsheet className="w-4 h-4" /> Excel</button>
            <button onClick={exportCsv} className="text-sm px-3 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-1"><Download className="w-4 h-4" /> CSV</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="text-left text-xs text-gray-500 uppercase">
                {activeDefinition.columns.map((column) => <th key={column.key} className="px-4 py-3 whitespace-nowrap">{column.header}</th>)}
              </tr>
            </thead>
            <tbody>
              {reportRows.slice(0, 25).map((row: any, rowIndex: number) => (
                <tr key={`${selectedReport}-${row.id || row.referensi || rowIndex}`} className="border-t border-gray-50 hover:bg-gray-50">
                  {activeDefinition.columns.map((column) => (
                    <td key={column.key} className={`px-4 py-3 text-sm ${column.type === 'currency' ? 'font-semibold text-gray-800 whitespace-nowrap' : 'text-gray-600'}`}>
                      {displayCell(row, column)}
                    </td>
                  ))}
                </tr>
              ))}
              {reportRows.length === 0 && (
                <tr><td colSpan={activeDefinition.columns.length} className="px-4 py-8 text-center text-sm text-gray-500">Belum ada data untuk filter laporan ini.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {reportRows.length > 25 && (
          <div className="mt-3 text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
            Preview menampilkan 25 baris pertama. File PDF/Excel/CSV berisi semua {reportRows.length} baris sesuai filter.
          </div>
        )}
      </div>
    </div>
  );
};

export default Laporan;
