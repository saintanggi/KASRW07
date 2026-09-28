import React from 'react';
import {
  LayoutDashboard,
  ArrowDownCircle,
  ArrowUpCircle,
  Wallet,
  Building2,
  Users,
  FileText,
  UserCog,
  ClipboardList,
  Settings,
  Bell,
  LogOut,
  ChevronDown,
} from 'lucide-react';

interface SidebarProps {
  activeMenu: string;
  setActiveMenu: (menu: string) => void;
  collapsed: boolean;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'penerimaan', label: 'Penerimaan', icon: ArrowDownCircle },
  { id: 'pengeluaran', label: 'Pengeluaran', icon: ArrowUpCircle },
  { id: 'anggaran', label: 'Anggaran', icon: Wallet },
  { id: 'kas-bank', label: 'Kas & Bank', icon: Building2 },
  { id: 'iuran', label: 'Iuran Warga', icon: Users },
  { id: 'aset', label: 'Inventaris & Aset', icon: ClipboardList },
  { id: 'laporan', label: 'Laporan', icon: FileText },
  { id: 'pengguna', label: 'Pengguna', icon: UserCog },
  { id: 'audit', label: 'Audit Trail', icon: Settings },
];

const Sidebar: React.FC<SidebarProps> = ({ activeMenu, setActiveMenu, collapsed }) => {
  return (
    <aside className={`${collapsed ? 'w-16' : 'w-64'} bg-gradient-to-b from-emerald-800 to-emerald-900 min-h-screen transition-all duration-300 flex flex-col shadow-xl`}>
      {/* Logo */}
      <div className="p-4 border-b border-emerald-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-emerald-800 font-bold text-lg">RW</span>
          </div>
          {!collapsed && (
            <div>
              <h1 className="text-white font-bold text-sm">Kas RW 07</h1>
              <p className="text-emerald-300 text-xs">Manajemen Keuangan</p>
            </div>
          )}
        </div>
      </div>

      {/* User Info */}
      {!collapsed && (
        <div className="p-4 border-b border-emerald-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">B</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">Bendahara RW 07</p>
              <p className="text-emerald-300 text-xs">Mode Operator</p>
            </div>
            <ChevronDown className="w-4 h-4 text-emerald-300" />
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeMenu === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveMenu(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-left
                ${isActive
                  ? 'bg-white/15 text-white shadow-md'
                  : 'text-emerald-200 hover:bg-white/10 hover:text-white'
                }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-emerald-300' : ''}`} />
              {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
              {!collapsed && item.id === 'pengeluaran' && (
                <span className="ml-auto bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">3</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="p-3 border-t border-emerald-700 space-y-1">
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-emerald-200 hover:bg-white/10 hover:text-white transition-all">
          <Bell className="w-5 h-5" />
          {!collapsed && <span className="text-sm">Notifikasi</span>}
          {!collapsed && <span className="ml-auto bg-yellow-500 text-white text-xs px-1.5 py-0.5 rounded-full">4</span>}
        </button>
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-emerald-200 hover:bg-white/10 hover:text-white transition-all">
          <LogOut className="w-5 h-5" />
          {!collapsed && <span className="text-sm">Keluar</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
