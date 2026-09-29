import React, { useState } from 'react';
import { Lock, Mail, Loader2, Users, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface LoginProps {
  onAuthenticated: () => void;
  onPublicMode: () => void;
}

const Login: React.FC<LoginProps> = ({ onAuthenticated, onPublicMode }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (!email || !password) throw new Error('Email dan password wajib diisi.');
      if (password.length < 6) throw new Error('Password minimal 6 karakter.');

      if (mode === 'login') {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw new Error(signInError.message);
        onAuthenticated();
      } else {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name || email.split('@')[0] } },
        });
        if (signUpError) throw new Error(signUpError.message);
        if (data.session) {
          onAuthenticated();
        } else {
          setMessage('Pendaftaran berhasil. Jika Supabase meminta verifikasi email, cek email lalu login kembali.');
          setMode('login');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memproses login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <div className="bg-white/10 border border-white/20 rounded-3xl p-8 text-white shadow-2xl backdrop-blur">
          <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-6">
            <span className="text-emerald-800 font-bold text-xl">RW</span>
          </div>
          <h1 className="text-3xl font-bold mb-3">Sistem Kas RW 07</h1>
          <p className="text-emerald-100 leading-relaxed mb-8">
            Aplikasi pengelolaan kas, iuran warga, penerimaan, pengeluaran, aset, laporan, dan audit trail RW 07.
          </p>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-200 mt-0.5" />
              <div>
                <p className="font-semibold">Mode Pengurus</p>
                <p className="text-sm text-emerald-100">Login untuk input dan mengelola data keuangan.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-emerald-200 mt-0.5" />
              <div>
                <p className="font-semibold">Mode Warga</p>
                <p className="text-sm text-emerald-100">Tanpa login untuk melihat ringkasan informasi publik.</p>
              </div>
            </div>
          </div>
          <button
            onClick={onPublicMode}
            className="mt-8 w-full bg-white text-emerald-800 py-3 rounded-xl font-semibold hover:bg-emerald-50 transition-colors flex items-center justify-center gap-2"
          >
            <Users className="w-5 h-5" /> Masuk Mode Warga Tanpa Login
          </button>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-2xl">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800">{mode === 'login' ? 'Login Pengurus' : 'Daftar Akun Pengurus'}</h2>
            <p className="text-gray-500 text-sm mt-1">
              {mode === 'login' ? 'Masukkan email dan password Supabase Auth.' : 'Buat akun awal jika signup di Supabase diaktifkan.'}
            </p>
          </div>

          {message && <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-700 px-3 py-2 rounded-lg text-sm">{message}</div>}
          {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Nama pengurus"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div className="relative">
                <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="bendahara@rw07.id"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-12 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Minimal 6 karakter"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <button
              disabled={loading}
              className="w-full bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-5 h-5 animate-spin" />}
              {mode === 'login' ? 'Login' : 'Daftar'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null); setMessage(null); }}
              className="text-sm text-emerald-700 hover:text-emerald-800 font-medium"
            >
              {mode === 'login' ? 'Belum punya akun? Daftar pengurus' : 'Sudah punya akun? Login'}
            </button>
          </div>

          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-xs text-yellow-800">
            Untuk produksi, buat akun pengurus dari Supabase Authentication dan atur RLS sesuai role.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
