-- User profiles
create table profiles (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  first_name  text,
  last_name   text,
  department  text,
  bio         text,
  avatar_url  text,
  updated_at  timestamptz not null default now()
);

create trigger profiles_updated_at
  before update on profiles
  for each row execute function set_updated_at();

alter table profiles enable row level security;

create policy "profiles readable by authed users"
  on profiles for select
  to authenticated
  using (true);

create policy "users can insert own profile"
  on profiles for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "users can update own profile"
  on profiles for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Auto-create profile row on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Backfill any existing users
insert into public.profiles (user_id)
select id from auth.users
on conflict (user_id) do nothing;
