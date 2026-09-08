# Mini ERP + CRM Operations Portal

Full Stack Developer case study for an internal wholesale/distribution portal.
Phase 0 provides the application skeleton only. Authentication, CRM, inventory,
and Sales Challan workflows are not implemented yet.

## Architecture and stack

React + TypeScript + Vite → Express + TypeScript → Prisma → PostgreSQL.
The repository uses npm workspaces:

- `apps/api/src`: HTTP application, environment validation, database client, and connection check.
- `apps/api/prisma/schema.prisma`: PostgreSQL datasource and Prisma generator.
- `apps/web/src`: minimal responsive React landing page.

Domain models, migrations, seed accounts, controllers, services, and UI modules
will be added in their designated phases. There are no placeholder database tables.
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
npm run db:check
```

`db:check` executes `SELECT 1` through Prisma and exits nonzero on connection
failure. It does not create tables or modify records. No migrations or seeds
exist in Phase 0; the first model and migration belong to Phase 1.

## Environment

| Variable | Purpose |
| --- | --- |
| `NODE_ENV` | `development`, `test`, or `production`; defaults to development |
| `PORT` | API port, 1–65535; defaults to 4000 |
| `DATABASE_URL` | Required PostgreSQL connection URL including database name |
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | Local Docker database initialization; must match `DATABASE_URL` |
| `CORS_ORIGIN` | Required exact frontend HTTP(S) origin, without a trailing slash |
| `JWT_SECRET`, `JWT_EXPIRES_IN` | Reserved example values for Phase 1; not used or validated yet |
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

## Verification and production build

```sh
npm run typecheck
npm run build
npm run start --workspace @mini-erp/api
```

API output is `apps/api/dist`; frontend output is `apps/web/dist`.
For a local frontend build preview: `npm run preview --workspace @mini-erp/web`.
Preview is not a production hosting server. Automated business tests will be
introduced with the corresponding modules. See `memory.md` for actual checks.

## Assumptions and limitations

- Required roles will be Admin, Sales, Warehouse, and Accounts; no login accounts exist yet.
- Phase 0 contains no business workflows or stock mutations.
- Prisma CLI and client use the same pinned version for reproducible generation.
- Router, Axios, form, and authentication libraries are deferred until needed.
- No deployed URLs, Postman collection, or demo recording yet. Delivery work is Phase 6.
- Bonus features remain deferred until the required submission is complete.

## Deployment and submission (pending Phase 6)

Document frontend/API hosting, PostgreSQL provider, production environment,
migration/seed commands, role credentials, API documentation, and submission
links here when those exist. No deployment is claimed at this stage.
