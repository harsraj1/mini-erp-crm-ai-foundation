# Phase Plan — Mini ERP + CRM Operations Portal

## Guiding Principle

This is a 48-hour case study. Build vertically, validate each phase, and preserve a runnable project.

Do not spend early time on bonus features.

---

# Phase 0 — Foundation and Repository Setup

## Goal

Create a stable development skeleton and documentation baseline.

## Tasks

- Create repository structure.
- Initialize backend with Node.js + TypeScript + Express.
- Initialize frontend with React + TypeScript + Vite.
- Configure PostgreSQL + Prisma.
- Add `.gitignore`.
- Add `.env.example` files.
- Add formatting/lint scripts if they do not slow development.
- Add health endpoint.
- Create initial README skeleton.
- Commit the six context files and prompt pack.

## Acceptance Criteria

- Backend starts locally.
- Frontend starts locally.
- Backend can connect to database.
- `GET /health` returns success.
- No secrets are committed.

## Suggested Commit

`chore: scaffold mini erp crm application`

---

# Phase 1 — Database, Authentication, and Roles

## Goal

Build the secure foundation all other modules depend on.

## Tasks

- Define `User` model.
- Define role enum:
  - ADMIN
  - SALES
  - WAREHOUSE
  - ACCOUNTS
- Create migration.
- Create seed script with one test account per role.
- Hash seeded passwords.
- Implement login.
- Issue JWT.
- Create auth middleware.
- Create role authorization middleware.
- Create `GET /auth/me`.
- Add auth tests.

## Acceptance Criteria

- All four test users can log in.
- Wrong password returns authentication error.
- Protected endpoint rejects missing/invalid JWT.
- Role middleware returns 403 for unauthorized role.
- Password hash never appears in API response.

## Suggested Commit

`feat(auth): add jwt authentication and role authorization`

---

# Phase 2 — Customer CRM

## Goal

Complete the required customer CRM flow end-to-end.

## Backend Tasks

- Add `Customer` model.
- Add `CustomerFollowUp` model.
- Add migration.
- Add validation schemas.
- Implement:
  - list customers;
  - pagination;
  - search;
  - useful filters;
  - create;
  - detail;
  - edit;
  - add follow-up note.
- Add customer tests.

## Frontend Tasks

- Customer list.
- Search.
- Add customer form.
- Edit customer form.
- Customer detail page.
- Follow-up history.
- Add follow-up form.
- Loading/error/empty states.

## Acceptance Criteria

- Sales/Admin can complete customer workflow.
- Customer required fields are validated.
- GST is optional.
- Type/status enums are enforced.
- Search works.
- Follow-up notes are retained as history.
- Customer detail shows saved data and follow-ups.

## Suggested Commits

`feat(crm): add customer and follow-up APIs`

`feat(web): add customer crm screens`

---

# Phase 3 — Product and Inventory

## Goal

Implement products, stock levels, and stock movement auditing.

## Backend Tasks

- Add `Product`.
- Add `StockMovement`.
- Add migration.
- Add SKU unique constraint.
- Product create/edit/list/detail.
- Add stock movement endpoint.
- Implement transactional stock adjustment.
- Prevent negative stock.
- Add movement history.
- Add tests.

## Frontend Tasks

- Product list.
- Add product.
- Edit product.
- Current stock display.
- Minimum-stock indicator.
- Stock IN/OUT form.
- Stock movement history.

## Acceptance Criteria

- Product can be added and edited.
- Duplicate SKU returns a useful error.
- `IN` raises current stock.
- valid `OUT` lowers current stock.
- invalid `OUT` cannot make stock negative.
- Every change creates a stock movement log with actor and timestamp.

## Suggested Commits

`feat(inventory): add products and stock movement tracking`

`feat(web): add product and inventory screens`

---

# Phase 4 — Sales Challan

## Goal

Implement the most important real-world business workflow correctly.

## Backend Tasks

- Add `Challan`.
- Add `ChallanItem`.
- Add status enum.
- Generate unique challan number automatically.
- Store customer relationship.
- Store product snapshot fields.
- Support multiple product lines.
- Save draft.
- Confirm draft.
- Cancel draft.
- Implement confirmation inside a DB transaction.
- Re-check stock at confirmation.
- Reject insufficient stock.
- Deduct all stock atomically.
- Create `OUT` movement logs.
- Prevent duplicate deduction.
- Add extensive tests.

## Frontend Tasks

- Challan list.
- Create challan screen.
- Customer selector.
- Multiple product rows.
- Quantity fields.
- Draft action.
- Confirm action.
- Detail page.
- Status badge.
- Proper insufficient-stock error.
- Confirmation dialog.

## Critical Tests

