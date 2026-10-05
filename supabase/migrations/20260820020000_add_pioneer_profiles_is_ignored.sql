alter table public.pioneer_profiles
  add column if not exists is_ignored boolean not null default false;

create index if not exists pioneer_profiles_daily_tasks_idx
  on public.pioneer_profiles (pioneer_type, is_ignored);