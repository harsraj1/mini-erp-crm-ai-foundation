# Project Memory — Mini ERP + CRM Operations Portal

## Current scope — 2026-09-12 Case Study 2

The user authorized Mini Operations ERP from the new PDF, replacing visible CRM/challan navigation while preserving existing code/data. Read [docs/CASE2.md](docs/CASE2.md) first for current requirements; the previous history below is not the current scope. Required Case Study 2 implementation is verified locally. No new deployment or Neon migration was performed.

- Added OPERATIONS role and additive Item/Location/InventoryBalance/InventoryEvent/WorkOrder/InternalTransfer/CustomerOrder schema and migration. Legacy tables remain unchanged; old Product stock is separate from new location/batch inventory.
- `/api/operations` implements catalog/setup, paginated inventory/history, atomic IN/OUT, Admin work-order creation and assigned-user status progression, shortage/alternative-location checks, Requested→Dispatched→Received transfers, and concurrent-safe customer reservation. Row locks, unique request IDs and PostgreSQL CHECK constraints enforce stock safety. Stock/event/status changes share transactions.
- Visible frontend: Login, Inventory, Work Orders, Internal Transfers, Customer Orders. Existing API client/design reused; role-aware forms, confirmation dialogs, validation/errors, duplicate-submit protection, confirmed refresh and responsive tables implemented. Legacy routes remain accessible for compatibility but are absent from main navigation.
- Actual checks: all 124 backend tests (17 new Operations), all 44 frontend tests (eight new Operations), both typechecks and builds PASS. All six migrations applied to fresh isolated PostgreSQL 16 at localhost:55433; Prisma diff reported no difference. Schema validation, seed, SELECT 1 and compiled `/health` PASS.
- Real local browser walkthrough passed for seeded Admin/Operations/Sales: created two locations and Cotton batches; required100 vs local60 showed shortage40; dispatched40 from warehouse50 leaving10, Factory stayed60 until receipt then became100; Sales reserved60, physical stayed100, available40; second50 rejected and input retained. Inspected desktop and390px mobile navigation/table behavior.
- README/current API/ER/schema/assumptions/server docs and demo guide updated. No new libraries, `.env` edits, password changes, commits, push, video recording or external deployment. Preexisting dirty UI changes were preserved. See [full actual checklist and file list](docs/CASE2_RELEASE.md).
- Remaining: user-reviewed migration/Operations account/redeploy to Neon/Render/Vercel, public verification, meaningful reviewed commits and the 5–7 minute demo video. No future live-verification examples (damaged stock, partial receipt, release/cancel reservation, assigned-location restriction) implemented.
- Temporary verification API (4100), Vite (5174) and browser tab were stopped/closed at completion. Local container `mini-erp-case2-test` was stopped with data preserved; it can be restarted with `docker start mini-erp-case2-test`. Normal application setup continues to use the README environment and ports.

> This file is the running handoff context for AI-assisted development.
> Update it after every meaningful milestone. Keep it factual and concise.
> Never claim a feature/test is complete unless it actually is.

## 1. Project Identity

**Project:** Mini ERP + CRM Operations Portal

**Purpose:** Full Stack Developer case-study project for a wholesale/distribution business.

**Deadline:** 48 hours from assignment sharing.

## 2. Assignment Requirements Snapshot

Required stack:

- Node.js
- TypeScript
- Express.js or NestJS
- PostgreSQL or MySQL
- REST APIs
- Validation and error handling
- React
- HTML/CSS
- JavaScript/TypeScript
- Responsive UI
- Environment variables
- GitHub repository with proper commits
- README setup instructions

Required roles:

- Admin
- Sales
- Warehouse
- Accounts

Required core modules:

1. Authentication and Roles
2. Customer CRM
3. Product and Inventory
4. Sales Challan

Critical challan rules:

- Confirmed challan reduces stock.
- Stock cannot go negative.
- Insufficient stock returns a proper error.
- Challan stores product snapshot data.
- Draft should not deduct stock.
- Confirmation should be atomic/idempotent in implementation.

Submission expectations:

- GitHub repository
- Live frontend URL
- Live backend API URL
- Test credentials for all roles
- Postman/API documentation
- README
- Architecture explanation
- Known limitations/incomplete parts

AWS is optional bonus. Free hosting is acceptable.

## 3. Current Architecture Decision