- Draft leaves stock unchanged.
- Confirm subtracts correct quantity.
- Two products both subtract correctly.
- One insufficient item aborts whole confirmation.
- Stock remains unchanged after failed transaction.
- Double confirmation fails safely.
- Product master change does not alter old snapshot data.

## Acceptance Criteria

All mandatory challan rules pass.

## Suggested Commits

`feat(challan): add sales challan workflow`

`test(challan): cover transactional stock rules`

`feat(web): add challan creation and detail screens`

---

# Phase 5 — Dashboard, Role UX, and Full-Flow Integration

## Goal

Turn the modules into a coherent operations portal.

## Tasks

- Create admin-style shell.
- Sidebar/topbar.
- Role-aware navigation.
- Dashboard summary cards using existing data.
- Route guards.
- Consistent error/loading UI.
- Responsive behavior.
- Test full paths for every role.
- Fix integration issues.

## Dashboard Suggestions

Use only data already supported by core modules:

- Customer count
- Active/Lead customer count
- Product count
- Low-stock count
- Draft challan count
- Confirmed challan count

## Acceptance Criteria

- App feels like one product rather than disconnected pages.
- Every role sees sensible navigation.
- Backend still enforces permissions.
- Core screens work at desktop and narrow viewport widths.
- No major console errors.

## Suggested Commit

`feat(web): integrate responsive role-based operations dashboard`

---

# Phase 6 — API Quality, Documentation, Deployment, Submission

## Goal

Make the project easy for an evaluator to verify.

## Tasks

### API
- Review status codes.
- Review validation errors.
- Verify pagination/search.
- Verify centralized error handling.
- Clean API base path.
- Build Postman collection or API docs.

### Documentation
README must document:

- Project overview.
- Architecture.
- Tech stack.
- Prerequisites.
- Environment variables.
- Database setup.
- Migration commands.
- Seed commands.
- Backend local run.
- Frontend local run.
- Test credentials for all roles.
- Server setup.
- Deployment.
- Assumptions.
- Known limitations.

### Deployment
Use free options such as:

- Frontend: Vercel / Netlify / Render Static
- Backend: Render / Railway / Fly.io
- Database: Neon / Supabase / Render Postgres

AWS is optional.

### Submission
Prepare:

1. GitHub repository link.
2. Live frontend URL.
3. Live backend API URL.
4. Test login credentials for all roles.
5. Postman collection/API documentation.
6. README.
7. Short architecture explanation.
8. Known limitations/incomplete parts.

If deployment is skipped, ensure:

- working local setup;
- full-flow screen recording;
- Postman collection;
- clear README.

## Acceptance Criteria

- Fresh setup can follow README.
- Production build succeeds.
- Backend health check works after deployment.
- Frontend talks to deployed backend.
- Test logins work.
- Core workflow can be demonstrated.
- Submission checklist is complete.

## Suggested Commits

`docs: add setup api deployment and assumptions`

`fix: resolve final integration issues`

---

# Phase 7 — Bonus Only If Core Submission Is Stable

Possible assignment bonuses:

- Docker setup.
- GitHub Actions deployment.
- Export invoice as PDF.
- Upload product image to AWS S3.

## Bonus Gate

Start a bonus feature only when:

- Phases 1–6 are complete.
- Required flows work.
- Tests/build pass.
- README is usable.
- Deployment/submission is not at risk.

For a 48-hour assignment, Docker is typically the safest bonus if the developer already knows it.

---

# 48-Hour Priority Schedule

This is a practical target, not an assignment requirement.

## Hours 0–4
- Foundation
- Schema planning
- Auth

## Hours 4–12
- Customer CRM backend + frontend

## Hours 12–20
- Product/inventory backend + frontend

## Hours 20–30
- Sales Challan + business-rule testing

## Hours 30–36
- Frontend integration + role UX

## Hours 36–42
- QA + bug fixing + Postman + README

## Hours 42–46
- Deployment + production fixes

## Hours 46–48
- Final verification + screen recording/submission material
- Bonus only if everything required is already stable

---

# Final Manual Test Script

1. Log in as Admin.
2. Create a customer.
3. Edit customer.
4. Add a CRM follow-up.
5. Search for the customer.
6. Create a product with known stock.
7. Add an inventory `IN` movement.
8. Verify movement log.
9. Log in as Sales.
10. Create a draft challan.
11. Verify stock has not changed.
12. Confirm the challan.
13. Verify stock decreased.
14. Verify `OUT` stock movement exists.
15. Create another challan exceeding available stock.
16. Confirm and verify proper error.
17. Verify stock did not go negative.
18. Verify role restrictions with Warehouse/Accounts.
19. Verify responsive layout.
20. Verify clean setup/deployment instructions.
