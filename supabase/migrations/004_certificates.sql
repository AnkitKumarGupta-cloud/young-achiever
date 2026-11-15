-- Certificates are stored like photos (same private bucket, same RLS), marked with kind = 'certificate'.
alter table public.photos add column if not exists kind text not null default 'photo'
  check (kind in ('photo', 'certificate'));
alter table public.photos drop constraint if exists photos_caption_check;
alter table public.photos add constraint photos_caption_check
  check (caption is null or char_length(caption) <= 160);