Planned stack:

### Backend
- Express.js + TypeScript
- PostgreSQL
- Prisma
- Zod
- JWT
- bcrypt

### Frontend
- React + TypeScript + Vite
- React Router
- Axios
- React Hook Form + Zod

### Delivery
- Free hosting platform first
- Postman
- GitHub
- Optional Docker only after MVP

## 4. Current Phase

`Phase 2 — Customer CRM`

Status: **COMPLETE — Customer CRM backend and frontend verified**

Next target:

- Phase 2 is complete. Next task, when requested: Phase 3 Product and Inventory.

## 5. Completed Work

- Documentation baseline and initial Git commit.
- npm workspaces: Express/TypeScript API and React/TypeScript/Vite frontend.
- Strict TypeScript, dev/build/typecheck scripts, lockfile, and `.gitignore`.
- Backend environment validation, configured CORS, JSON errors, and `GET /health`.
- Prisma PostgreSQL datasource/client and a read-only `SELECT 1` connection check.
- Minimal responsive frontend placeholder and setup README.
- User/Role Prisma schema, preserved initial migration, additive name migration.
- Demo seed with bcrypt hashes for ADMIN, SALES, WAREHOUSE, and ACCOUNTS.
- JWT login/me APIs, authentication/authorization middleware, centralized errors.
- 36 database-backed auth tests; demo credentials verified through the built API.
- Customer CRUD (create/read/update), paginated search/filter list, timestamped
  follow-up history with safe author metadata, and transactional schedule updates.
- 47 CRM integration tests; 83 total backend tests pass.
- Customer CRM frontend: API client, session restoration/login, responsive list with search/pagination/status/type filters, create/edit forms, detail/history view, follow-up form, loading/empty/error states, and role-aware controls.
- 15 frontend tests cover auth/session, list queries, empty/error states, role UI, form validation/error preservation, duplicate-submit prevention, and follow-ups.

## 6. Database / Migration State

Prisma 6.19.0 User model with id, name, unique email, passwordHash, role, and timestamps.
Role enum: ADMIN, SALES, WAREHOUSE, ACCOUNTS.
Applied migrations: `20260908171647_init` (pre-existing and already applied when
Phase 1 began) and `20260908180000_add_user_name` (new, backfills name from email).
Initial migration was preserved unchanged. Docker PostgreSQL schema is up to date.
Four demo accounts seeded and verified; integration-test users were cleaned up.
Customer/CustomerFollowUp models, CustomerType and CustomerStatus enums added.
Migration `20260908174149_customer_crm` generated by Prisma and applied without
resetting existing data. All three migrations are applied. Follow-ups reference
Customer and User with restrictive deletion; indexes support list/history lookup.
CRM test fixtures were cleaned up; no demo customer records were added.

Entities still pending:

- Product
- StockMovement
- Challan
- ChallanItem

## 7. API State

- `GET /health` returns `{ "success": true, "data": { "status": "ok" } }`.
- Liveness only; use `npm run db:check` for database connectivity.
- JSON 404 and malformed-body 400 handling verified.
- `POST /api/auth/login`: validates credentials; returns token and safe user.
- `GET /api/auth/me`: authenticates bearer token; returns current safe user.
- Auth errors: 400 VALIDATION_ERROR, 401 INVALID_CREDENTIALS/UNAUTHORIZED,
  403 FORBIDDEN. Unexpected failures remain safe 500 responses.
- Customer endpoints: GET/POST `/api/customers`, GET/PATCH `/api/customers/:id`,
  POST `/api/customers/:id/follow-ups`. Read/write success uses the existing envelope.
- List returns `data: { customers, pagination: { page, limit, total, totalPages } }`;
  create/detail/update return `data: { customer }`; follow-up returns `data: { followUp }`.
- Search across name/mobile/email/business, case-insensitive literal substring;
  query `status` and `customerType` filters combine with search. Defaults page=1,
  limit=20; max page=1,000,000 and limit=100. Deterministic newest-first ordering.
- Admin/Sales read/write; Accounts read only; optional Warehouse customer access disabled.
- Invalid input/IDs: 400 VALIDATION_ERROR; valid missing customer: 404 CUSTOMER_NOT_FOUND.
- No inventory/challan endpoints.

## 8. Frontend State

