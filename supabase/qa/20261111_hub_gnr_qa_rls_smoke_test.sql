-- QA-ONLY transactional smoke test for HUB GNR RLS and auth triggers.
-- Run only against Supabase project wbxxqhduiyryjnqcrscp (HUB GNR QA).
-- All synthetic users and rows are created inside one transaction and rolled back.
-- No email is sent; this script inserts directly into auth.users and never calls Auth APIs.
-- Do not remove the final ROLLBACK or run against production.

begin;

create temporary table qa_test_results (
  test_name text primary key,
  passed boolean not null,
  details text
) on commit drop;

grant all on table pg_temp.qa_test_results to authenticated;

-- Fixed synthetic identities; transaction rollback prevents persistence.
insert into auth.users (
  id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
(
  '11111111-1111-4111-8111-111111111101',
  'authenticated', 'authenticated', 'qa-master-20261111@invalid.example', '',
  now(), '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"GNR QA Master"}'::jsonb, now(), now()
),
(
  '11111111-1111-4111-8111-111111111102',
  'authenticated', 'authenticated', 'qa-performance-20261111@invalid.example', '',
  now(), '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"GNR QA Performance"}'::jsonb, now(), now()
),
(
  '11111111-1111-4111-8111-111111111103',
  'authenticated', 'authenticated', 'qa-invite-20261111@invalid.example', '',
  null, '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"GNR QA Invite Trigger"}'::jsonb, now(), now()
);

update public.profiles
set role = 'master'
where user_id = '11111111-1111-4111-8111-111111111101';

update public.profiles
set role = 'performance'
where user_id = '11111111-1111-4111-8111-111111111102';

update public.profiles
set status = 'invited'
where user_id = '11111111-1111-4111-8111-111111111103';

update auth.users
set email_confirmed_at = now(), updated_at = now()
where id = '11111111-1111-4111-8111-111111111103';

insert into public.user_module_permissions
  (user_id, module_key, can_view, can_manage, granted_by)
values
  ('11111111-1111-4111-8111-111111111102', 'clients', true, false,
   '11111111-1111-4111-8111-111111111101'),
  ('11111111-1111-4111-8111-111111111102', 'performance', true, true,
   '11111111-1111-4111-8111-111111111101');

insert into public.companies (id, name)
values ('11111111-1111-4111-8111-111111111201', 'GNR QA seed company');

insert into public.clients (id, company_id, name)
values (
  '11111111-1111-4111-8111-111111111202',
  '11111111-1111-4111-8111-111111111201',
  'GNR QA seed client'
);

insert into pg_temp.qa_test_results
select
  'auth.users insert creates profile',
  exists (
    select 1 from public.profiles
    where user_id = '11111111-1111-4111-8111-111111111101'
      and email = 'qa-master-20261111@invalid.example'
      and status = 'active'
  ),
  'The sync_hub_profile trigger should create an active client profile.';

insert into pg_temp.qa_test_results
select
  'email confirmation activates invited profile',
  exists (
    select 1 from public.profiles
    where user_id = '11111111-1111-4111-8111-111111111103'
      and status = 'active'
  ),
  'The confirmation trigger should change invited to active.';

-- Exercise the database policies as an authenticated Master session.
set local role authenticated;
select set_config('request.jwt.claim.sub',
  '11111111-1111-4111-8111-111111111101', true);
select set_config('request.jwt.claims',
  '{"sub":"11111111-1111-4111-8111-111111111101","role":"authenticated","aud":"authenticated"}',
  true);

insert into pg_temp.qa_test_results
select 'Master is recognized as Hub admin',
       private.is_hub_admin(),
       'Expected true for an active profile with role master.';

insert into pg_temp.qa_test_results
select 'Master can manage companies and clients',
       private.has_module_access('companies', true)
       and private.has_module_access('clients', true),
       'Expected module access and manage access for Master.';

insert into pg_temp.qa_test_results
select 'Master can read all profiles',
       (select count(*) from public.profiles) = 3,
       'Expected visibility of all three synthetic profiles.';

do $$
begin
  begin
    insert into public.companies (id, name)
    values ('11111111-1111-4111-8111-111111111211', 'GNR QA Master CRUD company');

    insert into public.clients (id, company_id, name)
    values (
      '11111111-1111-4111-8111-111111111212',
      '11111111-1111-4111-8111-111111111211',
      'GNR QA Master CRUD client'
    );

    update public.companies
    set notes = 'updated by authenticated Master'
    where id = '11111111-1111-4111-8111-111111111211';

    update public.clients
    set notes = 'updated by authenticated Master'
    where id = '11111111-1111-4111-8111-111111111212';

    delete from public.clients
    where id = '11111111-1111-4111-8111-111111111212';

    delete from public.companies
    where id = '11111111-1111-4111-8111-111111111211';

    insert into pg_temp.qa_test_results
    values ('Master can create, update and delete companies/clients', true,
            'All six RLS-protected CRUD statements completed.');
  exception when others then
    insert into pg_temp.qa_test_results
    values ('Master can create, update and delete companies/clients', false,
            sqlstate || ': ' || sqlerrm);
  end;
end;
$$;

-- Exercise the database policies as an authenticated Performance session.
select set_config('request.jwt.claim.sub',
  '11111111-1111-4111-8111-111111111102', true);
select set_config('request.jwt.claims',
  '{"sub":"11111111-1111-4111-8111-111111111102","role":"authenticated","aud":"authenticated"}',
  true);

insert into pg_temp.qa_test_results
select 'Performance is not Hub admin',
       not private.is_hub_admin(),
       'Expected false for role performance.';

insert into pg_temp.qa_test_results
select 'Performance can view clients but cannot manage them',
       private.has_module_access('clients', false)
       and not private.has_module_access('clients', true),
       'Expected read-only clients permission.';

insert into pg_temp.qa_test_results
select 'Performance cannot access companies module',
       not private.has_module_access('companies', false),
       'No companies permission was granted.';

insert into pg_temp.qa_test_results
select 'Performance sees only its own profile',
       (select count(*) from public.profiles) = 1,
       'Expected self-only visibility in profiles.';

insert into pg_temp.qa_test_results
select 'Performance sees only its own permissions',
       (select count(*) from public.user_module_permissions) = 2,
       'Expected the two permission rows granted to this user only.';

insert into pg_temp.qa_test_results
select 'Performance can read clients but not companies',
       (select count(*) from public.clients) = 1
       and (select count(*) from public.companies) = 0,
       'Expected one visible client and zero visible companies.';

do $$
declare
  affected integer;
begin
  begin
    insert into public.companies (name)
    values ('GNR QA forbidden company');
    insert into pg_temp.qa_test_results
    values ('Performance insert into companies is denied', false,
            'Insert unexpectedly succeeded.');
  exception when insufficient_privilege then
    insert into pg_temp.qa_test_results
    values ('Performance insert into companies is denied', true,
            'RLS rejected the unauthorized insert (SQLSTATE 42501).');
  when others then
    insert into pg_temp.qa_test_results
    values ('Performance insert into companies is denied', false,
            sqlstate || ': ' || sqlerrm);
  end;

  begin
    insert into public.clients (name)
    values ('GNR QA forbidden client');
    insert into pg_temp.qa_test_results
    values ('Performance insert into clients is denied', false,
            'Insert unexpectedly succeeded.');
  exception when insufficient_privilege then
    insert into pg_temp.qa_test_results
    values ('Performance insert into clients is denied', true,
            'RLS rejected the unauthorized insert (SQLSTATE 42501).');
  when others then
    insert into pg_temp.qa_test_results
    values ('Performance insert into clients is denied', false,
            sqlstate || ': ' || sqlerrm);
  end;

  update public.clients
  set notes = 'unauthorized update attempt'
  where id = '11111111-1111-4111-8111-111111111202';
  get diagnostics affected = row_count;
  insert into pg_temp.qa_test_results
  values ('Performance update of clients is denied', affected = 0,
          'Rows affected: ' || affected || '; expected 0.');

  delete from public.clients
  where id = '11111111-1111-4111-8111-111111111202';
  get diagnostics affected = row_count;
  insert into pg_temp.qa_test_results
  values ('Performance delete of clients is denied', affected = 0,
          'Rows affected: ' || affected || '; expected 0.');
end;
$$;

reset role;

select
  count(*) as tests_run,
  count(*) filter (where passed) as tests_passed,
  count(*) filter (where not passed) as tests_failed,
  json_agg(json_build_object(
    'test', test_name,
    'passed', passed,
    'details', details
  ) order by test_name) as results
from pg_temp.qa_test_results;

rollback;
