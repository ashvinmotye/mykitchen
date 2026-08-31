-- Adds multiple optional YouTube reference links to each myKitchen recipe.
-- Run once after the original 20260830 myKitchen migration.

alter table public.mykitchen_recipes
  add column if not exists youtube_links jsonb not null default '[]'::jsonb;

alter table public.mykitchen_recipes
  drop constraint if exists mykitchen_recipes_youtube_links_array;

alter table public.mykitchen_recipes
  add constraint mykitchen_recipes_youtube_links_array
  check (jsonb_typeof(youtube_links) = 'array');
