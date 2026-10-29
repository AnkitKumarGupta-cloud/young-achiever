-- Tracks when ratings were last refreshed from FIDE.
alter table public.achievers add column if not exists fide_synced_at timestamptz;
