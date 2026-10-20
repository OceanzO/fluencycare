-- =====================================================================
-- FluencyCare — Skema Supabase (jalankan di Supabase SQL Editor)
-- =====================================================================

-- ---------- Helper: cek admin dari JWT app_metadata ----------
create or replace function public.is_admin()
returns boolean
language sql stable
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;

-- ---------- Profiles (1:1 dengan auth.users) ----------
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  full_name    text not null default '',
  email        text not null,
  account_type text not null default 'therapist' check (account_type in ('therapist', 'student', 'admin')),
  status       text not null default 'active'    check (status in ('active', 'inactive')),
  created_at   timestamptz not null default now()
);

-- Buat profil otomatis saat user baru mendaftar / diundang.
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, account_type)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.email,
    case when new.raw_app_meta_data ->> 'role' = 'admin' then 'admin'
         when new.raw_user_meta_data ->> 'account_type' = 'student' then 'student'
         else 'therapist' end
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Clients (tanpa nama asli — hanya kode & usia) ----------
create table if not exists public.clients (
  id          uuid primary key default gen_random_uuid(),
  client_code text not null unique,
  age         int  not null check (age between 0 and 120),
  created_at  timestamptz not null default now()
);

-- ---------- Assessments ----------
create table if not exists public.assessments (
  id                  uuid primary key default gen_random_uuid(),
  client_id           uuid not null references public.clients (id) on delete cascade,
  therapist_id        uuid not null default auth.uid() references public.profiles (id) on delete restrict,
  assessment_date     date not null,
  case_history        text not null default '',
  therapist_notes     text not null default '',
  total_syllables     int  not null check (total_syllables > 0),
  stuttered_syllables int  not null check (stuttered_syllables >= 0 and stuttered_syllables <= total_syllables),
  ss_percentage       numeric(5, 2) generated always as
                        (round(stuttered_syllables::numeric / total_syllables::numeric * 100, 2)) stored,
  created_at          timestamptz not null default now()
);
create index if not exists assessments_therapist_idx on public.assessments (therapist_id);
create index if not exists assessments_client_idx on public.assessments (client_id);

-- ---------- Observations (tugas bicara & jenis ketidaklancaran) ----------
create table if not exists public.observations (
  id            uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments (id) on delete cascade,
  category      text not null check (category in ('speech_task', 'disfluency')),
  label         text not null,
  created_at    timestamptz not null default now()
);
create index if not exists observations_assessment_idx on public.observations (assessment_id);

-- ---------- Audio recordings (file di Storage, metadata di sini) ----------
create table if not exists public.audio_recordings (
  id               uuid primary key default gen_random_uuid(),
  assessment_id    uuid not null references public.assessments (id) on delete cascade,
  file_reference   text not null,
  duration_seconds int  not null default 0,
  size_bytes       bigint not null default 0,
  mime_type        text,
  recorded_at      timestamptz not null default now()
);
create index if not exists audio_assessment_idx on public.audio_recordings (assessment_id);

-- ---------- Master data opsi checklist ----------
create table if not exists public.master_options (
  id         uuid primary key default gen_random_uuid(),
  category   text not null check (category in ('speech_task', 'disfluency')),
  label      text not null,
  sort_order int  not null default 0,
  unique (category, label)
);

insert into public.master_options (category, label, sort_order) values
  ('speech_task', 'Bicara spontan', 0),
  ('speech_task', 'Bercerita', 1),
  ('speech_task', 'Menjawab pertanyaan', 2),
  ('speech_task', 'Membaca', 3),
  ('disfluency', 'Pengulangan bunyi/suku kata', 0),
  ('disfluency', 'Pengulangan kata utuh', 1),
  ('disfluency', 'Pengulangan frasa', 2),
  ('disfluency', 'Pemanjangan bunyi (prolongation)', 3),
  ('disfluency', 'Blocking', 4),
  ('disfluency', 'Interjeksi / jeda', 5),
  ('disfluency', 'Perilaku penyerta', 6)
on conflict (category, label) do nothing;

-- =====================================================================
-- Row Level Security
-- =====================================================================
alter table public.profiles         enable row level security;
alter table public.clients          enable row level security;
alter table public.assessments      enable row level security;
alter table public.observations     enable row level security;
alter table public.audio_recordings enable row level security;
alter table public.master_options   enable row level security;

-- Profiles: lihat diri sendiri, admin lihat & ubah semua.
create policy "profiles_select" on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin());
create policy "profiles_admin_update" on public.profiles for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Clients: dipakai bersama oleh tim klinik.
create policy "clients_select" on public.clients for select to authenticated using (true);
create policy "clients_insert" on public.clients for insert to authenticated with check (true);
create policy "clients_update" on public.clients for update to authenticated using (true) with check (true);

-- Assessments: terapis melihat miliknya, admin melihat semua.
create policy "assessments_select" on public.assessments for select to authenticated
  using (therapist_id = auth.uid() or public.is_admin());
create policy "assessments_insert" on public.assessments for insert to authenticated
  with check (therapist_id = auth.uid());

-- Observations & audio mengikuti hak akses asesmen induk.
create policy "observations_select" on public.observations for select to authenticated
  using (exists (select 1 from public.assessments a where a.id = assessment_id
                 and (a.therapist_id = auth.uid() or public.is_admin())));
create policy "observations_insert" on public.observations for insert to authenticated
  with check (exists (select 1 from public.assessments a where a.id = assessment_id and a.therapist_id = auth.uid()));

create policy "audio_select" on public.audio_recordings for select to authenticated
  using (exists (select 1 from public.assessments a where a.id = assessment_id
                 and (a.therapist_id = auth.uid() or public.is_admin())));
create policy "audio_insert" on public.audio_recordings for insert to authenticated
  with check (exists (select 1 from public.assessments a where a.id = assessment_id and a.therapist_id = auth.uid()));

-- Master data: semua bisa baca, hanya admin yang mengubah.
create policy "master_select" on public.master_options for select to authenticated using (true);
create policy "master_admin_insert" on public.master_options for insert to authenticated with check (public.is_admin());
create policy "master_admin_update" on public.master_options for update to authenticated using (public.is_admin());
create policy "master_admin_delete" on public.master_options for delete to authenticated using (public.is_admin());

-- =====================================================================
-- Storage: bucket privat untuk sampel audio
-- Path file: {user_id}/{assessment_id}.webm
-- =====================================================================
insert into storage.buckets (id, name, public)
values ('audio_samples', 'audio_samples', false)
on conflict (id) do nothing;

create policy "audio_upload_own_folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'audio_samples' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "audio_read_own_or_admin" on storage.objects for select to authenticated
  using (bucket_id = 'audio_samples'
         and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

-- =====================================================================
-- Menjadikan sebuah akun sebagai ADMIN (ganti email):
--   update auth.users
--      set raw_app_meta_data = raw_app_meta_data || '{"role":"admin"}'::jsonb
--    where email = 'admin@klinik.id';
--   update public.profiles set account_type = 'admin' where email = 'admin@klinik.id';
-- Pengguna perlu logout & login ulang agar JWT memuat role baru.
-- =====================================================================
