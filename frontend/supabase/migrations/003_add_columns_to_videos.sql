-- Run this in Supabase SQL Editor:
alter table public.videos add column if not exists styles jsonb not null default '{}'::jsonb;
alter table public.videos add column if not exists video_filename text;
alter table public.videos add column if not exists status text not null default 'draft';
