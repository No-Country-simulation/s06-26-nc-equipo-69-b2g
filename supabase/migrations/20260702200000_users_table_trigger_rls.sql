-- App users profile table, synced from auth.users on signup.
-- The table and trigger were created manually in the remote project during
-- feat/google-auth (PR #36); this migration makes them reproducible AND fixes
-- the critical gap: the table had RLS disabled, leaving 200k-user PII readable
-- and writable with the public anon key.

create table if not exists public.users (
  id          uuid primary key,
  email       text,
  first_name  text,
  last_name   text,
  avatar_url  text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create or replace function public.sync_user_from_auth()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  insert into public.users (id, email, first_name, last_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'given_name',
    new.raw_user_meta_data ->> 'family_name',
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.sync_user_from_auth();

-- RLS: no anon access at all; authenticated users read only their own row.
-- The backend reads/repairs profiles with the service role (bypasses RLS).
alter table public.users enable row level security;

drop policy if exists "users read own profile" on public.users;
create policy "users read own profile" on public.users
  for select to authenticated using ((select auth.uid()) = id);
