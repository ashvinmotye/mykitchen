-- myKitchen cloud schema. Run once in the Supabase SQL Editor for the same
-- project used by Forge and Level90. Existing app tables are not changed.

create table if not exists public.mykitchen_profiles (
  user_id uuid primary key default auth.uid()
    references auth.users(id) on delete cascade,
  name text not null default ''
    check (char_length(name) <= 40),
  theme text not null default 'light'
    check (theme in ('light', 'dark')),
  schema_version smallint not null default 1
    check (schema_version >= 1),
  client_updated_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mykitchen_recipes (
  user_id uuid not null default auth.uid()
    references auth.users(id) on delete cascade,
  id text not null,
  title text not null
    check (char_length(title) between 1 and 80),
  category text not null default ''
    check (char_length(category) <= 36),
  notes text not null default ''
    check (char_length(notes) <= 500),
  ingredients jsonb not null default '[]'::jsonb
    check (jsonb_typeof(ingredients) = 'array'),
  steps jsonb not null default '[]'::jsonb
    check (jsonb_typeof(steps) = 'array'),
  youtube_links jsonb not null default '[]'::jsonb
    constraint mykitchen_recipes_youtube_links_array
    check (jsonb_typeof(youtube_links) = 'array'),
  client_created_at timestamptz not null,
  client_updated_at timestamptz not null,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id),
  check (client_updated_at >= client_created_at)
);

create table if not exists public.mykitchen_grocery_items (
  user_id uuid not null default auth.uid()
    references auth.users(id) on delete cascade,
  id text not null,
  name text not null
    check (char_length(name) between 1 and 120),
  normalized_name text not null
    check (char_length(normalized_name) between 1 and 120),
  source_recipe_ids jsonb not null default '[]'::jsonb
    check (jsonb_typeof(source_recipe_ids) = 'array'),
  bought boolean not null default false,
  bought_at timestamptz,
  client_created_at timestamptz not null,
  client_updated_at timestamptz not null,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id),
  check (client_updated_at >= client_created_at)
);

create table if not exists public.mykitchen_pantry_items (
  user_id uuid not null default auth.uid()
    references auth.users(id) on delete cascade,
  id text not null,
  name text not null
    check (char_length(name) between 1 and 120),
  normalized_name text not null
    check (char_length(normalized_name) between 1 and 120),
  status text not null default 'available'
    check (status in ('available', 'finished')),
  stocked_at timestamptz not null,
  finished_at timestamptz,
  client_created_at timestamptz not null,
  client_updated_at timestamptz not null,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id),
  check (client_updated_at >= client_created_at)
);

create index if not exists mykitchen_recipes_user_updated_idx
  on public.mykitchen_recipes (user_id, client_updated_at desc);

create index if not exists mykitchen_grocery_user_status_idx
  on public.mykitchen_grocery_items (user_id, bought, client_updated_at desc);

create index if not exists mykitchen_grocery_user_name_idx
  on public.mykitchen_grocery_items (user_id, normalized_name);

create index if not exists mykitchen_pantry_user_status_idx
  on public.mykitchen_pantry_items (user_id, status, client_updated_at desc);

create index if not exists mykitchen_pantry_user_name_idx
  on public.mykitchen_pantry_items (user_id, normalized_name);

create or replace function public.reconcile_mykitchen_client_update()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.client_updated_at < old.client_updated_at then
    return old;
  end if;

  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists reconcile_mykitchen_profile_update on public.mykitchen_profiles;
create trigger reconcile_mykitchen_profile_update
before update on public.mykitchen_profiles
for each row execute function public.reconcile_mykitchen_client_update();

drop trigger if exists reconcile_mykitchen_recipe_update on public.mykitchen_recipes;
create trigger reconcile_mykitchen_recipe_update
before update on public.mykitchen_recipes
for each row execute function public.reconcile_mykitchen_client_update();

drop trigger if exists reconcile_mykitchen_grocery_update on public.mykitchen_grocery_items;
create trigger reconcile_mykitchen_grocery_update
before update on public.mykitchen_grocery_items
for each row execute function public.reconcile_mykitchen_client_update();

drop trigger if exists reconcile_mykitchen_pantry_update on public.mykitchen_pantry_items;
create trigger reconcile_mykitchen_pantry_update
before update on public.mykitchen_pantry_items
for each row execute function public.reconcile_mykitchen_client_update();

alter table public.mykitchen_profiles enable row level security;
alter table public.mykitchen_recipes enable row level security;
alter table public.mykitchen_grocery_items enable row level security;
alter table public.mykitchen_pantry_items enable row level security;

revoke all on table public.mykitchen_profiles from anon;
revoke all on table public.mykitchen_recipes from anon;
revoke all on table public.mykitchen_grocery_items from anon;
revoke all on table public.mykitchen_pantry_items from anon;

grant select, insert, update, delete on table public.mykitchen_profiles to authenticated;
grant select, insert, update, delete on table public.mykitchen_recipes to authenticated;
grant select, insert, update, delete on table public.mykitchen_grocery_items to authenticated;
grant select, insert, update, delete on table public.mykitchen_pantry_items to authenticated;

drop policy if exists "Users manage their myKitchen profile" on public.mykitchen_profiles;
create policy "Users manage their myKitchen profile"
on public.mykitchen_profiles
for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users manage their myKitchen recipes" on public.mykitchen_recipes;
create policy "Users manage their myKitchen recipes"
on public.mykitchen_recipes
for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users manage their myKitchen grocery items" on public.mykitchen_grocery_items;
create policy "Users manage their myKitchen grocery items"
on public.mykitchen_grocery_items
for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users manage their myKitchen pantry items" on public.mykitchen_pantry_items;
create policy "Users manage their myKitchen pantry items"
on public.mykitchen_pantry_items
for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
