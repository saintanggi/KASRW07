import React from 'react';
import { UserCog, Plus, Edit, Trash2, Shield, Eye, Lock } from 'lucide-react';
import { usersData } from '../data/mockData';

const Pengguna: React.FC = () => {
  const roleColors: Record<string, string> = {
    'Ketua RW': 'bg-purple-100 text-purple-700',
    'Bendahara': 'bg-blue-100 text-blue-700',
    'Pengurus RT': 'bg-emerald-100 text-emerald-700',
    'Auditor': 'bg-amber-100 text-amber-700',
    'Warga': 'bg-gray-100 text-gray-700',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center">
            <UserCog className="w-6 h-6 text-violet-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Pengguna & Hak Akses</h1>
            <p className="text-gray-500 text-sm">Kelola pengguna, peran, dan hak akses sistem</p>
          </div>
        </div>
        <button className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Tambah Pengguna
        </button>
      </div>

      {/* Role Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {Object.entries(roleColors).map(([role, color]) => (
          <div key={role} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${color}`}>{role}</span>
            <p className="text-2xl font-bold text-gray-800 mt-2">{usersData.filter(u => u.role === role).length}</p>
            <p className="text-xs text-gray-500">pengguna</p>
          </div>
        ))}
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="text-left text-xs text-gray-500 uppercase">
                <th className="px-4 py-3 font-medium">Nama</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Peran</th>
                <th className="px-4 py-3 font-medium">RT</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Login Terakhir</th>
                <th className="px-4 py-3 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {usersData.map((user) => (
                <tr key={user.id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-violet-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-violet-600">{user.nama.split(' ').map(n => n[0]).join('').slice(0, 2)}</span>
                      </div>
                      <span className="text-sm font-medium text-gray-800">{user.nama}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{user.email}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${roleColors[user.role]}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{user.rt}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-green-100 text-green-700 font-medium">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{user.lastLogin}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Lihat Detail">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors" title="Edit">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors" title="Hak Akses">
                        <Shield className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Nonaktifkan">
                        <Lock className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Permissions Matrix */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800">Matriks Hak Akses</h3>
          <p className="text-sm text-gray-500 mt-1">Konfigurasi akses per peran dalam sistem</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="text-left text-xs text-gray-500 uppercase">
                <th className="px-4 py-3 font-medium">Modul</th>
                <th className="px-4 py-3 font-medium text-center">Ketua RW</th>
                <th className="px-4 py-3 font-medium text-center">Bendahara</th>
                <th className="px-4 py-3 font-medium text-center">Sekretaris</th>
                <th className="px-4 py-3 font-medium text-center">Pengurus RT</th>
                <th className="px-4 py-3 font-medium text-center">Auditor</th>
                <th className="px-4 py-3 font-medium text-center">Warga</th>
              </tr>
            </thead>
            <tbody>
              {[
                { modul: 'Dashboard', akses: ['✅', '✅', '✅', '✅', '✅', '⚡'] },
                { modul: 'Penerimaan', akses: ['✅', '✅', '📎', '📤', '👁', '👁'] },
                { modul: 'Pengeluaran', akses: ['✅', '✅', '📎', '📤', '👁', '❌'] },
                { modul: 'Approval', akses: ['✅', '❌', '❌', '❌', '❌', '❌'] },
                { modul: 'Anggaran', akses: ['✅', '✅', '👁', '❌', '👁', '❌'] },
                { modul: 'Kas & Bank', akses: ['✅', '✅', '❌', '❌', '👁', '❌'] },
                { modul: 'Iuran', akses: ['✅', '✅', '📎', '📤', '👁', '⚡'] },
                { modul: 'Laporan', akses: ['✅', '✅', '✅', '❌', '✅', '⚡'] },
                { modul: 'Audit Trail', akses: ['✅', '❌', '❌', '❌', '✅', '❌'] },
              ].map((row) => (
                <tr key={row.modul} className="border-t border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-800">{row.modul}</td>
                  {row.akses.map((a, i) => (
                    <td key={i} className="px-4 py-3 text-center text-sm">{a}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 bg-gray-50 border-t border-gray-100">
          <p className="text-xs text-gray-500">✅ = Akses penuh | 📎 = Upload lampiran | 📤 = Input/Usul | 👁 = Hanya lihat | ⚡ = Akses terbatas | ❌ = Tidak punya akses</p>
        </div>
      </div>
    </div>
  );
};

export default Pengguna;