React/TypeScript/Vite scaffold with a responsive placeholder page.
No module screens or API calls yet. `VITE_API_BASE_URL` is reserved for later work.

## 9. Authentication State

Implemented using bcrypt (cost 12) and HS256 JWTs with subject/expiration.
JWT secret is environment-only, at least 32 characters, and placeholders are rejected.
JWT lifetime defaults to 8h; configured as a positive integer with s/m/h/d suffix.
Every authenticated request loads the current database user/role; hashes never
appear in API responses. Deleted-user, invalid, and expired tokens return 401.
Reusable role middleware returns 403 for authenticated users with disallowed roles.
Role authorization is enforced on customer routes and tested across all four roles;
no artificial production admin route exists.
Demo seed requires DEMO_PASSWORD, refuses production, and preserves existing users.
Demo emails/password are documented in README. No login UI yet.

Required seeded roles:

- Admin
- Sales
- Warehouse
- Accounts

## 10. Tests / Build Status

Actual verification on 2026-09-08:

Use this exact format after each run:

```text
Backend typecheck: PASS (npm run typecheck --workspace @mini-erp/api; initial test-helper typing error fixed)
Backend tests: PASS (npm test: 83 tests, 2 suites; 47 CRM and 36 auth)
Backend build: PASS (npm run build --workspace @mini-erp/api)
Frontend typecheck: PASS (`npm run typecheck --workspace @mini-erp/web`)
Frontend tests: PASS (`npm run test --workspace @mini-erp/web`, 15 tests)
Frontend build: PASS (`npm run build --workspace @mini-erp/web`)
Manual smoke test: PASS in browser for Sales login, customer create/edit/detail, follow-up, search, Accounts read-only detail, and 390px mobile layout/table scroll. Warehouse UI access and API error states were covered by automated tests.
```

Do not replace `not run` with `pass` unless command output proves it.

## 11. Environment / Deployment State

Node v26.5.0 and npm 11.17.0 available; dependencies installed.
Both `.env.example` files exist. Ignored `apps/api/.env` now configures the local
Docker database. PostgreSQL 16 is running in `mini-erp-crm-db-1`, bound to
127.0.0.1:5432 with persistent volume `mini-erp-crm_postgres-data`.
Use `npm run db:up` / `npm run db:stop` to manage it. No deployment performed.

Production URLs:

```text
Frontend:
Backend:
Database provider:
```

## 12. Decisions Made

### Decision 001
Use Express rather than NestJS to reduce setup/boilerplate within a 48-hour case study.

### Decision 002
Use PostgreSQL because inventory/challan workflows benefit from relational constraints and transactions.

### Decision 003
Use Prisma to accelerate schema, migrations, seed data, and typed DB access.

### Decision 004
Implement core requirements before assignment bonus features.

## 13. Assumptions

Current assumptions:

1. Admin can access all core modules.
2. Sales manages customers/follow-ups and challans.
3. Warehouse manages product/inventory adjustments.
4. Accounts receives read access to relevant operational records in the MVP.
5. Confirmed challans are not cancellable unless stock reversal is explicitly implemented.
6. Purchase-order and complete invoice modules are outside the required MVP unless time remains.
7. Warehouse customer read access is disabled (optional in architecture.md).
8. Customer email/mobile are not unique. Mobile uses 7–15 digits with optional +;
   GST is optional with 15-character alphanumeric format validation only.
9. Follow-up date accepts date-only UTC or ISO timestamp with offset; omitted date
   preserves the customer's schedule, explicit null clears it. Notes are independent
   history; customer profile edits do not rewrite follow-ups.

Update this section if implementation/evaluator expectations establish different behavior.

## 14. Known Issues / Blockers

- No outstanding CRM backend blocker; frontend remains outside this task's scope.
- npm/Prisma downloads required sandbox escalation. Installation and generation
  succeeded after escalation.
- `tsx` initially failed inside the Windows sandbox (`uv_os_get_passwd ENOMEM`);
  API dev startup passed outside that restriction. The retried database check
  reached the application but reported connection failure before Docker setup.
  The check now passes with the Docker database outside the sandbox restriction.

## 15. Pending Work

- Phase 0 complete; no further Phase 0 work pending.
- Phase 1 auth complete.
- Phase 2 customer CRM backend and frontend complete.
- Phase 3 product/inventory.
- Phase 4 sales challan.
- Phase 5 frontend integration/dashboard.
- Phase 6 documentation/deployment/submission.
- Phase 7 bonus only if safe.

