-- Shopping categories, aisles, shops and House inventory for myKitchen.
-- Run once after the original myKitchen migrations. Safe to run again.

alter table public.mykitchen_profiles
  add column if not exists selected_shop_id text not null default ''
  check (char_length(selected_shop_id) <= 120);

alter table public.mykitchen_grocery_items
  add column if not exists item_category text not null default 'pantry'
  check (item_category in ('pantry', 'house'));

alter table public.mykitchen_grocery_items
  add column if not exists aisle_id text not null default 'aisle-unassigned'
  check (char_length(aisle_id) between 1 and 120);

alter table public.mykitchen_pantry_items
  add column if not exists aisle_id text not null default 'aisle-unassigned'
  check (char_length(aisle_id) between 1 and 120);

create table if not exists public.mykitchen_house_items (
  user_id uuid not null default auth.uid()
    references auth.users(id) on delete cascade,
  id text not null,
  name text not null
    check (char_length(name) between 1 and 120),
  normalized_name text not null
    check (char_length(normalized_name) between 1 and 120),
  aisle_id text not null default 'aisle-unassigned'
    check (char_length(aisle_id) between 1 and 120),
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

create table if not exists public.mykitchen_aisles (
  user_id uuid not null default auth.uid()
    references auth.users(id) on delete cascade,
  id text not null,
  name text not null
    check (char_length(name) between 1 and 60),
  normalized_name text not null
    check (char_length(normalized_name) between 1 and 120),
  client_created_at timestamptz not null,
  client_updated_at timestamptz not null,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id),
  check (client_updated_at >= client_created_at)
);

create table if not exists public.mykitchen_shops (
  user_id uuid not null default auth.uid()
    references auth.users(id) on delete cascade,
  id text not null,
  name text not null
    check (char_length(name) between 1 and 60),
  normalized_name text not null
    check (char_length(normalized_name) between 1 and 120),
  aisle_order jsonb not null default '[]'::jsonb
    check (jsonb_typeof(aisle_order) = 'array'),
  client_created_at timestamptz not null,
  client_updated_at timestamptz not null,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id),
  check (client_updated_at >= client_created_at)
);

create index if not exists mykitchen_house_user_status_idx
  on public.mykitchen_house_items (user_id, status, client_updated_at desc);

create index if not exists mykitchen_house_user_name_idx
  on public.mykitchen_house_items (user_id, normalized_name);

create index if not exists mykitchen_aisles_user_name_idx
  on public.mykitchen_aisles (user_id, normalized_name);

create index if not exists mykitchen_shops_user_name_idx
  on public.mykitchen_shops (user_id, normalized_name);

drop trigger if exists reconcile_mykitchen_house_update on public.mykitchen_house_items;
create trigger reconcile_mykitchen_house_update
before update on public.mykitchen_house_items
for each row execute function public.reconcile_mykitchen_client_update();

drop trigger if exists reconcile_mykitchen_aisle_update on public.mykitchen_aisles;
create trigger reconcile_mykitchen_aisle_update
before update on public.mykitchen_aisles
for each row execute function public.reconcile_mykitchen_client_update();

drop trigger if exists reconcile_mykitchen_shop_update on public.mykitchen_shops;
create trigger reconcile_mykitchen_shop_update
before update on public.mykitchen_shops
for each row execute function public.reconcile_mykitchen_client_update();

alter table public.mykitchen_house_items enable row level security;
alter table public.mykitchen_aisles enable row level security;
alter table public.mykitchen_shops enable row level security;

revoke all on table public.mykitchen_house_items from anon;
revoke all on table public.mykitchen_aisles from anon;
revoke all on table public.mykitchen_shops from anon;

grant select, insert, update, delete on table public.mykitchen_house_items to authenticated;
grant select, insert, update, delete on table public.mykitchen_aisles to authenticated;
grant select, insert, update, delete on table public.mykitchen_shops to authenticated;

drop policy if exists "Users manage their myKitchen house items" on public.mykitchen_house_items;
create policy "Users manage their myKitchen house items"
on public.mykitchen_house_items
for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users manage their myKitchen aisles" on public.mykitchen_aisles;
create policy "Users manage their myKitchen aisles"
on public.mykitchen_aisles
for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users manage their myKitchen shops" on public.mykitchen_shops;
create policy "Users manage their myKitchen shops"
on public.mykitchen_shops
for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
