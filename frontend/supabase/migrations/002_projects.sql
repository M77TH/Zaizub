-- 002_projects.sql: User video projects
-- Owner key: projects.user_id = auth.users.id (= auth.uid())

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null default 'โปรเจกต์ไม่มีชื่อ',
  status text not null default 'draft' check (status in ('draft', 'done', 'processing')),
  duration text,
  video_url text,
  video_filename text,
  thumbnail_url text,
  subtitles jsonb not null default '[]'::jsonb,
  styles jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.projects enable row level security;

create policy "projects_select_own"
  on public.projects
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "projects_insert_own"
  on public.projects
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "projects_update_own"
  on public.projects
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "projects_delete_own"
  on public.projects
  for delete
  to authenticated
  using (auth.uid() = user_id);

grant select, insert, update, delete on public.projects to authenticated;
