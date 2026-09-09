# Release-readiness checklist — 2026-09-09

Overall: **NOT READY FOR UNQUALIFIED RELEASE SIGN-OFF**. Automated checks pass; manual UI and deployment checks remain open. FAIL below can mean an unverified release gate, not necessarily a reproduced defect.

| Gate | Result | Evidence / qualification |
|---|---|---|
| Four-role authentication and safe user responses | PASS | 36 auth tests; current database roles checked |
| Customer CRUD/search/history and role rules | PASS | 47 CRM tests |
| Inventory creation, duplicate SKU, IN/OUT | PASS | 4 product integration tests |
| Stock movement creation | PASS | Product and challan integration assertions |
| Draft leaves stock unchanged | PASS | Challan integration test |
| Confirm deducts multiple products | PASS | Challan integration test |
| Insufficient stock and atomic rollback | PASS | Challan tests including failed log insertion |
| Concurrent duplicate confirmation / competing drafts | PASS | Challan race tests; row locks in services |
| No negative stock through tested operations | PASS | Valid/insufficient OUT and competing draft tests; not a claim about arbitrary direct SQL |
| Product snapshot preservation | PASS | Master edit does not change snapshot test |
| Validation / HTTP status conventions | PASS | Existing auth/CRM/challan tests; six additional price validation tests |
| Pagination/search | PASS | CRM integration tests; code inspection confirms product search/pagination and challan pagination/status filter. Challan text search is not implemented |
| Frontend role navigation | PASS | 13 dashboard/integration tests for all roles |
| Frontend draft/confirm recovery | PASS | Three challan UI tests |
| Full frontend tests | PASS | 31 tests |
| Full backend tests | PASS | 98 tests before six new validation tests; six additional focused tests pass |
| Typecheck | PASS | Root command retry succeeds after temporary Prisma DLL lock |
| Build | PASS | Both workspaces |
| Prisma schema / migration state | PASS | db:validate and migrate status; five migrations up to date |
| README setup / API / environment / server documentation | PASS | Repository documentation reviewed and updated; instructions not clean-room executed |
| Demo credential documentation | PASS | Four demo accounts and seed behavior documented |
| Existing demo passwords work now | FAIL / NOT VERIFIED | Fixture auth tests do not prove the password of existing demo accounts |
| Responsive UI and no browser console errors | FAIL / NOT VERIFIED | CSS inspected; no live desktop/mobile browser test in this review |
| Clean install / fresh database bootstrap | FAIL / NOT VERIFIED | Existing workspace/database used |
| Deployment / HTTPS / SPA fallback / backup restore | FAIL / NOT VERIFIED | Procedure documented; no deployment performed |

## Commands and fixes

`npm test`: 98 passed. `npm run test --workspace @mini-erp/web`: 31 passed. `npm run typecheck`: initial Prisma DLL rename EPERM, retry passed. `npm run build`: passed. `npm run db:validate`: passed. `npx prisma migrate status` in apps/api: up to date. Focused product-validation suite: six passed.

Fixed invalid price acceptance (blank, infinity, excessive precision/range), bounded stock quantities to PostgreSQL integer limits, and rejected overflow on IN adjustments. Updated stale README claims and added API/server documentation. No new feature scope.

## Assumptions and known limitations

- Customer read access excludes Warehouse. Product reads and challan reads are available to all roles; product writes Admin/Warehouse; customer/challan writes Admin/Sales. Backend is authoritative.
- Draft stock is not reserved. Snapshots are taken on draft creation. Confirmation rechecks stock; confirmed cancellation is unsupported. Draft edits are unsupported; cancel and recreate through API if necessary.
- Initial product currentStock is an opening balance and does not create a movement; explicit adjustments and confirmations do.
- Stock nonnegativity is enforced by application transactions, not a database CHECK constraint. Direct database writes must remain controlled.
- Product and challan list count/page queries are not a single repeatable-read snapshot; rapidly changing data may affect pagination. Dashboard low stock scans pages and is not an atomic cross-module snapshot.
- Product search uses SQL substring semantics; unlike CRM it does not escape wildcard characters. No challan text search.
- Inventory forms have basic browser validation; a full accessibility/browser audit remains necessary. Product movement history is unpaginated in detail.
- No refresh token, password reset, registration or production identity management UI. Session JWTs expire; sign in again.
- No invoices/PDF, purchase orders, payments, deployment URLs or restore verification. These are not claimed delivered.

## Remaining release actions

Verify the README accounts against the running API, run every role's allowed/denied flows in desktop and mobile browsers, inspect console/network errors, perform a clean installation against a fresh development database, then stage deployment and verify HTTPS/CORS/deep links/backups. Record actual results before release sign-off.