## 16. Memory Update Template

Append/update this file after each meaningful coding session:

```md
### YYYY-MM-DD — <Milestone>

**Phase:**  
**Status:** COMPLETE / PARTIAL / BLOCKED

**Implemented**
- ...

**Files changed**
- ...

**Database changes**
- ...

**API changes**
- ...

**Frontend changes**
- ...

**Commands/tests actually run**
- `...` → PASS/FAIL

**Important decisions**
- ...

**Known issues**
- ...

**Next exact task**
- ...
```

Keep old major decisions; remove stale transient details when they no longer help continuation.

### 2026-09-08 — Phase 0 skeleton

**Phase:** 0
**Status:** PARTIAL (database connectivity gate outstanding)

**Files changed**
- Root: `.gitignore`, `package.json`, `package-lock.json`, `README.md`, `memory.md`.
- API: `package.json`, `tsconfig.json`, `.env.example`, `prisma/schema.prisma`,
  `src/app.ts`, `src/server.ts`, `src/config/env.ts`, `src/config/database.ts`,
  `src/scripts/check-db.ts`.
- Web: `package.json`, `tsconfig.json`, `.env.example`, `vite.config.ts`,
  `index.html`, `src/vite-env.d.ts`, `src/main.tsx`, `src/App.tsx`,
  `src/styles/global.css`.

**Commands/checks actually run**
- `node --version`, `npm --version`: PASS (26.5.0 / 11.17.0).
- Registry metadata lookup (`npm view prisma@6 version --json`): FAIL, sandbox EACCES;
  it was not needed after successful installation.
- `npm install --no-audit --no-fund`: PASS after network escalation (189 packages).
- `npm run typecheck --workspace @mini-erp/web`: PASS.
- `npm run typecheck`: initial FAIL at Prisma engine download; rerun PASS after generation.
- `npm run db:generate`: PASS after network escalation.
- `npm run build --workspace @mini-erp/web`: PASS.
- `npm run build`: PASS for both workspaces.
- `npm run db:validate`: PASS with a placeholder PostgreSQL URL.
- `npm run db:check`: FAIL initially in sandbox tsx; FAIL on retry because local
  PostgreSQL was unavailable. No successful database connection is claimed.
- `npm run start --workspace @mini-erp/api`: PASS on test port 4010.
- `npm run dev:api`: PASS outside sandbox on test port 4011.
- `npm run dev:web`: PASS on port 5173. An earlier invocation with extra `--host`
  arguments forwarded incorrectly through npm; stopped it and used the documented command.
- PowerShell `Invoke-WebRequest http://localhost:4010/health`: PASS, HTTP 200.
- Inline `node --input-type=module` assertions: PASS for invalid/missing env,
  secret-safe errors, dev/production health, CORS, JSON 404/400, Vite HTML and
  transformed React module. No browser interaction or visual QA was performed.
- `git diff --check` (with a command-scoped safe.directory exception): PASS.

**Decisions**
- Keep liveness separate from database verification; API startup does not imply
  PostgreSQL readiness. Database check uses Prisma `SELECT 1` without schema writes.
- Pin Prisma CLI/client together. Do not introduce placeholder models, migrations,
  authentication, or unused UI libraries in Phase 0.
- No commit or deployment was made. Phase 1 remains untouched.

**Next exact task**
- Configure a reachable PostgreSQL database and run `npm run db:check`; then update
  this status based on the real result before any Phase 1 work.

### 2026-09-08 — Local Docker database verification

**Phase:** 0
**Status:** COMPLETE

- User explicitly authorized PostgreSQL through Docker to finish the foundation.
  This is local database provisioning; full application containerization remains deferred.
- Added `compose.yaml` with PostgreSQL 16, loopback-only port publishing, persistent
  volume, and readiness health check. Added `db:up` and `db:stop` npm scripts.
- Updated `apps/api/.env.example` and README. Created ignored `apps/api/.env`
  from the example because none existed; no existing configuration was overwritten.
- `docker compose --env-file apps/api/.env config --quiet`: PASS (sandbox Docker
  config-access warning only).
