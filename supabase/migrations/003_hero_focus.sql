-- Where the child's face is in the main photo (percent), so every crop of the hero keeps it in view.
alter table public.achievers add column if not exists hero_x int not null default 50 check (hero_x between 0 and 100);
alter table public.achievers add column if not exists hero_y int not null default 35 check (hero_y between 0 and 100);
