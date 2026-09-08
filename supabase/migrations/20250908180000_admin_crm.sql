-- Enable UUID extension
create extension if not exists "pgcrypto";

-- Site content: key-value store for all editable text/media/links
create table if not exists public.site_content (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  category text not null,
  label text not null,
  content_type text not null check (content_type in ('text','textarea','rich','image','video','link','email','tel','color')),
  value_text text,
  value_json jsonb,
  media_url text,
  updated_at timestamptz default now()
);

-- Menu items: structured menu CMS
create table if not exists public.menu_items (
  id text primary key,
  category text not null,
  name text not null,
  description text,
  price_pence integer not null,
  image_url text,
  tags text[] default '{}',
  available boolean default true,
  sort_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_menu_items_category on public.menu_items(category);
create index if not exists idx_menu_items_sort on public.menu_items(sort_order);

-- Enable RLS and allow public read, anon write for now (admin page is public /admin, we protect via simple password in JS)
-- For production, you'd lock write to authenticated users only
alter table public.site_content enable row level security;
alter table public.menu_items enable row level security;

drop policy if exists "public read site_content" on public.site_content;
create policy "public read site_content" on public.site_content for select using (true);
drop policy if exists "public write site_content" on public.site_content;
create policy "public write site_content" on public.site_content for all using (true) with check (true);

drop policy if exists "public read menu_items" on public.menu_items;
create policy "public read menu_items" on public.menu_items for select using (true);
drop policy if exists "public write menu_items" on public.menu_items;
create policy "public write menu_items" on public.menu_items for all using (true) with check (true);

-- Storage bucket for site media
insert into storage.buckets (id, name, public) values ('site-media','site-media', true) on conflict (id) do nothing;

-- Allow public read and write to storage (admin page handles upload)
drop policy if exists "public read site-media" on storage.objects;
create policy "public read site-media" on storage.objects for select using (bucket_id = 'site-media');
drop policy if exists "public write site-media" on storage.objects;
create policy "public write site-media" on storage.objects for all using (bucket_id = 'site-media') with check (bucket_id = 'site-media');

-- Realtime
alter publication supabase_realtime add table public.site_content;
alter publication supabase_realtime add table public.menu_items;
