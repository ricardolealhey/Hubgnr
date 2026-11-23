# HUB GNR — QA Recovery Preflight

**Date:** 2026-11-23  
**Purpose:** Re-entry checklist before resuming end-to-end validation of the HUB GNR core.  
**Scope:** Read-only status snapshot and authorization gates; this document does not authorize service restoration, deployment, Auth changes, data writes, or spending.

## 1. Current verified state

### Supabase
- **HUB GNR QA:** `wbxxqhduiyryjnqcrscp` — `INACTIVE`.
- **HUB GNR principal:** `nnpzzyemxmfcnmiqxvuf` — `INACTIVE`.
- Both project status records returned region `us-east-2` and Postgres `17.11.0.018`.
- Since both projects are inactive, no database, table, policy, function, or Auth validation was performed in this session.
- Historical tests (16 RLS/trigger checks and 6 CRUD checks with synthetic claims/ROLLBACK) are not current validation and are not browser/E2E evidence.

### Netlify
- **QA site:** `hubgnr-qa`, ID `4b57f132-e7fd-472f-8e5a-c0ad1f38de00`.
- Current project metadata shows no published deploy (`currentDeploy` empty), no password requirement, no SSO requirement, and Forms enabled.
- Historical Asana evidence records the last listed QA deploy as `SKIPPED` due to account-credit usage. Do not retry builds or bypass the account limit.
- **Production site:** `hubgnr-e9ah`, ID `d078110d-a95f-4f2b-882e-9cf2b2396455`; project metadata reports the published deploy as `READY`. Do not use production or its preview for Auth/CRUD testing.

### GitHub
- Official repository confirmed: `ricardolealhey/Hubgnr`; default branch `main`.
- CRUD-hardening branch `test/crud-affected-row-shape-2026-11-21` is confirmed **9 commits ahead / 0 behind main**, with four changed files (`package.json`, `src/ManagementModule.jsx`, `src/affectedRows.js`, `tests/affectedRows.test.js`). It is not merged.
- The helper and test file were read from that branch; the six tests were copied into a temporary local harness and rerun with `node --test`: **6/6 passed**. This is unit-test evidence only; it does not validate the Vite build, database, RLS, UI, or E2E.

## 2. Safe recovery sequence

1. **Approval gate:** Ricardo must explicitly authorize a QA service restoration attempt. Do not restore automatically. Stop if the action requires upgrade, paid plan, additional compute, or any non-zero charge.
2. **After restoration only:** re-read project status; then inspect tables, RLS, policies, functions, triggers, migrations, and Advisors. Do not trust the 17/11 snapshot.
3. **QA isolation:** confirm frontend QA variables point exclusively to the QA project. Do not inspect or copy secret values into this document. Never use the main project's preview for sign-in or writes.
4. **Netlify gate:** resolve account-credit limitation without spending. Before any QA publish, Ricardo must choose and authorize the access protection (password or team SSO). The site currently has neither protection enabled.
5. **Build gate:** use a reproducible Node 20 environment; generate and review a lockfile before `npm ci` and `npm run build`. Do not deploy to production.
6. **Test identities gate:** create only controlled synthetic QA accounts after explicit approval. Avoid real member/customer emails.
7. **Invite-function gate:** do not copy the production invite function unchanged. It has production CORS/redirect and email behavior; adapt for QA and a test mail path, review, and obtain explicit approval before deployment or sending.
8. **Governance gate:** Ricardo must decide the Master/Admin model. Existing historical DB inspection showed Admin and Master equivalent in some RLS paths while the invite function allowed only Master; revalidate after QA recovery before changing anything.
9. **Functional validation:** execute the existing E2E matrix (login, session reload/logout, recovery, switch-user and stale async response cases, permissions, CRUD, mobile/desktop, invites) only in isolated QA.
10. **Cleanup:** remove synthetic records/accounts and verify cleanup. Preserve evidence and keep core task open until all acceptance criteria pass.

## 3. Decision needed

**Recommended:** restore the existing QA project only if it can be done without paid upgrade or charge, after Ricardo's explicit approval. If that cannot be guaranteed, keep it inactive and continue with offline/static/unit-test work. Do not create another Supabase project or branch to avoid the block.

## 4. Stop conditions

Stop and report if the project remains inactive, cost confirmation is required, Netlify credits are exhausted, QA protection is undecided, frontend variables are not isolated, or any action would touch production, Auth, RLS, permissions, real users, or email.

**No action performed by this checklist:** restore/pause, plan upgrade, purchase, deploy, merge, production configuration, Auth, RLS, schema, data, invites, or email.
