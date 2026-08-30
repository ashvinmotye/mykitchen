# myKitchen

A plain HTML, CSS and JavaScript PWA for recipes, grocery lists and pantry tracking.

## What is included

- Recipe creation, editing, viewing, searching and deletion
- Multi-recipe selection that adds each ingredient once to the grocery list
- Manual grocery-list additions
- Grocery items remain visible and show an **In pantry** badge when applicable
- Ticking a grocery item adds or refreshes the matching pantry item
- Pantry items can be marked finished, restored or removed
- Manual pantry additions for items already at home
- First-use name prompt
- Light and dark themes
- JSON import and export
- Offline local storage with automatic Supabase synchronization
- The same Supabase URL, publishable key and email/password login as Forge and Level90
- Installable PWA manifest, service worker and app icons

Quantities are intentionally not stored or calculated. Each ingredient is treated as one grocery-list item.

## Supabase setup

1. Open the existing Supabase project used by Forge and Level90.
2. Open **SQL Editor**.
3. Run `supabase/migrations/20260830_create_mykitchen.sql` once.
4. Deploy all app files from the ZIP to the myKitchen website.
5. Sign in with the same email/password account used by Forge and Level90.

The migration creates four myKitchen-only tables with Row Level Security. It does not modify Forge or Level90 tables.

## Install on iPhone

1. Open the deployed HTTPS address in Safari.
2. Tap **Share**.
3. Choose **Add to Home Screen**.

The first sign-in requires a connection. Once the PWA and account are cached, local data remains available offline and sync resumes when the connection returns.

## Backup behavior

- **Export backup** downloads the current recipes, grocery list, pantry and profile as JSON.
- **Import backup** asks for confirmation and replaces the current myKitchen data for the signed-in account.
- Deleted records are synchronized as soft deletions so an older device cannot silently restore them.

## Local validation

From the project source directory:

```sh
npm run build
npm run validate
npm test
```
