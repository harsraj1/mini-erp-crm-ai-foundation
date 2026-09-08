# Mini ERP + CRM Operations Portal

Full Stack Developer case study for an internal wholesale/distribution portal.
Phases 0–1 provide the application skeleton, database users, JWT authentication,
and role middleware. CRM, inventory, Sales Challan, and the login UI are not implemented yet.

## Architecture and stack

React + TypeScript + Vite → Express + TypeScript → Prisma → PostgreSQL.
The repository uses npm workspaces:

- `apps/api/src`: HTTP application, environment validation, database client, and connection check.
- `apps/api/prisma/schema.prisma`: PostgreSQL datasource and Prisma generator.
- `apps/web/src`: minimal responsive React landing page.

The API separates auth routes/controllers, validation, services, and middleware.
The User model and migrations exist; other domain models and UI modules remain deferred.
See `prd.md`, `architecture.md`, `rules.md`, `phases.md`, and `design.md` for constraints.

## Prerequisites

- Node.js 22.12+ and npm (Node 22 LTS recommended).
- Docker Desktop running Linux containers (for the included PostgreSQL setup),
  or an existing PostgreSQL server and database credentials.

## Local setup

From the repository root:

```sh
npm install
```

Copy `apps/api/.env.example` to `apps/api/.env`, and
`apps/web/.env.example` to `apps/web/.env`. In PowerShell:

```powershell
Copy-Item apps/api/.env.example apps/api/.env
Copy-Item apps/web/.env.example apps/web/.env
```

Do not overwrite existing `.env` files if you already configured them.
The example contains local development credentials matching the Docker setup.
Do not commit `.env` files or use these example credentials in production.

Generate a random JWT secret with the command below and set `JWT_SECRET` in
`apps/api/.env` to its output. The API rejects missing, short, or placeholder secrets.
Use a separate secret for every environment; never commit it.

