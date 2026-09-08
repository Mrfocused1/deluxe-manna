-- Orders for direct delivery (no Deliveroo)
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique default 'DM-' || upper(substr(gen_random_uuid()::text,1,8)),
  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  delivery_address text not null,
  delivery_postcode text,
  delivery_notes text,
  items jsonb not null,
  subtotal_pence integer not null,
  delivery_fee_pence integer default 0,
  total_pence integer not null,
  status text default 'pending' check (status in ('pending','confirmed','preparing','out_for_delivery','delivered','cancelled')),
  payment_method text default 'pay_on_delivery' check (payment_method in ('pay_on_delivery','card','cash')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_orders_created on public.orders(created_at desc);
create index if not exists idx_orders_status on public.orders(status);

alter table public.orders enable row level security;
drop policy if exists "public read orders" on public.orders;
create policy "public read orders" on public.orders for select using (true);
drop policy if exists "public create orders" on public.orders;
create policy "public create orders" on public.orders for insert with check (true);
drop policy if exists "public update orders" on public.orders;
create policy "public update orders" on public.orders for update using (true) with check (true);

alter publication supabase_realtime add table public.orders;

-- updated_at trigger
create or replace function public.handle_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end; $$ language plpgsql;
drop trigger if exists orders_updated_at on public.orders;
create trigger orders_updated_at before update on public.orders for each row execute function public.handle_updated_at();
drop trigger if exists site_content_updated_at on public.site_content;
create trigger site_content_updated_at before update on public.site_content for each row execute function public.handle_updated_at();
drop trigger if exists menu_items_updated_at on public.menu_items;
create trigger menu_items_updated_at before update on public.menu_items for each row execute function public.handle_updated_at();
