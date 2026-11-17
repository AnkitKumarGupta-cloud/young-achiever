-- Monthly FIDE rating history (oldest first), copied from the public FIDE profile for the progress graph.
-- [{"p":"2025-Jul","s":1411,"r":1411,"b":null}, ...]
alter table public.achievers add column if not exists fide_history jsonb;
