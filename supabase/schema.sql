-- Run this in the Supabase SQL editor. Service role API routes perform writes.
create extension if not exists pgcrypto;

create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  price numeric(10,2) not null check (price >= 0),
  category text not null,
  image_url text not null,
  is_vegetarian boolean not null default true,
  is_available boolean not null default true,
  created_at timestamptz not null default now(),
  constraint menu_items_name_unique unique(name)
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  table_number integer not null check (table_number between 1 and 100),
  status text not null default 'pending' check (status in ('pending','preparing','ready','served')),
  total_amount numeric(10,2) not null check (total_amount >= 0),
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  menu_item_id uuid not null references public.menu_items(id),
  item_name text not null,
  quantity integer not null check (quantity between 1 and 20),
  unit_price numeric(10,2) not null check (unit_price >= 0),
  special_notes text not null default ''
);

-- Only this minimal feed is readable by diners' anonymous clients for realtime subscriptions.
create table if not exists public.order_status_feed (
  order_id uuid primary key references public.orders(id) on delete cascade,
  status text not null check (status in ('pending','preparing','ready','served')),
  updated_at timestamptz not null default now()
);

create or replace function public.sync_order_status_feed() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.order_status_feed(order_id,status,updated_at)
  values (new.id,new.status,now())
  on conflict (order_id) do update set status=excluded.status,updated_at=excluded.updated_at;
  return new;
end;
$$;
create or replace function public.touch_order_updated_at() returns trigger
language plpgsql set search_path = public as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
drop trigger if exists orders_sync_status_feed on public.orders;
create trigger orders_sync_status_feed after insert or update of status on public.orders
for each row execute function public.sync_order_status_feed();
drop trigger if exists orders_touch_updated_at on public.orders;
create trigger orders_touch_updated_at before update on public.orders
for each row execute function public.touch_order_updated_at();

alter table public.menu_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_status_feed enable row level security;
drop policy if exists "Anyone can view available menu" on public.menu_items;
create policy "Anyone can view available menu" on public.menu_items for select to anon, authenticated using (is_available = true);
drop policy if exists "Anyone can follow minimal order status" on public.order_status_feed;
create policy "Anyone can follow minimal order status" on public.order_status_feed for select to anon, authenticated using (true);
grant select on public.menu_items to anon, authenticated;
grant select on public.order_status_feed to anon, authenticated;

-- Supabase publishes changes only on explicitly listed tables. The status feed avoids exposing order notes.
do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='order_status_feed') then
    alter publication supabase_realtime add table public.order_status_feed;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='orders') then
    alter publication supabase_realtime add table public.orders;
  end if;
end $$;