- `npm run db:up`: PASS outside sandbox; container healthy.
- `npm run db:check`: PASS outside sandbox; Prisma `SELECT 1` succeeded.
- `npm run db:validate`: PASS using the local `.env`.
- `git diff --check`: PASS; `git check-ignore apps/api/.env`: PASS.
- No dependency or TypeScript changes; prior passing typecheck/build results were
  not rerun for this configuration/documentation change.
- Database left running. No Phase 1 implementation, migration, or seed added.
- Files changed this follow-up: `compose.yaml`, `package.json`,
  `apps/api/.env.example`, ignored `apps/api/.env`, `README.md`, `memory.md`.

### 2026-09-08 — Phase 1 authentication and roles

**Phase:** 1
**Status:** COMPLETE

**Implemented and decisions**
- Preserved pre-existing bcrypt/jsonwebtoken dependencies and initial User migration;
  memory previously omitted these local changes. Reconciled Prisma schema and added
  a non-destructive name migration. No database reset was performed.
- Thin auth controllers, Zod login validator, auth service, typed request user,
  JWT authentication and role middleware, reusable centralized error handler.
- Safe user projection includes only id/name/email/role. Login normalizes email,
  preserves password whitespace, and rejects inputs over bcrypt's 72-byte limit.
- JWT signing key generated locally in ignored apps/api/.env without displaying it.
  No production secret or token was committed. JWT roles are not authoritative;
  current database roles control authorization.
- Seed creates four demo accounts from environment-supplied DEMO_PASSWORD with
  bcrypt hashes. Existing accounts are not reset. README includes demo-only credentials.
- Vitest/Supertest tests create unique fixture users in the configured development
  database and delete only those users. No destructive database cleanup.
- Frontend remains unchanged; Phase 2 has not started.

**Files changed**
- Root package.json/package-lock.json, README.md, memory.md.
- API package.json, .env.example, ignored .env, prisma/schema.prisma,
  prisma/migrations/20260908180000_add_user_name/migration.sql, prisma/seed.ts.
- API src/app.ts, src/config/env.ts, src/controllers/auth.controller.ts,
  src/routes/auth.routes.ts, src/services/auth.service.ts,
  src/validators/auth.validator.ts, src/middleware/auth.middleware.ts,
  src/middleware/authorize.middleware.ts, src/middleware/error.middleware.ts,
  src/types/express.d.ts, src/utils/app-error.ts.
- API tests/auth.test.ts, vitest.config.ts, tsconfig.check.json.
- Existing initial migration and migration_lock.toml remain preserved and untracked
  alongside the new files until the user commits them.

**Commands actually run**
- npm install -D --workspace @mini-erp/api @types/bcrypt@^6 @types/jsonwebtoken@^9 vitest@^3 supertest@^7 @types/supertest@^6 --no-audit --no-fund: PASS.
- npm run db:migrate: PASS; applied additive name migration; initial migration already applied.
- npm run db:generate: PASS.
- npm run db:seed with demo-only DEMO_PASSWORD: PASS.
- npm test: PASS, 36 tests. Covers four-role login/me, safe fields and stored hashes,
  wrong/unknown credentials, malformed input, missing/expired/invalid tokens,
  missing expiration/subject, unknown users, algorithm/signature rejection,
  401/403 role boundaries, current roles versus JWT claims, safe database errors,
  environment validation, and health/404/malformed JSON regressions.
- npm run typecheck: PASS, API and frontend.
- npm run build: PASS, API and frontend.
- npm run db:validate: PASS.
- npx prisma migrate status (apps/api): PASS, database schema up to date.
- npm run start --workspace @mini-erp/api: PASS, built server on port 4000.
- Inline Node HTTP checks: PASS for all four README demo login/me flows; tokens
  and hashes were not printed. Verification server stopped afterward.
- git diff --check: PASS. Network/database/test execution used sandbox escalation
  where needed; no test failures occurred in this phase.

**Next exact task**
- Await authorization for Phase 2 Customer CRM. No further Phase 1 work pending.

### 2026-09-08 — Phase 2 Customer CRM backend

**Status:** Backend COMPLETE; Phase 2 PARTIAL until frontend is implemented.

**Implemented**
- Customer and CustomerFollowUp models and additive Prisma migration.
- All five requested endpoints, Zod body/query/ID validation, optional/null fields,
  date handling, search/filter pagination, role checks, safe history author projection.
