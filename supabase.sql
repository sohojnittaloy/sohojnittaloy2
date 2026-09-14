-- সহজ নিত্যালয় / Supabase database setup
-- Supabase SQL Editor-এ পুরোটি একবার Run করুন।

create extension if not exists pgcrypto;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price numeric(12,2) not null,
  old_price numeric(12,2),
  category text not null default 'grocery',
  description text,
  image_url text,
  storage_path text,
  featured boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.products enable row level security;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

drop policy if exists "Authenticated users can view own admin record" on public.admin_users;
create policy "Authenticated users can view own admin record" on public.admin_users
for select to authenticated
using (user_id = auth.uid());

drop policy if exists "Authenticated users can insert own admin record" on public.admin_users;
create policy "Authenticated users can insert own admin record" on public.admin_users
for insert to authenticated
with check (user_id = auth.uid());

drop policy if exists "Authenticated users can update own admin record" on public.admin_users;
create policy "Authenticated users can update own admin record" on public.admin_users
for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Authenticated users can delete own admin record" on public.admin_users;
create policy "Authenticated users can delete own admin record" on public.admin_users
for delete to authenticated
using (user_id = auth.uid());

drop policy if exists "Public can view products" on public.products;
create policy "Public can view products" on public.products
for select using (true);

drop policy if exists "Admins can insert products" on public.products;
create policy "Admins can insert products" on public.products
for insert to authenticated
with check (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

drop policy if exists "Admins can update products" on public.products;
create policy "Admins can update products" on public.products
for update to authenticated
using (exists (select 1 from public.admin_users a where a.user_id = auth.uid()))
with check (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

drop policy if exists "Admins can delete products" on public.products;
create policy "Admins can delete products" on public.products
for delete to authenticated
using (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));

-- Storage bucket
insert into storage.buckets (id, name, public)
values ('product-images','product-images',true)
on conflict (id) do update set public = true;

drop policy if exists "Public can view product images" on storage.objects;
create policy "Public can view product images" on storage.objects
for select using (bucket_id = 'product-images');

drop policy if exists "Admins can upload product images" on storage.objects;
create policy "Admins can upload product images" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'product-images'
  and exists (select 1 from public.admin_users a where a.user_id = auth.uid())
);

drop policy if exists "Admins can update product images" on storage.objects;
create policy "Admins can update product images" on storage.objects
for update to authenticated
using (
  bucket_id = 'product-images'
  and exists (select 1 from public.admin_users a where a.user_id = auth.uid())
);

drop policy if exists "Admins can delete product images" on storage.objects;
create policy "Admins can delete product images" on storage.objects
for delete to authenticated
using (
  bucket_id = 'product-images'
  and exists (select 1 from public.admin_users a where a.user_id = auth.uid())
);

-- প্রথমবার Admin Auth user তৈরি করার পর:
-- Supabase Dashboard > Authentication > Users থেকে user-এর UUID কপি করুন।
-- তারপর নিচের লাইনটি নিজের UUID দিয়ে চালান:
-- insert into public.admin_users(user_id) values ('YOUR-AUTH-USER-UUID');
