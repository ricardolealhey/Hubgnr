-- QA-ONLY bootstrap for HUB GNR.
-- Reconstructed from read-only production metadata on 2026-11-11.
-- No production rows, users, credentials, or secrets are copied.
-- This file is not a production migration. Review before any future promotion.

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated, service_role;
grant usage on schema public to authenticated, service_role;

create table public.profiles (
  user_id uuid not null,
  email text not null,
  full_name text,
  role text not null default 'client',
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_pkey primary key (user_id),
  constraint profiles_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade,
  constraint profiles_role_check check (role = any (array['master','admin','staff','client','performance']::text[])),
  constraint profiles_status_check check (status = any (array['active','invited','suspended']::text[]))
);

create table public.companies (
  id uuid not null default gen_random_uuid(),
  name text not null,
  legal_name text,
  document text,
  segment text,
  email text,
  phone text,
  website text,
  status text not null default 'active',
  notes text,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint companies_pkey primary key (id),
  constraint companies_created_by_fkey foreign key (created_by) references auth.users(id) on delete set null,
  constraint companies_status_check check (status = any (array['active','inactive']::text[]))
);

create table public.clients (
  id uuid not null default gen_random_uuid(),
  company_id uuid,
  name text not null,
  contact_person text,
  document text,
  email text,
  phone text,
  segment text,
  source text,
  status text not null default 'active',
  notes text,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint clients_pkey primary key (id),
  constraint clients_company_id_fkey foreign key (company_id) references public.companies(id) on delete set null,
  constraint clients_created_by_fkey foreign key (created_by) references auth.users(id) on delete set null,
  constraint clients_status_check check (status = any (array['active','inactive','prospect']::text[]))
);

create table public.user_module_permissions (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  module_key text not null,
  can_view boolean not null default false,
  can_manage boolean not null default false,
  granted_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_module_permissions_pkey primary key (id),
  constraint user_module_permissions_user_id_fkey foreign key (user_id) references public.profiles(user_id) on delete cascade,
  constraint user_module_permissions_granted_by_fkey foreign key (granted_by) references public.profiles(user_id),
  constraint user_module_permissions_key_check check (module_key = any (array['companies','clients','crm','projects','tasks','calendar','finance','digital_presence','connect','tickets','client_portal','performance','mentoring','reports','team']::text[])),
  constraint user_module_permissions_manage_requires_view check (can_manage = false or can_view = true),
  constraint user_module_permissions_unique unique (user_id, module_key)
);

create unique index profiles_email_lower_uidx on public.profiles (lower(email));
create index profiles_role_idx on public.profiles (role);
create index profiles_status_idx on public.profiles (status);

create index companies_created_by_idx on public.companies (created_by);
create index companies_name_idx on public.companies (name);
create index companies_status_idx on public.companies (status);

create index clients_company_id_idx on public.clients (company_id);
create index clients_created_by_idx on public.clients (created_by);
create index clients_name_idx on public.clients (name);
create index clients_status_idx on public.clients (status);

create index user_module_permissions_module_key_idx on public.user_module_permissions (module_key);
create index user_module_permissions_user_id_idx on public.user_module_permissions (user_id);

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

create or replace function private.sync_hub_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  insert into public.profiles (user_id, email, full_name, role, status)
  values (
    new.id,
    lower(new.email),
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    'client',
    'active'
  )
  on conflict (user_id) do update
    set email = excluded.email,
        full_name = coalesce(excluded.full_name, public.profiles.full_name),
        updated_at = now();
  return new;
end;
$function$;

create or replace function private.activate_invited_hub_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if new.email_confirmed_at is not null and old.email_confirmed_at is null then
    update public.profiles
       set status = 'active', updated_at = now()
     where user_id = new.id and status = 'invited';
  end if;
  return new;
end;
$function$;

create or replace function private.has_module_access(p_module_key text, p_manage boolean default false)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from public.profiles p
      where p.user_id = (select auth.uid())
        and p.status = 'active'
        and (
          p.role in ('master','admin')
          or exists (
            select 1
            from public.user_module_permissions ump
            where ump.user_id = p.user_id
              and ump.module_key = p_module_key
              and ump.can_view = true
              and (p_manage = false or ump.can_manage = true)
          )
        )
    );
$function$;

create or replace function private.is_hub_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from public.profiles p
      where p.user_id = (select auth.uid())
        and p.role in ('master','admin')
        and p.status = 'active'
    );
$function$;

revoke all on function private.set_updated_at() from public, anon, authenticated;
revoke all on function private.sync_hub_profile() from public, anon, authenticated;
revoke all on function private.activate_invited_hub_profile() from public, anon, authenticated;
revoke all on function private.has_module_access(text, boolean) from public, anon, authenticated;
revoke all on function private.is_hub_admin() from public, anon, authenticated;
grant execute on function private.has_module_access(text, boolean) to authenticated;
grant execute on function private.is_hub_admin() to authenticated;

create trigger on_auth_user_created_hub_profile
after insert or update of email on auth.users
for each row execute function private.sync_hub_profile();

create trigger on_auth_user_confirmed_hub_profile
after update of email_confirmed_at on auth.users
for each row
when (new.email_confirmed_at is not null and old.email_confirmed_at is null)
execute function private.activate_invited_hub_profile();

create trigger companies_set_updated_at
before update on public.companies
for each row execute function private.set_updated_at();

create trigger clients_set_updated_at
before update on public.clients
for each row execute function private.set_updated_at();

alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.clients enable row level security;
alter table public.user_module_permissions enable row level security;

create policy profiles_read_self_or_master
on public.profiles for select to authenticated
using (user_id = (select auth.uid()) or (select private.is_hub_admin()));

create policy companies_read_by_module
on public.companies for select to authenticated
using ((select private.has_module_access('companies', false)));

create policy companies_insert_by_module
on public.companies for insert to authenticated
with check ((select private.has_module_access('companies', true)));

create policy companies_update_by_module
on public.companies for update to authenticated
using ((select private.has_module_access('companies', true)))
with check ((select private.has_module_access('companies', true)));

create policy companies_delete_by_module
on public.companies for delete to authenticated
using ((select private.has_module_access('companies', true)));

create policy clients_read_by_module
on public.clients for select to authenticated
using ((select private.has_module_access('clients', false)));

create policy clients_insert_by_module
on public.clients for insert to authenticated
with check ((select private.has_module_access('clients', true)));

create policy clients_update_by_module
on public.clients for update to authenticated
using ((select private.has_module_access('clients', true)))
with check ((select private.has_module_access('clients', true)));

create policy clients_delete_by_module
on public.clients for delete to authenticated
using ((select private.has_module_access('clients', true)));

create policy module_permissions_read_self_or_admin
on public.user_module_permissions for select to authenticated
using (user_id = (select auth.uid()) or (select private.is_hub_admin()));

create policy module_permissions_admin_manage
on public.user_module_permissions for all to authenticated
using ((select private.is_hub_admin()))
with check ((select private.is_hub_admin()));

-- Explicit Data API grants. No access is granted to anon.
grant select on public.profiles to authenticated;
grant select, insert, update, delete on public.companies, public.clients, public.user_module_permissions to authenticated;
grant all privileges on public.profiles, public.companies, public.clients, public.user_module_permissions to service_role;