- Adding a follow-up and updating the schedule are transactional; failed history
  insertion rolls back schedule changes. No history edit/delete endpoint.
- Read permissions: ADMIN/SALES/ACCOUNTS. Writes: ADMIN/SALES. WAREHOUSE denied.
- README documents payloads, envelopes, query defaults, validation and date semantics.
- No frontend, dependency, seed, auth behavior, inventory, or challan changes.

**Files changed**
- apps/api/prisma/schema.prisma
- apps/api/prisma/migrations/20260908174149_customer_crm/migration.sql
- apps/api/src/app.ts
- apps/api/src/controllers/customer.controller.ts
- apps/api/src/routes/customer.routes.ts
- apps/api/src/services/customer.service.ts
- apps/api/src/validators/customer.validator.ts
- apps/api/tests/customer.test.ts
- README.md and memory.md

**Commands actually run**
- npx prisma migrate dev --name customer_crm --create-only --skip-generate --skip-seed
  (apps/api): PASS; generated additive SQL, reviewed before applying.
- npm run db:migrate: PASS; applied CRM migration to Docker PostgreSQL.
- npm run db:generate: PASS.
- npm test: PASS initially and on final rerun; 83 tests across two suites.
- npm run typecheck --workspace @mini-erp/api: initial FAIL due to unknown-typed test
  helper argument; corrected to object; rerun PASS.
- npm run build --workspace @mini-erp/api: PASS.
- npx prisma migrate status (apps/api): PASS, schema up to date (3 migrations).
- git diff --check: PASS; diff of apps/web empty.

**Test evidence**
- 47 CRM tests cover create/detail/edit, omitted GST, normalization/null clearing,
  required fields/enums/mobile/email/GST/dates, invalid and absent IDs, search in
  all four fields, combined filters, stable pages/counts, empty results, literal
  SQL wildcard search, invalid pagination/query, retained follow-up notes/authors,
  unchanged profile notes, date omission/clearing, transaction rollback, forbidden
  author injection, and all five endpoints for all four roles and missing auth.
- Fixtures are isolated and cleaned up; the existing 36 auth tests still pass.

**Next exact task**
- Customer CRM frontend complete; begin Phase 3 Product and Inventory only when explicitly requested.

### 2026-09-08 — Phase 2 Customer CRM frontend

**Phase:** 2  
**Status:** COMPLETE

**Implemented**
- Shared Axios client, session handling, login, responsive customer list, search, pagination, filters, create/edit forms, detail/history view, and follow-up form.
- Role-aware UI: Admin/Sales write, Accounts read-only, Warehouse access message. Backend remains authoritative.
- Loading, empty, API-error, visible validation, field-error mapping, and disabled-submit states.
- 15 frontend tests and live browser verification for Sales and Accounts, including mobile layout.
- No inventory, challan, dashboard, or unrelated backend changes.

**Commands actually run**
- `npm install --workspace @mini-erp/web axios react-router-dom react-hook-form @hookform/resolvers zod --no-audit --no-fund` → PASS.
- `npm install -D --workspace @mini-erp/web vitest jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom --no-audit --no-fund` → PASS.
- `npm run typecheck --workspace @mini-erp/web` → PASS.
- `npm run test --workspace @mini-erp/web` → PASS (15 tests, 2 suites).
- `npm run build --workspace @mini-erp/web` → PASS (120 modules).
- `git diff --check` → PASS.

**Browser smoke evidence**
- Sales demo login, customer create/edit/detail, follow-up, search → PASS against local API/PostgreSQL.
- Accounts sign-in and read-only detail → PASS.
- 390px viewport navigation and table scrolling → PASS.
- Temporary browser verification customer remains as a local development record; it is not seed/demo data.

**Next exact task**
- Begin Phase 3 Product and Inventory only when explicitly requested.

## Phase 3 update (2026-09-08)

