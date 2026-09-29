export type RoleName =
  | 'Super Admin'
  | 'Ketua RW'
  | 'Bendahara'
  | 'Sekretaris'
  | 'Pengurus RT'
  | 'Auditor'
  | 'Warga'
  | 'Tanpa Role'
  | string;

export type Permissions = ReturnType<typeof getPermissions>;

const ALL_MENUS = [
  'dashboard',
  'penerimaan',
  'pengeluaran',
  'anggaran',
  'kas-bank',
  'warga',
  'iuran',
  'aset',
  'laporan',
  'pengguna',
  'audit',
];

const roleMenus: Record<string, string[]> = {
  'Super Admin': ALL_MENUS,
  'Ketua RW': ['dashboard', 'penerimaan', 'pengeluaran', 'anggaran', 'kas-bank', 'warga', 'iuran', 'aset', 'laporan', 'audit'],
  Bendahara: ['dashboard', 'penerimaan', 'pengeluaran', 'anggaran', 'kas-bank', 'warga', 'iuran', 'aset', 'laporan', 'audit'],
  Sekretaris: ['dashboard', 'warga', 'iuran', 'aset', 'laporan'],
  'Pengurus RT': ['dashboard', 'penerimaan', 'pengeluaran', 'warga', 'iuran', 'laporan'],
  Auditor: ['dashboard', 'penerimaan', 'pengeluaran', 'anggaran', 'kas-bank', 'warga', 'iuran', 'aset', 'laporan', 'audit'],
  Warga: ['dashboard', 'laporan'],
  'Tanpa Role': ['dashboard'],
};

export function getPermissions(roleName?: RoleName) {
  const role = roleName || 'Tanpa Role';
  const isSuper = role === 'Super Admin';
  const isKetua = role === 'Ketua RW';
  const isBendahara = role === 'Bendahara';
  const isSekretaris = role === 'Sekretaris';
  const isPengurusRt = role === 'Pengurus RT';
  const isAuditor = role === 'Auditor';
  const isWarga = role === 'Warga';

  const allowedMenus = isSuper ? ALL_MENUS : (roleMenus[role] || roleMenus['Tanpa Role']);

  return {
    roleName: role,
    allowedMenus,
    isReadOnly: isAuditor || isWarga,
    canViewMenu: (menu: string) => allowedMenus.includes(menu),

    canCreatePenerimaan: isSuper || isBendahara || isPengurusRt,
    canEditPenerimaan: isSuper || isBendahara,
    canDeletePenerimaan: isSuper || isBendahara,

    canCreatePengeluaran: isSuper || isBendahara || isPengurusRt,
    canEditPengeluaran: isSuper || isBendahara || isPengurusRt,
    canDeletePengeluaran: isSuper || isBendahara,
    canApprovePengeluaran: isSuper || isKetua,
    canRejectPengeluaran: isSuper || isKetua,
    canPayPengeluaran: isSuper || isBendahara,

    canManageAnggaran: isSuper || isBendahara,
    canManageRekening: isSuper || isBendahara,
    canManageWarga: isSuper || isSekretaris || isPengurusRt || isBendahara,
    canManageIuran: isSuper || isBendahara || isPengurusRt,
    canManageAset: isSuper || isSekretaris || isBendahara,
    canManageUsers: isSuper,
    canViewAudit: isSuper || isKetua || isAuditor || isBendahara,
  };
}

export function getDefaultMenu(roleName?: RoleName) {
  return getPermissions(roleName).allowedMenus[0] || 'dashboard';
}

export function explainRole(roleName?: RoleName) {
  const role = roleName || 'Tanpa Role';
  const descriptions: Record<string, string> = {
    'Super Admin': 'Akses penuh seluruh sistem.',
    'Ketua RW': 'Monitoring, laporan, audit, serta approval/tolak pengeluaran.',
    Bendahara: 'Input transaksi, pembayaran, kas bank, iuran, aset, dan laporan.',
    Sekretaris: 'Mengelola data warga, aset, dan laporan administrasi.',
    'Pengurus RT': 'Input usulan/transaksi dan mengelola warga/iuran RT.',
    Auditor: 'Akses baca untuk laporan dan audit, tanpa input/edit/hapus.',
    Warga: 'Akses terbatas untuk informasi publik/pribadi.',
    'Tanpa Role': 'Akses sangat terbatas. Hubungi admin untuk set role.',
  };
  return descriptions[role] || descriptions['Tanpa Role'];
}
