# Mini ERP + CRM Operations Portal

Full Stack Developer case study for an internal wholesale/distribution portal.
Authentication, Customer CRM, inventory, Sales Challan and the operations dashboard are implemented. See docs/RELEASE.md for verified checks and remaining release gates.

## Architecture and stack

React + TypeScript + Vite → Express + TypeScript → Prisma → PostgreSQL.
The repository uses npm workspaces:

- `apps/api/src`: HTTP application, environment validation, database client, and connection check.
- `apps/api/prisma/schema.prisma`: PostgreSQL datasource and Prisma generator.
- `apps/web/src`: React module screens, protected routes and dashboard.

The API separates auth/customer routes, controllers, validation, services, and middleware.
User, Customer, CustomerFollowUp, Product, StockMovement, Challan and ChallanItem models and migrations exist.
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
| `VITE_API_BASE_URL` | Frontend API base URL, including /api; embedded at Vite build time |

The backend validates configuration before listening and reports invalid field
names without printing secret values. Workspace scripts load the API `.env`
from `apps/api`. The API can start without a reachable database; `/health` is
process liveness, not database readiness. Run `db:check` separately.

## Development

### Product and inventory API (Phase 3 backend)

Products are available at `/api/products` (list/search/category, create, edit, detail). Stock history is available at `/api/stock-movements`; adjustments use `POST /api/products/:id/stock-movements` with `{ quantityChanged, movementType: "IN" | "OUT", reason }`. Product reads and movement history are available to all authenticated roles; product writes and adjustments are restricted to `ADMIN` and `WAREHOUSE`. `OUT` adjustments reject insufficient stock with `409 INSUFFICIENT_STOCK`; accepted adjustments update stock and create a movement record atomically.

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

Unknown routes return JSON 404 errors. Module routes use `/api`.

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
- Protected routes compose `authenticate` with `authorize(...roles)`;
  disallowed roles receive 403 `FORBIDDEN`. Customer endpoints enforce the role
  matrix below; no artificial admin endpoint is exposed in the production app.

## Customer CRM API

All routes require a bearer token. Admin/Sales can read and write; Accounts can
read only. The architecture's optional Warehouse customer read access is disabled.
Read access includes follow-up history. Denied roles receive 403; missing auth 401.

| Method | Path | Result |
| --- | --- | --- |
| GET | `/api/customers` | 200, `data: { customers, pagination }` |
| POST | `/api/customers` | 201, `data: { customer }` |
| GET | `/api/customers/:id` | 200, `data: { customer }`, including `followUps` |
| PATCH | `/api/customers/:id` | 200, `data: { customer }` |
| POST | `/api/customers/:id/follow-ups` | 201, `data: { followUp }` |

Responses retain the `{ success: true, data: ... }` envelope. Invalid input is
400 `VALIDATION_ERROR`; a well-formed CUID with no customer is 404 `CUSTOMER_NOT_FOUND`.
No delete endpoint exists.

Create example:

```json
{
  "customerName": "Asha Shah",
  "mobileNumber": "+919876543210",
  "email": "asha@example.com",
  "businessName": "Asha Wholesale",
  "customerType": "WHOLESALE",
  "address": "12 Market Road, Pune",
  "status": "LEAD",
  "followUpDate": "2026-10-01",
  "notes": "Interested in the product range"
}
```

- Required fields: customerName, mobileNumber, email, businessName, customerType,
  address, status. Names/business names are limited to 200 characters; address to
  2,000; notes and follow-up notes to 10,000. Required text cannot be blank.
- Types: `RETAIL`, `WHOLESALE`, `DISTRIBUTOR`. Statuses: `LEAD`, `ACTIVE`, `INACTIVE`.
- Mobile accepts 7–15 digits with an optional leading `+`. Email is trimmed and
  lowercased. Email/mobile are not unique: the requirements do not mandate uniqueness.
- Optional `gstNumber` accepts 15 alphanumeric characters, normalized uppercase;
  this is format validation, not a GST validity/checksum check. Omit it or send null.
- `followUpDate` accepts `YYYY-MM-DD` (UTC midnight) or an ISO timestamp with
  timezone. `gstNumber`, `followUpDate`, and `notes` may be cleared with null.
- PATCH accepts a non-empty subset of these fields; omitted values remain unchanged.
  Unknown fields are rejected, including nested history or forged author IDs.

List query example: `/api/customers?page=1&limit=20&search=asha&status=LEAD&customerType=WHOLESALE`.
Page defaults to 1 (maximum 1,000,000), limit to 20 (maximum 100). Search is a
case-insensitive literal substring across name, mobile, email, and business name;
search and filters combine with AND. Rows sort newest-first by createdAt and id.
Pagination returns `page`, `limit`, `total`, and `totalPages`; no matches gives
an empty array and zero total pages. The count and page use one consistent DB snapshot.

Add history with `{ "note": "Called customer", "followUpDate": "2026-10-02" }`.
Each record retains its author, timestamp, note, and supplied date. Detail returns
history newest-first, with safe author fields and no password hash. Providing a
date updates the customer's next follow-up date; omitting it preserves the current
date, and null clears it. Schedule changes and history insertion are atomic.
Customer profile notes remain separate; editing them does not overwrite history.

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
They create isolated users/customers/follow-ups and clean up only their own fixtures;
demo accounts are preserved. Run against a development database, not production. Typecheck covers
API source, seed, and tests. See `memory.md` for actual checks.

## Release documentation

See [API reference](docs/API.md), [server and deployment guide](docs/SERVER.md), and [release checklist](docs/RELEASE.md). No production deployment is claimed.

# Sales challan backend

`POST /api/challans` accepts `{ customerId, items: [{ productId, quantity }] }` and returns a draft in `data.challan`. Products must be distinct; quantities are positive integers. Product name, SKU and decimal price are copied into immutable snapshot fields. Drafts do not reserve or deduct stock.

`GET /api/challans` accepts page, limit and status; `GET /api/challans/:id` returns detail. All authenticated roles can read. ADMIN/SALES can create, confirm using `POST /api/challans/:id/confirm`, or cancel a draft using `POST /api/challans/:id/cancel`.

Confirmation locks the draft and product rows, checks current stock and commits all deductions, OUT movement logs and status together. Insufficient stock returns 409 `INSUFFICIENT_STOCK`; invalid transitions return 409 `INVALID_CHALLAN_STATUS`. Repeated/concurrent confirmations cannot deduct twice. Confirmed challans cannot be cancelled. Challan frontend uses Save Draft followed by confirmation of the saved record.

