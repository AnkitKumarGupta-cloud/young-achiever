-- Young Achievers: schema, Row Level Security, storage policies.
-- Run in the Supabase SQL editor (or `supabase db push`).

create extension if not exists pgcrypto;

-- ───────────────────────── tables ─────────────────────────

create table public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  username   text not null unique,
  role       text not null default 'parent' check (role in ('admin', 'parent')),
  created_at timestamptz not null default now()
);

create table public.achievers (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null unique references public.profiles(id) on delete cascade,
  slug          text not null unique,
  full_name     text not null,
  bio           text not null default '',
  fide_id       text check (fide_id is null or fide_id ~ '^[0-9]{1,10}$'),
  fide_standard int  check (fide_standard between 0 and 3500),
  fide_rapid    int  check (fide_rapid    between 0 and 3500),
  fide_blitz    int  check (fide_blitz    between 0 and 3500),
  published     boolean not null default false,
  taken_down    boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table public.other_ratings (
  id          uuid primary key default gen_random_uuid(),
  achiever_id uuid not null references public.achievers(id) on delete cascade,
  label       text not null check (char_length(label) between 1 and 80),
  value       text not null check (char_length(value) between 1 and 40),
  sort        int  not null default 0
);

create table public.tournament_results (
  id          uuid primary key default gen_random_uuid(),
  achiever_id uuid not null references public.achievers(id) on delete cascade,
  year        int  not null check (year between 1990 and 2100),
  event       text not null check (char_length(event) between 1 and 160),
  result      text not null check (char_length(result) between 1 and 160),
  sort        int  not null default 0
);

create table public.photos (
  id          uuid primary key default gen_random_uuid(),
  achiever_id uuid not null references public.achievers(id) on delete cascade,
  path        text not null,
  caption     text check (caption is null or char_length(caption) <= 140),
  sort        int  not null default 0,
  created_at  timestamptz not null default now()
);

create index on public.other_ratings (achiever_id);
create index on public.tournament_results (achiever_id);
create index on public.photos (achiever_id);

-- ───────────────────────── helpers ─────────────────────────

create or replace function public.is_admin()
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- Parents may never change ownership, slug or take-down state, and may not
-- (re)publish a page the admin took down. The service role (auth.uid() is null)
-- and admins are unrestricted.
create or replace function public.achievers_guard()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.updated_at := now();
  if auth.uid() is not null and not public.is_admin() then
    new.owner_id   := old.owner_id;
    new.slug       := old.slug;
    new.taken_down := old.taken_down;
    if old.taken_down then
      new.published := false;
    end if;
  end if;
  return new;
end $$;

create trigger achievers_guard before update on public.achievers
  for each row execute function public.achievers_guard();

-- ───────────────────────── RLS ─────────────────────────

alter table public.profiles           enable row level security;
alter table public.achievers          enable row level security;
alter table public.other_ratings      enable row level security;
alter table public.tournament_results enable row level security;
alter table public.photos             enable row level security;

-- profiles: read your own row (admin reads all). No client writes at all.
create policy profiles_select on public.profiles for select
  using (id = auth.uid() or public.is_admin());

-- achievers: public sees only live pages; owner sees own; admin sees all.
-- Inserts/deletes happen only via the service role (server code).
create policy achievers_select on public.achievers for select
  using ((published and not taken_down) or owner_id = auth.uid() or public.is_admin());

create policy achievers_update on public.achievers for update
  using (owner_id = auth.uid() or public.is_admin())
  with check (owner_id = auth.uid() or public.is_admin());

-- child tables: you can read a row iff you can read its achiever (that table's RLS applies
-- inside the subquery). Only the owning parent can write.
create policy other_ratings_select on public.other_ratings for select
  using (exists (select 1 from public.achievers a where a.id = achiever_id));
create policy other_ratings_write on public.other_ratings for all
  using      (exists (select 1 from public.achievers a where a.id = achiever_id and a.owner_id = auth.uid()))
  with check (exists (select 1 from public.achievers a where a.id = achiever_id and a.owner_id = auth.uid()));

create policy results_select on public.tournament_results for select
  using (exists (select 1 from public.achievers a where a.id = achiever_id));
create policy results_write on public.tournament_results for all
  using      (exists (select 1 from public.achievers a where a.id = achiever_id and a.owner_id = auth.uid()))
  with check (exists (select 1 from public.achievers a where a.id = achiever_id and a.owner_id = auth.uid()));

create policy photos_select on public.photos for select
  using (exists (select 1 from public.achievers a where a.id = achiever_id));
create policy photos_write on public.photos for all
  using      (exists (select 1 from public.achievers a where a.id = achiever_id and a.owner_id = auth.uid()))
  with check (exists (select 1 from public.achievers a where a.id = achiever_id and a.owner_id = auth.uid()));

-- ───────────────────────── storage ─────────────────────────
-- Private bucket. Objects live at <achiever_id>/<uuid>.jpg. The public page uses signed URLs,
-- which only work while the achiever row is visible, so taking a page down also cuts off its photos.

insert into storage.buckets (id, name, public) values ('photos', 'photos', false)
  on conflict (id) do nothing;

create policy photos_obj_select on storage.objects for select
  using (bucket_id = 'photos'
         and exists (select 1 from public.achievers a where a.id::text = (storage.foldername(name))[1]));

create policy photos_obj_insert on storage.objects for insert
  with check (bucket_id = 'photos'
         and exists (select 1 from public.achievers a
                     where a.id::text = (storage.foldername(name))[1] and a.owner_id = auth.uid()));

create policy photos_obj_delete on storage.objects for delete
  using (bucket_id = 'photos'
         and exists (select 1 from public.achievers a
                     where a.id::text = (storage.foldername(name))[1] and a.owner_id = auth.uid()));
