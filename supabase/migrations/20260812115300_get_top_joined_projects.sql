create or replace function public.get_top_joined_projects()
returns table (
  project_id uuid,
  name text,
  logo_url text,
  user_count bigint
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  return query
  select
    p.id as project_id,
    p.name,
    p.logo_url,
    count(tup.auth_id) as user_count
  from public.projects as p
  join public.tracker_user_projects as tup on p.id = tup.project_id
  group by p.id, p.name, p.logo_url
  order by count(tup.auth_id) desc
  limit 5;
end;
$$;

revoke all on function public.get_top_joined_projects() from public;
revoke all on function public.get_top_joined_projects() from anon;
grant execute on function public.get_top_joined_projects() to authenticated;