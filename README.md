# myKitchen

A plain HTML, CSS and JavaScript PWA for recipes, shopping lists, Pantry and House tracking.

## What is included

- Recipe creation, editing, viewing, searching and deletion
- Multiple optional YouTube reference links per recipe
- Plain-text recipe sharing through the device share sheet, with copy fallback
- Recipes grouped into collapsible category sections, with categories and recipes sorted A–Z
- Category filtering that shows only the selected accordion section
- Multi-recipe selection that adds each ingredient once to the shopping list
- Manual shopping-list additions with category and aisle selection
- Pantry and House item categories, with bought items routed to the correct list
- A master aisle list, configurable shops and a confirmed drag-and-drop aisle order per shop
- Shop-aware shopping-list sections ordered by aisle, with items sorted A–Z inside each section
- One-tap clearing for the full shopping list, with confirmation
- Shopping items remain visible and show whether they are already in Pantry or House
- Pantry items are sorted A–Z and can be marked finished, restored or removed
- Items Tidying workspace for finding duplicate ingredient names and merging them across every recipe
- Pantry organiser for selecting recipe ingredients already available at home
- Recipe measurements after a dash and `(optional)` notes are preserved in recipes but hidden from ingredient-management views
- Manual pantry additions for items already at home
- First-use name prompt
- Light and dark themes
- JSON import and export
- Offline local storage with automatic Supabase synchronization
- The same Supabase URL, publishable key and email/password login as Forge and Level90
- Installable PWA manifest, service worker and app icons

Quantities are intentionally not stored or calculated. Each ingredient is treated as one shopping-list item.

## Supabase setup

1. Open the existing Supabase project used by Forge and Level90.
2. Open **SQL Editor**.
3. Run `supabase/migrations/20260830_create_mykitchen.sql` once.
4. Run `supabase/migrations/20260831_add_mykitchen_youtube_links.sql` once. It is safe for both fresh and existing installations.
5. Run `supabase/migrations/20260913_add_shopping_aisles_shops_house.sql` once. It preserves existing recipes, shopping items and Pantry data.
6. Deploy all app files from the ZIP to the myKitchen website.
7. Sign in with the same email/password account used by Forge and Level90.

If myKitchen was already installed and YouTube links already work, only `20260913_add_shopping_aisles_shops_house.sql` is new.

The migrations use myKitchen-only tables with Row Level Security. They do not modify Forge or Level90 tables.

## Install on iPhone

1. Open the deployed HTTPS address in Safari.
2. Tap **Share**.
3. Choose **Add to Home Screen**.

The first sign-in requires a connection. Once the PWA and account are cached, local data remains available offline and sync resumes when the connection returns.

## Backup behavior

- **Export backup** downloads the current recipes, shopping list, Pantry, House, aisles, shops and profile as JSON.
- **Import backup** asks for confirmation and replaces the current myKitchen data for the signed-in account.
- Deleted records are synchronized as soft deletions so an older device cannot silently restore them.

## Local validation

From the project source directory:

```sh
node --check core.js
node --check app.js
node -e "JSON.parse(require('fs').readFileSync('manifest.webmanifest', 'utf8'))"
```
