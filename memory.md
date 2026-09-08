# Project Memory — Mini ERP + CRM Operations Portal

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

`Phase 1 — Database, Authentication, and Roles`

Status: **COMPLETE — migrations, demo accounts, auth APIs, and 36 integration tests verified**

Next target:

- Stop before Phase 2. Customer CRM is the next phase only when requested.

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

## 6. Database / Migration State

Prisma 6.19.0 User model with id, name, unique email, passwordHash, role, and timestamps.
Role enum: ADMIN, SALES, WAREHOUSE, ACCOUNTS.
Applied migrations: `20260908171647_init` (pre-existing and already applied when
Phase 1 began) and `20260908180000_add_user_name` (new, backfills name from email).
Initial migration was preserved unchanged. Docker PostgreSQL schema is up to date.
Four demo accounts seeded and verified; integration-test users were cleaned up.

Planned entities:

- User
- Customer
- CustomerFollowUp
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
- No CRM/inventory/challan endpoints.

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
Role authorization is tested on test-only routes; no artificial production admin route.
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
Backend typecheck: PASS (npm run typecheck; includes source, seed, tests, and Vitest config)
Backend tests: PASS (npm test: 36 tests, one suite; real database fixtures)
Backend build: PASS (npm run build)
Frontend typecheck: PASS (npm run typecheck)
Frontend tests: Not run; no test suite yet
Frontend build: PASS (npm run build)
Manual smoke test: PASS for all four demo login/me flows on built API; prior Phase 0 health/frontend serving passed; browser visual QA not run
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

Update this section if implementation/evaluator expectations establish different behavior.

## 14. Known Issues / Blockers

- No outstanding Phase 1 blocker; all requested checks passed.
- npm/Prisma downloads required sandbox escalation. Installation and generation
  succeeded after escalation.
- `tsx` initially failed inside the Windows sandbox (`uv_os_get_passwd ENOMEM`);
  API dev startup passed outside that restriction. The retried database check
  reached the application but reported connection failure before Docker setup.
  The check now passes with the Docker database outside the sandbox restriction.

## 15. Pending Work

- Phase 0 complete; no further Phase 0 work pending.
- Phase 1 auth complete.
- Phase 2 customer CRM.
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
