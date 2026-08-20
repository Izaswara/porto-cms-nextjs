-- Porto CMS — Supabase Schema — Part 2: Indexes, Storage, RLS

-- Indexes
create index if not exists activity_logs_user_id_index on public.activity_logs (user_id);
create index if not exists activity_logs_subject_type_subject_id_index on public.activity_logs (subject_type, subject_id);
create index if not exists projects_status_index on public.projects (status);
create index if not exists posts_status_index on public.posts (status);
create index if not exists posts_published_at_index on public.posts (published_at desc);
create index if not exists menus_sort_order_index on public.menus (sort_order);
create index if not exists skills_sort_order_index on public.skills (sort_order);
create index if not exists experiences_sort_order_index on public.experiences (sort_order);
create index if not exists education_sort_order_index on public.education (sort_order);
create index if not exists certificates_sort_order_index on public.certificates (sort_order);
create index if not exists social_media_sort_order_index on public.social_media (sort_order);
create index if not exists translations_locale_index on public.translations (locale);
create index if not exists media_created_at_index on public.media (created_at desc);
create index if not exists activity_logs_created_at_index on public.activity_logs (created_at desc);
create index if not exists galleries_sort_order_index on public.galleries (sort_order);
create index if not exists prompts_slug_index on public.prompts (slug);

-- Storage buckets
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('backups', 'backups', false)
on conflict (id) do nothing;

-- RLS: tables only accessed via Next.js server (service role), so RLS is disabled by default.
-- Storage public bucket 'media' is readable by everyone (public images).

alter table public.users enable row level security;
alter table public.settings enable row level security;
alter table public.hero_sections enable row level security;
alter table public.about_sections enable row level security;
alter table public.projects enable row level security;
alter table public.skills enable row level security;
alter table public.experiences enable row level security;
alter table public.education enable row level security;
alter table public.certificates enable row level security;
alter table public.posts enable row level security;
alter table public.social_media enable row level security;
alter table public.menus enable row level security;
alter table public.translations enable row level security;
alter table public.prompts enable row level security;
alter table public.media enable row level security;
alter table public.activity_logs enable row level security;
alter table public.seos enable row level security;
alter table public.themes enable row level security;
alter table public.galleries enable row level security;

-- SEMUA akses data lewat service role di Next.js server (bypass RLS).
-- Anon key TIDAK dipakai di client, jadi policy publik tidak diperlukan.
-- HANYA konten publik (hero/projects/posts/dll) yang boleh di-read anon;
-- tabel sensitif (users, settings, activity_logs) TIDAK boleh dibuka ke publik
-- karena berisi hash password, API key (openrouter_api_key), dan IP pengunjung.
drop policy if exists "public_read_users" on public.users;
drop policy if exists "public_read_settings" on public.settings;
drop policy if exists "public_read_hero" on public.hero_sections;
drop policy if exists "public_read_about" on public.about_sections;
drop policy if exists "public_read_projects" on public.projects;
drop policy if exists "public_read_skills" on public.skills;
drop policy if exists "public_read_experiences" on public.experiences;
drop policy if exists "public_read_education" on public.education;
drop policy if exists "public_read_certificates" on public.certificates;
drop policy if exists "public_read_posts" on public.posts;
drop policy if exists "public_read_social" on public.social_media;
drop policy if exists "public_read_menus" on public.menus;
drop policy if exists "public_read_translations" on public.translations;
drop policy if exists "public_read_prompts" on public.prompts;
drop policy if exists "public_read_media" on public.media;
drop policy if exists "public_read_activity" on public.activity_logs;
drop policy if exists "public_read_seos" on public.seos;
drop policy if exists "public_read_themes" on public.themes;
drop policy if exists "public_read_galleries" on public.galleries;
drop policy if exists "public_read_media_bucket" on storage.objects;
drop policy if exists "public_read_backups_bucket" on storage.objects;

-- KONTEN PUBLIK (aman untuk dibaca anon): read-only untuk website
create policy "public_read_hero" on public.hero_sections for select using (true);
create policy "public_read_about" on public.about_sections for select using (true);
create policy "public_read_projects" on public.projects for select using (true);
create policy "public_read_skills" on public.skills for select using (true);
create policy "public_read_experiences" on public.experiences for select using (true);
create policy "public_read_education" on public.education for select using (true);
create policy "public_read_certificates" on public.certificates for select using (true);
create policy "public_read_posts" on public.posts for select using (true);
create policy "public_read_social" on public.social_media for select using (true);
create policy "public_read_menus" on public.menus for select using (true);
create policy "public_read_translations" on public.translations for select using (true);
create policy "public_read_prompts" on public.prompts for select using (true);
create policy "public_read_media" on public.media for select using (true);
create policy "public_read_seos" on public.seos for select using (true);
create policy "public_read_themes" on public.themes for select using (true);
create policy "public_read_galleries" on public.galleries for select using (true);

-- TABEL SENSITIF: TIDAK dibuatkan policy publik (anon = tidak bisa baca apa pun,
-- hanya service role yang bisa). users = hash password, settings = API key,
-- activity_logs = IP & aktivitas owner.

-- Storage policies
create policy "public_read_media_bucket" on storage.objects for select using (bucket_id = 'media');
create policy "public_read_backups_bucket" on storage.objects for select using (bucket_id = 'backups' and (auth.role() = 'authenticated'));