```sh
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

Start Docker Desktop, then run:

```sh
npm run db:up
```

This starts PostgreSQL 16, creates `mini_erp` on the first run, and waits for its
health check. The API and frontend continue to run locally with npm. PostgreSQL
is published only on `127.0.0.1:5432`; ensure that port is available.
The named Docker volume preserves data across container restarts.

To stop the database without removing its data: `npm run db:stop`.
Run `npm run db:up` again to restart it. PostgreSQL initialization variables
apply only to a new volume; changing them later does not change existing database
credentials. Keep `POSTGRES_*` and `DATABASE_URL` consistent.

If using an existing PostgreSQL server instead, skip `db:up`, create `mini_erp`
using your database administration tool, and set `DATABASE_URL` to that server.
URL-encode special characters in credentials.

```sh
npm run db:generate
npm run db:validate
npm run db:migrate
npm run db:check
```

`db:check` executes `SELECT 1` through Prisma and exits nonzero on connection
failure. It does not create tables or modify records. `db:migrate` applies pending
Prisma migrations without resetting data. The initial User/Role migration is
preserved; a follow-up adds the required name, backfilling existing users from email.

## Environment

| Variable | Purpose |
| --- | --- |
| `NODE_ENV` | `development`, `test`, or `production`; defaults to development |
| `PORT` | API port, 1–65535; defaults to 4000 |
| `DATABASE_URL` | Required PostgreSQL connection URL including database name |
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | Local Docker database initialization; must match `DATABASE_URL` |
| `CORS_ORIGIN` | Required exact frontend HTTP(S) origin, without a trailing slash |
| `JWT_SECRET` | Required random signing secret, at least 32 characters; no fallback |
| `JWT_EXPIRES_IN` | Positive integer followed by s/m/h/d, e.g. `8h` (default) |
| `DEMO_PASSWORD` | Required only when running the demo seed; 12 characters minimum, 72 UTF-8 bytes maximum |
| `VITE_API_BASE_URL` | Reserved frontend API URL for future modules; no API calls yet |

The backend validates configuration before listening and reports invalid field
names without printing secret values. Workspace scripts load the API `.env`
from `apps/api`. The API can start without a reachable database; `/health` is
process liveness, not database readiness. Run `db:check` separately.

## Development

Run these in separate terminals from the repository root:

```sh
npm run dev:api
```

```sh
npm run dev:web
```

Frontend: http://localhost:5173. API: http://localhost:4000.
`GET /health` returns HTTP 200:

```json
{ "success": true, "data": { "status": "ok" } }
```

Unknown routes return JSON 404 errors. Future module routes will use `/api`.

## Authentication and demo accounts

After migration, create demo accounts from PowerShell:

```powershell
$env:DEMO_PASSWORD='DemoOnly-ERP-2026!'
npm run db:seed
Remove-Item Env:DEMO_PASSWORD
```

These are **demo-only credentials**, not production accounts:

| Role | Email | Password |
| --- | --- | --- |
| ADMIN | admin@demo.example.com | DemoOnly-ERP-2026! |
| SALES | sales@demo.example.com | DemoOnly-ERP-2026! |
| WAREHOUSE | warehouse@demo.example.com | DemoOnly-ERP-2026! |
| ACCOUNTS | accounts@demo.example.com | DemoOnly-ERP-2026! |

The seed hashes the environment-supplied password with bcrypt (cost 12). It refuses
to run with `NODE_ENV=production`. Re-running preserves existing accounts and their
passwords, roles, and names; the table applies to accounts first created with the
demo password shown above. No plaintext password is stored in the database.

- `POST /api/auth/login` accepts JSON `email` and `password`. Email is trimmed and
  lowercased; the password is not trimmed. Response: `{ success: true, data: { token, user } }`.
- `GET /api/auth/me` requires `Authorization: Bearer <token>` and returns
  `{ success: true, data: { user } }`.
- User responses contain only `id`, `name`, `email`, and `role`; never `passwordHash`.
- Wrong credentials return 401 `INVALID_CREDENTIALS`; missing, invalid, expired,
  or deleted-user tokens return 401 `UNAUTHORIZED`; invalid login input returns 400
  `VALIDATION_ERROR`. Errors use `{ success: false, error: { code, message } }`
  with field details for validation errors.
- Tokens use HS256 with a subject and expiration. Every authenticated request loads
  the current user and role from PostgreSQL. Auth responses disable caching.
- Future protected routes compose `authenticate` with `authorize(...roles)`;
  disallowed roles receive 403 `FORBIDDEN`. Role checks are tested on a test-only
  route; no artificial admin endpoint is exposed in the production app.

## Verification and production build

```sh
npm run typecheck
npm test
npm run build
npm run start --workspace @mini-erp/api
```

API output is `apps/api/dist`; frontend output is `apps/web/dist`.
For a local frontend build preview: `npm run preview --workspace @mini-erp/web`.
Preview is not a production hosting server. Vitest/Supertest integration tests require
the configured, migrated development PostgreSQL database and valid API environment.
They create randomly named users and clean up only those users; demo accounts are
preserved. Run against a development database, not production. Typecheck covers
API source, seed, and tests. See `memory.md` for actual checks.

## Assumptions and limitations

- All four roles can use the auth API. The frontend is still the Phase 0 placeholder.
- No CRM/inventory/challan workflows or stock mutations exist yet.
- Prisma CLI and client use the same pinned version for reproducible generation.
- Frontend router, Axios, and form libraries are deferred until needed.
- No refresh tokens, password reset, registration, or user-management endpoints in Phase 1.
- No deployed URLs, Postman collection, or demo recording yet. Delivery work is Phase 6.
- Bonus features remain deferred until the required submission is complete.

## Deployment and submission (pending Phase 6)

Document frontend/API hosting, PostgreSQL provider, production environment,
migration/seed commands, role credentials, API documentation, and submission
links here when those exist. No deployment is claimed at this stage.
