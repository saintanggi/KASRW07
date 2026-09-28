import React, { useState } from 'react';
import { Menu, X, Bell, Search, ChevronRight } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import Anggaran from './components/Anggaran';
import KasBank from './components/KasBank';
import Iuran from './components/Iuran';
import Aset from './components/Aset';
import Laporan from './components/Laporan';
import Pengguna from './components/Pengguna';
import Audit from './components/Audit';
import { notifications } from './data/mockData';

const menuLabels: Record<string, string> = {
  'dashboard': 'Dashboard',
  'penerimaan': 'Penerimaan',
  'pengeluaran': 'Pengeluaran',
  'anggaran': 'Anggaran',
  'kas-bank': 'Kas & Bank',
  'iuran': 'Iuran Warga',
  'aset': 'Inventaris & Aset',
  'laporan': 'Laporan',
  'pengguna': 'Pengguna',
  'audit': 'Audit Trail',
};

function App() {
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const renderContent = () => {
    switch (activeMenu) {
      case 'dashboard': return <Dashboard />;
      case 'penerimaan': return <Transactions type="penerimaan" />;
      case 'pengeluaran': return <Transactions type="pengeluaran" />;
      case 'anggaran': return <Anggaran />;
      case 'kas-bank': return <KasBank />;
      case 'iuran': return <Iuran />;
      case 'aset': return <Aset />;
      case 'laporan': return <Laporan />;
      case 'pengguna': return <Pengguna />;
      case 'audit': return <Audit />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Sidebar - Desktop */}
      <div className="hidden lg:block">
        <Sidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} collapsed={sidebarCollapsed} />
      </div>

      {/* Sidebar - Mobile */}
      <div className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 lg:hidden ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar activeMenu={activeMenu} setActiveMenu={(menu) => { setActiveMenu(menu); setMobileMenuOpen(false); }} collapsed={false} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-4 lg:px-6 py-3 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Desktop sidebar toggle */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden lg:block p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumb */}
            <nav className="flex items-center gap-1 text-sm">
              <span className="text-gray-400">Sistem Keuangan RW</span>
              <ChevronRight className="w-4 h-4 text-gray-300" />
              <span className="text-gray-800 font-medium">{menuLabels[activeMenu]}</span>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="hidden md:flex items-center">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari transaksi, warga..."
                  className="pl-10 pr-4 py-2 w-64 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>
            </div>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg relative"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {notifications.length}
                </span>
              </button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50">
                  <div className="p-4 border-b border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-800">Notifikasi</h3>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.map((notif) => (
                      <div key={notif.id} className="p-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer">
                        <div className="flex items-start gap-2">
                          <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0
                            ${notif.type === 'warning' ? 'bg-yellow-500' :
                              notif.type === 'info' ? 'bg-blue-500' :
                              notif.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
                          </div>
                          <div>
                            <p className="text-sm text-gray-700">{notif.message}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{notif.time}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 border-t border-gray-100 text-center">
                    <button className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">Lihat Semua Notifikasi</button>
                  </div>
                </div>
              )}
            </div>

            {/* User Avatar */}
            <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
              <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-medium">SW</span>
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-medium text-gray-800">Sri Wahyuni</p>
                <p className="text-xs text-gray-500">Bendahara</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
          {renderContent()}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 px-6 py-3">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <p>© 2024 Sistem Keuangan RW 05 - Kelurahan Sukamaju</p>
            <p>v1.0.0 | Terakhir diperbarui: 6 Desember 2024</p>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
