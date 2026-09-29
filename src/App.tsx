import React, { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { Menu, Bell, Search, ChevronRight, Loader2 } from 'lucide-react';
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
import Login from './components/Login';
import PublicPortal from './components/PublicPortal';
import { notifications } from './data/mockData';
import { supabase } from './lib/supabase';

const menuLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  penerimaan: 'Penerimaan',
  pengeluaran: 'Pengeluaran',
  anggaran: 'Anggaran',
  'kas-bank': 'Kas & Bank',
  iuran: 'Iuran Warga',
  aset: 'Inventaris & Aset',
  laporan: 'Laporan',
  pengguna: 'Pengguna',
  audit: 'Audit Trail',
};

async function ensureUserProfile(session: Session | null) {
  const user = session?.user;
  if (!user?.email) return;

  try {
    const { data: existingById } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (existingById) return;

    const { data: existingByEmail } = await supabase
      .from('users')
      .select('id')
      .eq('email', user.email)
      .maybeSingle();

    if (existingByEmail) return;

    const { data: bendaharaRole } = await supabase
      .from('roles')
      .select('id')
      .eq('nama_role', 'Bendahara')
      .maybeSingle();

    await supabase.from('users').insert({
      id: user.id,
      nama: (user.user_metadata?.full_name as string) || user.email.split('@')[0],
      email: user.email,
      password_hash: 'supabase-auth',
      role_id: bendaharaRole?.id || null,
      is_active: true,
      last_login: new Date().toISOString(),
    });
  } catch (error) {
    console.warn('Gagal membuat profil user otomatis:', error);
  }
}

function App() {
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [publicMode, setPublicMode] = useState(false);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      if (data.session) await ensureUserProfile(data.session);
      setAuthLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession);
      if (nextSession) {
        setPublicMode(false);
        await ensureUserProfile(nextSession);
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setActiveMenu('dashboard');
    setPublicMode(false);
  };

  const renderContent = () => {
    switch (activeMenu) {
      case 'dashboard': return <Dashboard onNavigate={setActiveMenu} />;
      case 'penerimaan': return <Transactions type="penerimaan" />;
      case 'pengeluaran': return <Transactions type="pengeluaran" />;
      case 'anggaran': return <Anggaran />;
      case 'kas-bank': return <KasBank />;
      case 'iuran': return <Iuran />;
      case 'aset': return <Aset />;
      case 'laporan': return <Laporan />;
      case 'pengguna': return <Pengguna />;
      case 'audit': return <Audit />;
      default: return <Dashboard onNavigate={setActiveMenu} />;
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mx-auto mb-3" />
          <p className="text-gray-600 font-medium">Memeriksa sesi login...</p>
        </div>
      </div>
    );
  }

  if (!session && publicMode) {
    return <PublicPortal onBackToLogin={() => setPublicMode(false)} />;
  }

  if (!session) {
    return <Login onAuthenticated={() => setPublicMode(false)} onPublicMode={() => setPublicMode(true)} />;
  }

  const displayName = session.user.user_metadata?.full_name || session.user.email || 'Pengurus RW 07';
  const initials = String(displayName).split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="flex min-h-screen bg-gray-50">
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileMenuOpen(false)} />
      )}

      <div className="hidden lg:block">
        <Sidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} collapsed={sidebarCollapsed} onLogout={handleLogout} />
      </div>

      <div className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 lg:hidden ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar activeMenu={activeMenu} setActiveMenu={(menu) => { setActiveMenu(menu); setMobileMenuOpen(false); }} collapsed={false} onLogout={handleLogout} />
      </div>

      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-4 lg:px-6 py-3 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>

            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden lg:block p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>

            <nav className="flex items-center gap-1 text-sm">
              <span className="text-gray-400">Sistem Kas RW 07</span>
              <ChevronRight className="w-4 h-4 text-gray-300" />
              <span className="text-gray-800 font-medium">{menuLabels[activeMenu]}</span>
            </nav>
          </div>

          <div className="flex items-center gap-3">
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
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
              <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-medium">{initials}</span>
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-medium text-gray-800 max-w-[160px] truncate">{String(displayName)}</p>
                <p className="text-xs text-gray-500">Pengurus RW 07</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
          {renderContent()}
        </main>

        <footer className="bg-white border-t border-gray-200 px-6 py-3">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <p>© 2026 Sistem Kas RW 07</p>
            <p>v3.0.0 | Login + Mode Warga</p>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
