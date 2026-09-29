import React, { useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { Menu, Bell, Search, ChevronRight, Loader2, ShieldAlert } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import Anggaran from './components/Anggaran';
import KasBank from './components/KasBank';
import Warga from './components/Warga';
import Iuran from './components/Iuran';
import Aset from './components/Aset';
import Laporan from './components/Laporan';
import Pengguna from './components/Pengguna';
import Audit from './components/Audit';
import Login from './components/Login';
import PublicPortal from './components/PublicPortal';
import { notifications as defaultNotifications } from './data/mockData';
import { supabase } from './lib/supabase';
import { explainRole, getDefaultMenu, getPermissions } from './lib/permissions';

const menuLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  penerimaan: 'Penerimaan',
  pengeluaran: 'Pengeluaran',
  anggaran: 'Anggaran',
  'kas-bank': 'Kas & Bank',
  warga: 'Data Warga',
  iuran: 'Iuran Warga',
  aset: 'Inventaris & Aset',
  laporan: 'Laporan',
  pengguna: 'Pengguna',
  audit: 'Audit Trail',
};

type UserProfile = {
  id: string;
  nama: string;
  email: string;
  role_id: number | null;
  rt_id: number | null;
  roleName: string;
  nomorRt?: string;
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

async function loadUserProfile(session: Session | null): Promise<UserProfile | null> {
  const user = session?.user;
  if (!user?.email) return null;

  const [userRes, rolesRes, rtsRes] = await Promise.all([
    supabase.from('users').select('*').eq('email', user.email).maybeSingle(),
    supabase.from('roles').select('id,nama_role'),
    supabase.from('rts').select('id,nomor_rt'),
  ]);

  const row = userRes.data as any;
  if (!row) {
    return {
      id: user.id,
      nama: (user.user_metadata?.full_name as string) || user.email.split('@')[0],
      email: user.email,
      role_id: null,
      rt_id: null,
      roleName: 'Tanpa Role',
    };
  }

  const roleMap = new Map((rolesRes.data || []).map((role: any) => [Number(role.id), role.nama_role]));
  const rtMap = new Map((rtsRes.data || []).map((rt: any) => [Number(rt.id), rt.nomor_rt]));

  return {
    id: row.id,
    nama: row.nama || user.email,
    email: row.email || user.email,
    role_id: row.role_id,
    rt_id: row.rt_id,
    roleName: roleMap.get(Number(row.role_id)) || 'Tanpa Role',
    nomorRt: rtMap.get(Number(row.rt_id)),
  };
}

function App() {
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [publicMode, setPublicMode] = useState(false);
  const [headerNotifications, setHeaderNotifications] = useState(defaultNotifications);

  const permissions = useMemo(() => getPermissions(profile?.roleName), [profile?.roleName]);

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(data.session);
      if (data.session) {
        await ensureUserProfile(data.session);
        const loadedProfile = await loadUserProfile(data.session);
        if (mounted) setProfile(loadedProfile);
      }
      setAuthLoading(false);
    }

    bootstrap();

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession);
      if (nextSession) {
        setPublicMode(false);
        await ensureUserProfile(nextSession);
        const loadedProfile = await loadUserProfile(nextSession);
        setProfile(loadedProfile);
      } else {
        setProfile(null);
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!profile) return;
    if (!permissions.allowedMenus.includes(activeMenu)) {
      setActiveMenu(getDefaultMenu(profile.roleName));
    }
  }, [activeMenu, permissions.allowedMenus, profile]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
    setActiveMenu('dashboard');
    setPublicMode(false);
  };

  const renderContent = () => {
    if (!permissions.canViewMenu(activeMenu)) {
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 flex items-start gap-3">
          <ShieldAlert className="w-6 h-6 text-yellow-600 mt-0.5" />
          <div>
            <h2 className="font-bold text-yellow-800">Akses menu dibatasi</h2>
            <p className="text-sm text-yellow-700 mt-1">Role Anda ({profile?.roleName || 'Tanpa Role'}) tidak memiliki akses ke menu ini.</p>
          </div>
        </div>
      );
    }

    switch (activeMenu) {
      case 'dashboard': return <Dashboard onNavigate={setActiveMenu} permissions={permissions} />;
      case 'penerimaan': return <Transactions type="penerimaan" permissions={permissions} />;
      case 'pengeluaran': return <Transactions type="pengeluaran" permissions={permissions} />;
      case 'anggaran': return <Anggaran permissions={permissions} />;
      case 'kas-bank': return <KasBank permissions={permissions} />;
      case 'warga': return <Warga permissions={permissions} />;
      case 'iuran': return <Iuran permissions={permissions} />;
      case 'aset': return <Aset permissions={permissions} />;
      case 'laporan': return <Laporan />;
      case 'pengguna': return <Pengguna permissions={permissions} />;
      case 'audit': return <Audit />;
      default: return <Dashboard onNavigate={setActiveMenu} permissions={permissions} />;
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

  const displayName = profile?.nama || session.user.user_metadata?.full_name || session.user.email || 'Pengurus RW 07';
  const initials = String(displayName).split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
  const notificationCount = headerNotifications.length;

  const dismissNotification = (id: number) => {
    setHeaderNotifications((items) => items.filter((item) => item.id !== id));
  };

  const clearNotifications = () => {
    setHeaderNotifications([]);
    setShowNotifications(false);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileMenuOpen(false)} />
      )}

      <div className="hidden lg:block">
        <Sidebar
          activeMenu={activeMenu}
          setActiveMenu={setActiveMenu}
          collapsed={sidebarCollapsed}
          onLogout={handleLogout}
          allowedMenus={permissions.allowedMenus}
          roleName={profile?.roleName}
          userName={displayName}
        />
      </div>

      <div className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 lg:hidden ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar
          activeMenu={activeMenu}
          setActiveMenu={(menu) => { setActiveMenu(menu); setMobileMenuOpen(false); }}
          collapsed={false}
          onLogout={handleLogout}
          allowedMenus={permissions.allowedMenus}
          roleName={profile?.roleName}
          userName={displayName}
        />
      </div>

      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-4 lg:px-6 py-3 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
              <Menu className="w-5 h-5" />
            </button>

            <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="hidden lg:block p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
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
                <input type="text" placeholder="Cari transaksi, warga..." className="pl-10 pr-4 py-2 w-64 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white" />
              </div>
            </div>

            <div className="relative">
              <button onClick={() => setShowNotifications(!showNotifications)} className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg relative">
                <Bell className="w-5 h-5" />
                {notificationCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-4 h-4 px-1 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">{notificationCount}</span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50">
                  <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-800">Notifikasi</h3>
                    {notificationCount > 0 && <button onClick={clearNotifications} className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">Tandai dibaca</button>}
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notificationCount === 0 ? (
                      <div className="p-6 text-center text-sm text-gray-500">Belum ada notifikasi baru.</div>
                    ) : (
                      headerNotifications.map((notif) => (
                        <button key={notif.id} onClick={() => dismissNotification(notif.id)} className="w-full text-left p-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer" title="Klik untuk menghapus notifikasi ini">
                          <div className="flex items-start gap-2">
                            <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${notif.type === 'warning' ? 'bg-yellow-500' : notif.type === 'info' ? 'bg-blue-500' : notif.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            <div>
                              <p className="text-sm text-gray-700">{notif.message}</p>
                              <p className="text-xs text-gray-400 mt-0.5">{notif.time}</p>
                            </div>
                          </div>
                        </button>
                      ))
                    )}
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
                <p className="text-xs text-gray-500">{profile?.roleName || 'Tanpa Role'}{profile?.nomorRt ? ` • ${profile.nomorRt}` : ''}</p>
              </div>
            </div>
          </div>
        </header>

        {profile && (
          <div className="bg-blue-50 border-b border-blue-100 px-4 lg:px-6 py-2 text-xs text-blue-700">
            Role aktif: <b>{profile.roleName}</b> — {explainRole(profile.roleName)}
          </div>
        )}

        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">{renderContent()}</main>

        <footer className="bg-white border-t border-gray-200 px-6 py-3">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <p>© 2026 Sistem Kas RW 07</p>
            <p>v4.0.0 | Role Access + Approval</p>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
