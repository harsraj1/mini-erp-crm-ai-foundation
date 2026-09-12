# Mini Operations ERP

Implementation of **Full-Stack Developer Technical Case Study 2**: Inventory → Work Order → Stock Check → Internal Transfer / Shortage → Customer Reservation.

The approved update replaces visible CRM/challan navigation with Inventory, Work Orders, Internal Transfers and Customer Orders. Earlier code and tables are preserved. Legacy stock totals are separate from new location/batch inventory; historical data is not automatically converted.

## Stack and architecture

React + TypeScript + Vite → Express + TypeScript REST API → Prisma 6.19 → PostgreSQL. npm workspaces: `apps/web` and `apps/api`. JWT authentication, bcrypt passwords, Zod validation and centralized JSON errors are reused. Services own transactions; the frontend displays confirmed API values.

[Requirements and transaction explanation](docs/CASE2.md) · [ER diagram](docs/SCHEMA.md) · [API reference](docs/OPERATIONS_API.md)

## Local setup

Prerequisites: Node.js 22.12+, npm, Docker Desktop with Linux containers or PostgreSQL 16. From repository root:

```powershell
npm ci
# Copy only if these destination files do not already exist.
Copy-Item apps/api/.env.example apps/api/.env
Copy-Item apps/web/.env.example apps/web/.env
```

Set a random `JWT_SECRET` in `apps/api/.env`. Generate one locally:

```sh
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

Use the local PostgreSQL URL from `.env.example`. **Never point tests at Neon or a production database.** Start Docker Desktop, then:

```sh
npm run db:up
npm run db:generate
npm run db:validate
npm run db:migrate
npm run db:check
```

`db:up` starts PostgreSQL on 127.0.0.1:5432 with a persistent volume. `db:stop` preserves data. For an existing PostgreSQL server, skip `db:up`, create a development database and set `DATABASE_URL`. The sixth migration adds Operations models/role without dropping legacy tables.

Seed users against your development/demo database:

```powershell
$env:DEMO_PASSWORD='DemoOnly-ERP-2026!'
npm run db:seed
Remove-Item Env:DEMO_PASSWORD
```

| Role | Demo email | Demo-only password for newly seeded accounts |
| --- | --- | --- |
| Admin | admin@demo.example.com | DemoOnly-ERP-2026! |
| Operations | operations@demo.example.com | DemoOnly-ERP-2026! |
| Sales | sales@demo.example.com | DemoOnly-ERP-2026! |

Seed preserves existing passwords, names and roles, and also ensures legacy Warehouse/Accounts accounts. It refuses `NODE_ENV=production`. No inventory is seeded; add items, locations and opening quantities through Inventory. [Demo walkthrough and sample data](docs/DEMO.md).

Run in separate terminals:

```sh
npm run dev:api
```

```sh
npm run dev:web
```

Open http://localhost:5173. API: http://localhost:4000. `/health` checks process liveness; `db:check` checks database connectivity. Login opens Inventory. `/inventory`, `/work-orders`, `/transfers`, `/orders` require login.

## Environment

| Variable | Purpose |
| --- | --- |
| API: `DATABASE_URL` | PostgreSQL URL including database; URL-encode credentials; TLS options as required by the database |
| `JWT_SECRET` | Random secret, minimum 32 characters, required with no fallback |
| `JWT_EXPIRES_IN` | Positive integer plus s/m/h/d; default `8h` |
| `CORS_ORIGIN` | Exact frontend origin; no path or trailing slash |
| `PORT` | Default 4000 |
| `NODE_ENV` | development, test, production; default development |
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | Local Docker initialization only; match local DATABASE_URL |
| `DEMO_PASSWORD` | Seed only; 12+ characters, maximum 72 UTF-8 bytes |
| Frontend: `VITE_API_BASE_URL` | API URL **including `/api`**, embedded at build time |

Backend settings go in `apps/api/.env`; frontend settings in `apps/web/.env`. Only `VITE_API_BASE_URL` belongs on the frontend. `.env` files are ignored by git. Invalid backend configuration reports field names without logging values.

## Test, build and run compiled backend

Configure a migrated, isolated local test database and valid API environment first. Tests create and remove their own fixtures; never run them against live data.

```sh
npm test
npm run test --workspace @mini-erp/web
npm run typecheck
npm run build
npm run start --workspace @mini-erp/api
```

`npm test` runs PostgreSQL-backed API tests; the second command runs frontend component/navigation tests. Build generates Prisma Client and outputs `apps/api/dist` and `apps/web/dist`. API start runs compiled JavaScript. `npm run preview --workspace @mini-erp/web` is for local build preview.

## Delivery

[Verification](docs/CASE2_RELEASE.md) · [Server/deployment setup](docs/SERVER.md) · [Demo recording guide](docs/DEMO.md)

Deployments require applying the additive migration, ensuring the Operations account, and redeploying both applications. No remote migration/deployment is implied by local checks. Work orders check stock and track progress without consuming/producing material. Transfers are full receipts. Orders reserve one selected batch. Fulfillment, order cancellation, damaged stock and location-scoped users are excluded future interview examples.

Record the 5–7 minute demo and review/push meaningful commits before submission. No recorded video or new remote deployment is claimed. Historical documentation: [legacy README](docs/LEGACY_README.md), [legacy API](docs/API.md).
