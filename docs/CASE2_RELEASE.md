# Case Study 2 verification — 2026-09-12

Status: **required implementation verified locally; remote deployment and submission artifacts remain manual.** No Render/Vercel deployment or Neon migration was performed. Existing `.env` files and passwords were not changed.

## Verified commands

API checks used a dedicated PostgreSQL 16 container `mini-erp-case2-test`, database `case2_test`, bound to `127.0.0.1:55433`. `DATABASE_URL` was overridden per command to this local database. Test-only JWT/CORS settings were supplied through the process environment. Production secrets were not printed. Installed dependencies were reused; no dependency or lockfile change was needed and `npm ci` was not rerun.

| Command / check | Final result | Actual evidence |
| --- | --- | --- |
| `npm run db:generate` | PASS | Prisma Client 6.19 generated |
| `npm run db:migrate` | PASS | All six migrations applied to the fresh local test DB |
| `npx prisma migrate diff --from-schema-datasource apps/api/prisma/schema.prisma --to-schema-datamodel apps/api/prisma/schema.prisma --exit-code` | PASS | No difference detected against migrated local DB |
| `npm run db:validate` | PASS | Schema valid |
| `npm run db:seed` | PASS | Demo users ensured, including Operations |
| `npm run db:check` | PASS | SELECT 1 successful |
| `npm test` | PASS | 124 backend tests in six files, including 17 new Operations tests |
| `npm run test --workspace @mini-erp/web` | PASS | 44 frontend tests in six files, including eight new Operations tests |
| `npm run typecheck` | PASS | API source/seed/tests and frontend TypeScript passed |
| `npm run build` | PASS | Both workspaces compiled successfully |
| Final frontend typecheck/test/build after UI fixes | PASS | Typecheck, all 44 tests, Vite production bundle |
| `npm run start --workspace @mini-erp/api` with local test environment/PORT4100 | PASS | Compiled server listened; GET /health returned200 and status ok |
| `npm run dev --workspace @mini-erp/web -- --host localhost --port 5174 --strictPort` with VITE_API_BASE_URL=http://localhost:4100/api | PASS | Frontend served200 and completed live workflow |
| `git diff --check` | PASS | No whitespace errors; git emitted local LF/CRLF normalization warnings |

Intermediate failures were resolved: TypeScript typing/syntax errors during implementation; a legacy CRM role test assumed every non-Warehouse role could read CRM and was corrected to the real allowlist; seed's sandboxed TypeScript runner could not read the Windows profile and succeeded with reviewed local execution; a build running alongside database tests hit Prisma DLL EPERM and passed when rerun after tests finished. Avoid regenerating Prisma Client while Windows API/test processes have loaded its engine.

## Required business checks

| Requirement | Result | Evidence |
| --- | --- | --- |
| Admin, Operations, Sales authentication | PASS | Real seeded browser logins plus backend auth tests |
| Backend authorization | PASS | Sales rejected from inventory/work/transfer writes; Operations rejected from order reservation; missing auth401, disallowed role403 |
| Physical/reserved/available by item/location/batch | PASS | Browser displayed100/60/40; API tests checked derived values and logs |
| No negative or over-reserved inventory | PASS | PostgreSQL constraints, adjustment tests, over-reservation and concurrency tests |
| Duplicate inventory transactions | PASS | Duplicate order UUID and adjustment UUID roll back without duplicate stock/log changes |
| Work-order stock check | PASS | Required100, Factory available60, shortage40, alternative warehouse50 shown in browser and test |
| Work status sequence | PASS | API rejects Assigned→Completed; assigned Operations user started work in browser |
| Cannot transfer more than available | PASS | Test rejects request above available and rechecks availability at dispatch after reservation |
| Destination increases only on receipt | PASS | Browser showed source50→10 while destination remained60; receipt then increased destination to100 |
| Duplicate receipt | PASS | Concurrent same-transfer receipt test gives200/409; only one receipt event and addition |
| Concurrent stock contention | PASS | Reservations80+50 against100 permit only one; dispatch competing with reservation also permits only one |
| First simultaneous receipts to same batch | PASS | Both accepted once, destination total correct |
| Reservation and recoverable errors | PASS | Sales reserved60 without physical deduction; second50 rejected against available40, form values retained |
| Frontend role actions/loading/errors/empty states | PASS | Component tests and live Admin/Operations/Sales navigation |
| Responsive UI | PASS for inspected sizes | Desktop1280×720 and phone390×844 inspected; mobile menu and contained horizontal inventory/order tables verified. No exhaustive device/browser matrix claimed |

## Remaining submission/deployment steps

- Apply the additive migration to the intended demo deployment DB after review/backup, ensure Operations demo account, redeploy backend/frontend, then verify public URLs and CORS. **NOT RUN remotely.**
- Record and share the 5–7 minute demo using `DEMO.md`. **NOT RECORDED.**
- Review and commit coherent changes, then push/share the repository. **No new commits/push performed by this task.** Preexisting uncommitted UI edits were preserved.
- Fresh-machine install, provider cold-start behavior, backup restore and broad browser/device compatibility were not verified in this update.

## Files owned by this update

- Backend: `apps/api/prisma/schema.prisma`, new `20260912090000_operations_erp/migration.sql`, seed message, `src/app.ts`, new `src/routes/operations.routes.ts`, `src/services/operations.service.ts`, `src/validators/operations.validator.ts`, `tests/operations.test.ts`, legacy `tests/customer.test.ts` role expectation.
- Frontend: new `src/api/operations.ts`, `src/pages/operations/Operations.tsx`, `src/tests/operations.test.tsx`; `App.tsx`, `types/index.ts`, login/page title, new Operations CSS rules, existing integration-test navigation expectation.
- Docs: README (earlier version archived to `docs/LEGACY_README.md`), six root context files, `docs/SERVER.md`, and new `CASE2.md`, `SCHEMA.md`, `OPERATIONS_API.md`, `DEMO.md`, this checklist.

Preexisting edits in legacy customer/product/challan/dashboard components, shared UI, their tests and the rest of global.css were not rewritten or claimed as new work.
