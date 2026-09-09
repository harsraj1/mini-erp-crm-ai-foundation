# Server setup and deployment

## Local
Use Node >=22.12 and npm; PostgreSQL 16 is provided through Docker Compose. From root run `npm install`. Copy the two .env.example files only when local .env files do not exist. Set a random JWT_SECRET (README command). Run `npm run db:up`, `npm run db:generate`, `npm run db:migrate`, `npm run db:check`. Seed demo accounts using README instructions. Run `npm run dev:api` and `npm run dev:web` in separate terminals.

## Production procedure (not executed)
1. Provision PostgreSQL with backups and restricted access. Set DATABASE_URL using provider-required TLS options. Never use local example credentials.
2. Install dependencies from lockfile with `npm ci`; run `npm run db:generate` and `npm run build`.
3. Configure API NODE_ENV=production, PORT, DATABASE_URL, CORS_ORIGIN (exact public frontend origin), JWT_SECRET (random, >=32 characters), JWT_EXPIRES_IN (e.g. 8h). Use the host's secret store. POSTGRES_* variables are local Compose initialization settings only.
4. Back up existing data, then run `npm run db:migrate` as a controlled release step. Do not use migrate dev, db push or reset in production.
5. Start API with `npm run start --workspace @mini-erp/api`. Put HTTPS termination in front of it, forward requests to PORT, and check /health plus a separate database check. Liveness alone does not prove DB readiness.
6. Set VITE_API_BASE_URL to the public HTTPS API URL ending in /api before building frontend. Publish apps/web/dist. Configure static host fallback to index.html for browser routes. Vite preview is not the production server.
7. Provision production identities through a controlled administrative process. Demo seed refuses production and must not be used for real production accounts.
8. Verify all role logins, customer CRUD, inventory adjustments and draft/confirm flows in a staging database first. Verify CORS, HTTPS, SPA deep links, and environment-specific secrets.

No hosting provider, production deployment, backup restore, or fresh-server installation was verified in this session. Roll back application artifacts only when compatible with the migrated schema; restore data from tested backups when necessary, rather than blindly reversing migrations.

Tests use the configured development database and clean up their own fixtures. Run `npm test` (backend), `npm run test --workspace @mini-erp/web`, `npm run typecheck`, `npm run build`.
