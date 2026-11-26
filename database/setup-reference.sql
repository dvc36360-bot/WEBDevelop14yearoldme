-- WebWinkel 2.0 database reference. The user has already run the initial schema.
-- Run only if a table/policy is missing; review before running in a live project.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 full_name text, email text, phone text, theme text default 'light',
 created_at timestamptz default now(), updated_at timestamptz default now()
);
create table if not exists public.admin_users (user_id uuid primary key references auth.users(id) on delete cascade);
create table if not exists public.products (
 id uuid primary key default gen_random_uuid(), name text not null, description text,
 price numeric(12,2) not null default 0, currency text not null default 'ZAR',
 is_active boolean not null default true, created_at timestamptz default now(), updated_at timestamptz default now()
);
create table if not exists public.product_images (
 id uuid primary key default gen_random_uuid(), product_id uuid references public.products(id) on delete cascade,
 image_url text not null, display_order int default 0, created_at timestamptz default now()
);
create table if not exists public.orders (
 id uuid primary key default gen_random_uuid(), customer_id uuid references auth.users(id),
 customer_name text, customer_email text, customer_phone text, product_id uuid references public.products(id) on delete set null,
 product_name text not null, price numeric(12,2) default 0,
 status text not null default 'pending' check(status in ('pending','contacted','confirmed','completed','cancelled')),
 admin_notes text, created_at timestamptz default now(), updated_at timestamptz default now()
);
create table if not exists public.payment_methods (
 id uuid primary key default gen_random_uuid(), name text not null, description text,
 is_active boolean default true, display_order int default 0,
 created_at timestamptz default now(), updated_at timestamptz default now()
);
create table if not exists public.subscriptions (
 id uuid primary key default gen_random_uuid(), customer_id uuid references auth.users(id) on delete set null,
 business_name text not null, customer_name text, customer_email text not null,
 subscription_name text not null, amount numeric(12,2) not null, currency text default 'ZAR',
 billing_frequency text default 'monthly' check(billing_frequency in ('monthly','yearly','weekly','once','custom')),
 due_date date not null, status text default 'outstanding' check(status in ('paid','outstanding','overdue','cancelled')),
 reminder_enabled boolean default true, admin_notes text,
 created_at timestamptz default now(), updated_at timestamptz default now()
);
create table if not exists public.subscription_payments (
 id uuid primary key default gen_random_uuid(), subscription_id uuid references public.subscriptions(id) on delete cascade,
 amount numeric(12,2) not null, due_date date not null, paid_at timestamptz,
 status text default 'outstanding', created_at timestamptz default now()
);
create table if not exists public.notification_subscriptions (
 id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id) on delete cascade,
 endpoint text not null, p256dh text, auth_key text, created_at timestamptz default now()
);
create table if not exists public.notification_logs (
 id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id) on delete cascade,
 title text not null, message text, notification_type text, sent_at timestamptz default now(), read_at timestamptz
);

alter table public.profiles enable row level security;
alter table public.admin_users enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.orders enable row level security;
alter table public.payment_methods enable row level security;
alter table public.subscriptions enable row level security;
alter table public.subscription_payments enable row level security;
alter table public.notification_subscriptions enable row level security;
alter table public.notification_logs enable row level security;

create or replace function public.is_admin() returns boolean language sql security definer set search_path=public as $$
 select exists(select 1 from public.admin_users where user_id=auth.uid());
$$;

-- Core policies. These are intentionally concise; see README security notes.
drop policy if exists "profiles_self_read" on public.profiles;
create policy "profiles_self_read" on public.profiles for select to authenticated using(id=auth.uid() or public.is_admin());
drop policy if exists "profiles_self_write" on public.profiles;
create policy "profiles_self_write" on public.profiles for all to authenticated using(id=auth.uid() or public.is_admin()) with check(id=auth.uid() or public.is_admin());

drop policy if exists "admin_users_self_read" on public.admin_users;
create policy "admin_users_self_read" on public.admin_users for select to authenticated using(user_id=auth.uid());

drop policy if exists "products_read_active" on public.products;
create policy "products_read_active" on public.products for select to authenticated using(is_active or public.is_admin());
drop policy if exists "products_admin_all" on public.products;
create policy "products_admin_all" on public.products for all to authenticated using(public.is_admin()) with check(public.is_admin());

drop policy if exists "product_images_read" on public.product_images;
create policy "product_images_read" on public.product_images for select to authenticated using(public.is_admin() or exists(select 1 from public.products p where p.id=product_id and p.is_active));
drop policy if exists "product_images_admin" on public.product_images;
create policy "product_images_admin" on public.product_images for all to authenticated using(public.is_admin()) with check(public.is_admin());

drop policy if exists "orders_customer_insert" on public.orders;
create policy "orders_customer_insert" on public.orders for insert to authenticated with check(customer_id=auth.uid());
drop policy if exists "orders_customer_read" on public.orders;
create policy "orders_customer_read" on public.orders for select to authenticated using(customer_id=auth.uid() or public.is_admin());
drop policy if exists "orders_admin_manage" on public.orders;
create policy "orders_admin_manage" on public.orders for all to authenticated using(public.is_admin()) with check(public.is_admin());

drop policy if exists "payment_methods_read_active" on public.payment_methods;
create policy "payment_methods_read_active" on public.payment_methods for select to authenticated using(is_active or public.is_admin());
drop policy if exists "payment_methods_admin" on public.payment_methods;
create policy "payment_methods_admin" on public.payment_methods for all to authenticated using(public.is_admin()) with check(public.is_admin());

drop policy if exists "subscriptions_customer_read" on public.subscriptions;
create policy "subscriptions_customer_read" on public.subscriptions for select to authenticated using(customer_id=auth.uid() or public.is_admin());
drop policy if exists "subscriptions_admin_manage" on public.subscriptions;
create policy "subscriptions_admin_manage" on public.subscriptions for all to authenticated using(public.is_admin()) with check(public.is_admin());

drop policy if exists "subscription_payments_customer_read" on public.subscription_payments;
create policy "subscription_payments_customer_read" on public.subscription_payments for select to authenticated using(public.is_admin() or exists(select 1 from public.subscriptions s where s.id=subscription_id and s.customer_id=auth.uid()));
drop policy if exists "subscription_payments_admin" on public.subscription_payments;
create policy "subscription_payments_admin" on public.subscription_payments for all to authenticated using(public.is_admin()) with check(public.is_admin());

drop policy if exists "push_subscriptions_own" on public.notification_subscriptions;
create policy "push_subscriptions_own" on public.notification_subscriptions for all to authenticated using(user_id=auth.uid() or public.is_admin()) with check(user_id=auth.uid() or public.is_admin());
drop policy if exists "notification_logs_read" on public.notification_logs;
create policy "notification_logs_read" on public.notification_logs for select to authenticated using(user_id=auth.uid() or public.is_admin());

-- Create/update profile rows on signup.
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin
 insert into public.profiles(id,full_name,email) values(new.id,coalesce(new.raw_user_meta_data->>'full_name',''),new.email)
 on conflict(id) do update set email=excluded.email;
 return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();
