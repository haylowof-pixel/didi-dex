create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text not null default '',
  avatar_url text not null default '',
  default_tribe_name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tribes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  invite_code text not null unique,
  plan_id text not null default 'free',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists avatar_url text not null default '';

create table if not exists public.tribe_members (
  tribe_id uuid not null references public.tribes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null default '',
  role text not null default 'member' check (role in ('owner', 'officer', 'member')),
  created_at timestamptz not null default now(),
  primary key (tribe_id, user_id)
);

create table if not exists public.tribe_tasks (
  id uuid primary key default gen_random_uuid(),
  tribe_id uuid not null references public.tribes(id) on delete cascade,
  title text not null,
  category text not null default 'general',
  priority text not null default 'normal',
  assigned_to uuid references auth.users(id) on delete set null,
  assigned_label text not null default '',
  created_by uuid not null references auth.users(id) on delete cascade,
  done boolean not null default false,
  items jsonb not null default '[]'::jsonb,
  due_at timestamptz,
  due_label text not null default 'Next run',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tribe_snapshots (
  tribe_id uuid not null references public.tribes(id) on delete cascade,
  kind text not null,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (tribe_id, kind)
);

create table if not exists public.tribe_activity (
  id uuid primary key default gen_random_uuid(),
  tribe_id uuid not null references public.tribes(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  actor_label text not null default 'Survivor',
  type text not null default 'info',
  message text not null default '',
  task_title text not null default '',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.tribes enable row level security;
alter table public.tribe_members enable row level security;
alter table public.tribe_tasks enable row level security;
alter table public.tribe_snapshots enable row level security;
alter table public.tribe_activity enable row level security;

alter table public.tribe_tasks add column if not exists assigned_label text not null default '';
alter table public.tribe_tasks add column if not exists due_label text not null default 'Next run';

do $$
begin
  begin
    alter publication supabase_realtime add table public.tribe_tasks;
  exception
    when duplicate_object then null;
    when undefined_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.tribe_activity;
  exception
    when duplicate_object then null;
    when undefined_object then null;
  end;
exception
  when duplicate_object then null;
  when undefined_object then null;
end;
$$;

create or replace function public.is_tribe_member(target_tribe_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.tribe_members
    where tribe_id = target_tribe_id
      and user_id = auth.uid()
  );
$$;

create or replace function public.join_tribe_by_code(invite text, member_name text default '')
returns table(id uuid, name text, invite_code text)
language plpgsql
security definer
set search_path = public
as $$
declare
  target public.tribes%rowtype;
begin
  select *
  into target
  from public.tribes
  where public.tribes.invite_code = upper(invite)
  limit 1;

  if target.id is null then
    raise exception 'Invalid tribe invite code';
  end if;

  insert into public.tribe_members (tribe_id, user_id, display_name, role)
  values (target.id, auth.uid(), coalesce(member_name, ''), 'member')
  on conflict (tribe_id, user_id)
  do update set display_name = excluded.display_name;

  return query select target.id, target.name, target.invite_code;
end;
$$;

drop policy if exists "profiles own row" on public.profiles;
create policy "profiles own row"
on public.profiles
for all
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "tribes visible to members" on public.tribes;
create policy "tribes visible to members"
on public.tribes
for select
using (owner_id = auth.uid() or public.is_tribe_member(id));

drop policy if exists "tribes created by owner" on public.tribes;
create policy "tribes created by owner"
on public.tribes
for insert
with check (owner_id = auth.uid());

drop policy if exists "tribes owner update" on public.tribes;
create policy "tribes owner update"
on public.tribes
for update
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

drop policy if exists "members visible to tribe" on public.tribe_members;
create policy "members visible to tribe"
on public.tribe_members
for select
using (public.is_tribe_member(tribe_id));

drop policy if exists "members can join self" on public.tribe_members;
create policy "members can join self"
on public.tribe_members
for insert
with check (user_id = auth.uid());

drop policy if exists "tasks visible to tribe" on public.tribe_tasks;
create policy "tasks visible to tribe"
on public.tribe_tasks
for select
using (public.is_tribe_member(tribe_id));

drop policy if exists "tasks writable by tribe" on public.tribe_tasks;
create policy "tasks writable by tribe"
on public.tribe_tasks
for all
using (public.is_tribe_member(tribe_id))
with check (public.is_tribe_member(tribe_id));

drop policy if exists "snapshots visible to tribe" on public.tribe_snapshots;
create policy "snapshots visible to tribe"
on public.tribe_snapshots
for select
using (public.is_tribe_member(tribe_id));

drop policy if exists "snapshots writable by tribe" on public.tribe_snapshots;
create policy "snapshots writable by tribe"
on public.tribe_snapshots
for all
using (public.is_tribe_member(tribe_id))
with check (public.is_tribe_member(tribe_id));

drop policy if exists "activity visible to tribe" on public.tribe_activity;
create policy "activity visible to tribe"
on public.tribe_activity
for select
using (public.is_tribe_member(tribe_id));

drop policy if exists "activity writable by tribe" on public.tribe_activity;
create policy "activity writable by tribe"
on public.tribe_activity
for insert
with check (public.is_tribe_member(tribe_id));
