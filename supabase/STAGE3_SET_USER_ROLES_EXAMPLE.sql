-- =========================================================
-- CONTOH SET ROLE USER - STAGE 3 ROLE ACCESS
-- Jalankan di Supabase SQL Editor setelah user register/login.
-- Ganti email sesuai akun yang dipakai.
-- =========================================================

-- 1) Lihat daftar user dan role saat ini
SELECT
  u.email,
  u.nama,
  r.nama_role AS role,
  rt.nomor_rt AS rt,
  u.is_active,
  u.last_login
FROM users u
LEFT JOIN roles r ON r.id = u.role_id
LEFT JOIN rts rt ON rt.id = u.rt_id
ORDER BY u.created_at DESC;

-- 2) Jadikan user sebagai Super Admin
-- UPDATE users
-- SET role_id = (SELECT id FROM roles WHERE nama_role = 'Super Admin'),
--     rt_id = NULL
-- WHERE email = 'email-admin@example.com';

-- 3) Jadikan user sebagai Ketua RW
-- UPDATE users
-- SET role_id = (SELECT id FROM roles WHERE nama_role = 'Ketua RW'),
--     rt_id = NULL
-- WHERE email = 'ketua-rw@example.com';

-- 4) Jadikan user sebagai Bendahara
-- UPDATE users
-- SET role_id = (SELECT id FROM roles WHERE nama_role = 'Bendahara'),
--     rt_id = NULL
-- WHERE email = 'bendahara@example.com';

-- 5) Jadikan user sebagai Pengurus RT 01
-- UPDATE users
-- SET role_id = (SELECT id FROM roles WHERE nama_role = 'Pengurus RT'),
--     rt_id = (SELECT id FROM rts WHERE nomor_rt = 'RT 01')
-- WHERE email = 'pengurus-rt01@example.com';

-- 6) Jadikan user sebagai Auditor
-- UPDATE users
-- SET role_id = (SELECT id FROM roles WHERE nama_role = 'Auditor'),
--     rt_id = NULL
-- WHERE email = 'auditor@example.com';

-- 7) Refresh cache PostgREST setelah update massal bila diperlukan
NOTIFY pgrst, 'reload schema';