- Implemented Product and StockMovement Prisma models and applied migration `20260908182431_product_inventory`.
- Added product list/search/category, create, edit, detail, stock movement history, and transactional stock adjustment endpoints.
- Stock reads/history are available to all roles; product writes and adjustments are restricted to ADMIN and WAREHOUSE. IN increases stock, OUT rejects negative results with `INSUFFICIENT_STOCK`, and accepted adjustments write a movement log in the same transaction.
- Phase 3 frontend and challans remain pending. No challan or bonus work was started.
- Verification: `npm run db:generate` PASS; `npm run db:migrate` PASS; `npm test` PASS (83 existing auth/CRM tests; no product test file was present in the repository); `npm run typecheck` PASS; `npm run build` PASS. Prisma migration creation via CLI failed with EPERM, so the migration SQL was added manually and deployed successfully.
- Added `apps/api/tests/product.test.ts` covering product creation, duplicate SKU, IN, valid OUT, insufficient OUT, and movement history. Updated verification: `npm test --workspace @mini-erp/api` PASS (87 tests across auth, CRM, and product suites).

### 2026-09-09 — Phase 3 Product and Inventory frontend

**Status:** COMPLETE

- Added product list, search, pagination-ready API integration, add/edit forms, detail view, low-stock indicators, stock adjustment form, and movement history.
- Product writes and stock adjustments are role-aware for ADMIN/WAREHOUSE; all authenticated roles can read inventory. Stock display refreshes from the API after successful adjustments.
- Frontend checks: `npm run typecheck --workspace @mini-erp/web` PASS; `npm run build --workspace @mini-erp/web` PASS.
- Challan work remains pending; no invoice/PDF features added.

### 2026-09-09 — Phase 4 Sales Challan backend

**Status:** Backend COMPLETE after the verification update below; Phase 4 frontend remains pending.

- Added Challan/ChallanItem models with draft, confirmed, and cancelled states, unique generated challan numbers, customer/creator relations, totals, and immutable product snapshots.
- Added `/api/challans` list/create/detail/confirm/cancel endpoints. Draft creation does not change stock. Confirmation validates all lines and atomically deducts stock, writes OUT movements, and prevents repeat confirmation.
- `npm run db:migrate`, `npm run db:generate`, `npm run typecheck`, `npm run build`, and `npm test` PASS (87 existing tests). The requested dedicated challan tests were not present and still need implementation before declaring this phase complete.

### 2026-09-09 — Phase 4 backend verification and concurrency fixes

- Added `apps/api/tests/challan.test.ts`: 10 integration tests covering draft stock, multiple products, OUT logs, insufficient stock, rollback after failed movement insertion, sequential/concurrent duplicate confirmation, competing drafts, cancel/confirm races, snapshot preservation, validation and authenticated listing.
- Corrected the earlier claim of duplicate protection: the previous implementation was unsafe under concurrency. Confirmation now locks the challan row and product rows in sorted order; cancellation uses the same challan lock. Explicit inventory adjustments lock the product row so they cannot overwrite concurrent challan deductions.
- Generated challan numbers now use UUIDs backed by the existing unique constraint. Quantity/total bounds and strict create payload validation were added; missing product references fail without deduction.
- Actual checks: initial `npm test` failed because PostgreSQL was stopped; `npm run db:up` failed in the sandbox, then passed with escalation. `npm test` subsequently PASS (97 tests in 4 suites). Full `npm run typecheck` and `npm run build` PASS. After final validation guards, focused challan tests PASS (10), API typecheck PASS, and API build PASS.
- Files changed: challan.service.ts, challan.validator.ts, product.service.ts, tests/challan.test.ts, README.md, memory.md. No new migration required.
- Backend completion gate is satisfied. The full Phase 4 milestone still includes the unimplemented challan frontend; no frontend completion is claimed.

### 2026-09-09 — Phase 4 challan frontend

- Implemented challan list with status filter/pagination, customer/product selection across all API pages, dynamic product rows, available stock/price display, quantity totals, draft saving, saved detail, status badges and confirmation dialog.
- Creation intentionally follows the actual API's two-step flow: Save Draft, then Confirm Challan on the server-created record. Failed confirmation retains the draft and line snapshots; retry uses its existing ID. No client-side stock deductions occur.
- Mutation buttons use synchronous request guards and disabled pending states. Form values survive failed saves. Confirmation displays API errors, including insufficient stock, inside the dialog.
- Added role-aware routes/navigation: ADMIN/SALES write; all authenticated roles read challans. Corrected the existing Warehouse shell gate so it applies only to customer paths.
- Responsive line forms and horizontally scrolling tables reuse existing design styles; native modal dialog provides keyboard focus containment.
- Files: apps/web/src/api/challans.ts, pages/challans/Challans.tsx, tests/challans.test.tsx, App.tsx, styles/global.css, memory.md.
- Actual checks: frontend tests PASS (18 across 3 suites), frontend typecheck PASS, frontend build PASS. Three new tests cover draft/confirm recovery, dynamic rows and form preservation, and loading/empty lists. No live browser smoke test was performed this session.
- Requested Phase 4 frontend implemented. No invoice/PDF features or Phase 5 work started.

