-- ============================================
-- PORTO CMS - Part 5: FIX KEAMANAN RLS
-- Jalankan SEKALI di project Supabase yang SUDAH ADA
-- (opsional jika pakai setup-all.sql dari awal)
--
-- Masalah lama: policy "public_read_users/settings/activity_logs"
-- membuka hash password, API key (openrouter_api_key), dan IP ke publik.
-- Anon key itu publik — siapa pun bisa membaca tabel-tabel sensitif.
-- Solusi: hapus policy tersebut. Semua akses tetap jalan karena
-- Next.js memakai service role (bypass RLS).
-- ============================================

drop policy if exists "public_read_users" on public.users;
drop policy if exists "public_read_settings" on public.settings;
drop policy if exists "public_read_activity" on public.activity_logs;

-- Opsional: pastikan tabel sensitif benar-benar terkunci (RLS aktif tanpa policy)
alter table public.users enable row level security;
alter table public.settings enable row level security;
alter table public.activity_logs enable row level security;