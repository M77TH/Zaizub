-- 003_add_columns_to_videos.sql: Canonical schema and RLS policies for public.videos
-- Safe to run idempotently on both fresh databases and existing deployments.

create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null default 'โปรเจกต์ไม่มีชื่อ',
  video_url text not null default '',
  thumbnail_url text,
  duration numeric,
  subtitles jsonb not null default '[]'::jsonb,
  status text default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.videos add column if not exists title text not null default 'โปรเจกต์ไม่มีชื่อ';
alter table public.videos add column if not exists video_url text not null default '';
alter table public.videos add column if not exists thumbnail_url text;
alter table public.videos add column if not exists duration numeric;
alter table public.videos add column if not exists subtitles jsonb not null default '[]'::jsonb;
alter table public.videos add column if not exists status text default 'draft';
alter table public.videos add column if not exists created_at timestamptz not null default now();
alter table public.videos add column if not exists updated_at timestamptz not null default now();

create index if not exists idx_videos_user_updated_at
  on public.videos (user_id, updated_at desc);

alter table public.videos enable row level security;

drop policy if exists "videos_select_own" on public.videos;
create policy "videos_select_own"
  on public.videos
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "videos_insert_own" on public.videos;
create policy "videos_insert_own"
  on public.videos
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "videos_update_own" on public.videos;
create policy "videos_update_own"
  on public.videos
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "videos_delete_own" on public.videos;
create policy "videos_delete_own"
  on public.videos
  for delete
  to authenticated
  using (auth.uid() = user_id);

grant select, insert, update, delete on public.videos to authenticated;