### 2026-09-09 — Phase 5 shell, dashboard and integration

- Added Dashboard route and default landing route, navigation entry, module-aware topbar and role identity. Existing authenticated shell and server authorization remain in force; Warehouse customer restrictions remain intact.
- Metrics are derived from existing APIs: customer/lead totals where permitted, product total, low-stock count over all product pages, draft/confirmed totals. No fabricated metrics or analytics endpoints. Errors are displayed rather than replaced by zero counts.
- Integrated responsive metric cards, table scrolling and stock-adjustment surface styles. Fixed missing product search, added pagination, prevented simultaneous adjustment submissions and removed stock editing from the product master form.
- Added 13 frontend integration tests for all four roles, dashboard failure handling and product/challan actions. Added a backend test enforcing challan read/write permissions and successful confirmation for Admin/Sales.
- Commands: full typecheck PASS; full build PASS; frontend tests PASS (31 in 4 suites); full backend tests PASS (97 before the new role test); final focused challan suite PASS (11 including the new role test).
- Files: App.tsx, pages/dashboard/Dashboard.tsx, pages/products/ProductList.tsx, pages/products/ProductForm.tsx, styles/global.css, tests/integration.test.tsx, apps/api/tests/challan.test.ts, memory.md.
- Automated integration checks pass. Live desktop/mobile browser verification and console inspection were not performed; this remains an explicit manual verification gap for the Phase 5 acceptance checklist. No Phase 6 work started.

### 2026-09-09 — Release-readiness review

- True status: automated gates pass; release sign-off remains open for browser/responsive checks, existing demo password verification, clean setup, and deployment checks. See docs/RELEASE.md for PASS/FAIL evidence and known limitations.
- Updated README to reflect implemented modules; added docs/API.md and docs/SERVER.md covering endpoints, response differences, local/server setup, environment, deployment procedure and assumptions.
- Fixed product price validation and stock quantity overflow boundaries without expanding scope. Added six focused product validation tests.
- Actual results: full backend suite 98 PASS; frontend 31 PASS; focused new validation suite 6 PASS; build PASS; typecheck initially failed with Prisma DLL EPERM while tests ran, subsequent retry PASS; schema validation PASS; migration status up to date (five migrations).
- Files changed: README.md, docs/API.md, docs/SERVER.md, docs/RELEASE.md, apps/api/src/validators/product.validator.ts, apps/api/src/services/product.service.ts, apps/api/tests/product-validation.test.ts, memory.md.
- No deployment or live browser smoke test claimed. Do not treat earlier phase completion labels as proof that these remaining release gates passed.

### 2026-09-09 — GitHub upload preparation

- Added repository-root `vercel.json` with the requested SPA rewrite to `/index.html`.
- Prepared source, package-lock.json, documentation, and all five Prisma migrations for GitHub. Actual `.env` files remain ignored; tracked `.env.example` files contain setup defaults only.
- Vercel JSON verification PASS; frontend production build PASS. Full build is blocked locally by an EPERM error replacing the Prisma engine DLL, including on retry outside the sandbox. No deployment is claimed.

### 2026-09-09 — Draft challan cancellation UI

- Added Cancel Challan beside Confirm Challan on saved drafts/detail, using the existing POST /api/challans/:id/cancel API. Admin/Sales only; backend remains authoritative.
- Shared action dialog asks for confirmation, prevents simultaneous/double submissions, retains errors for retry and uses returned status. Cancellation does not change stock. Confirmed/cancelled records expose no mutation actions.
- Corrected the saved-record message for CANCELLED so it does not incorrectly report confirmation.
- Files: apps/web/src/api/challans.ts, pages/challans/Challans.tsx, styles/global.css, tests/challans.test.tsx, memory.md.
- Actual verification: frontend tests PASS (33), frontend typecheck PASS, frontend production build PASS. No backend changes, database writes or deployment performed. Publish the frontend changes to Vercel to expose the button on the hosted application.
