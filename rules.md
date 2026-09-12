# AI Coding Rules — Mini ERP + CRM Operations Portal

> **Approved scope replacement (2026-09-12):** The current product source is Full-Stack Developer Technical Case Study 2 and [docs/CASE2.md](docs/CASE2.md). The older CRM/challan scope exclusions below do not prohibit this authorized work. Preserve legacy code/data and stack. Enforce available = physical − reserved, no over-reservation, source deduction at dispatch, destination addition only at receipt, duplicate protection and atomic stock/event/status changes. Do not implement the PDF's optional live-verification examples. Run database tests only against isolated local PostgreSQL, never the deployed Neon database.

These rules are instructions for both the developer and any AI coding assistant working on this repository.

## 1. Source of Truth Order

When requirements conflict, follow this order:

1. The original Full Stack Developer Case Study.
2. `prd.md`.
3. `architecture.md`.
4. `rules.md`.
5. `phases.md`.
6. `design.md`.
7. `memory.md`.
8. The current implementation.

Do not silently change assignment requirements.

## 2. Scope Rules

- Build the required MVP before bonus features.
- Required modules are:
  1. Authentication and Roles
  2. Customer CRM
  3. Product and Inventory
  4. Sales Challan
- Do not build a large ERP.
- Do not add purchase-order or full invoice modules unless the core submission is complete.
- AWS is a bonus, not a reason to risk the deadline.
- No paid dependency or deployment requirement.
- Every extra feature must justify its implementation time.

## 3. Approved Stack

### Backend
- Node.js
- TypeScript
- Express.js
- PostgreSQL
- Prisma
- Zod
- jsonwebtoken
- bcrypt or bcryptjs

### Frontend
- React
- TypeScript
- Vite
- React Router
- Axios
- React Hook Form
- Zod

### Testing
Use a lightweight TypeScript-compatible testing setup such as:
- Vitest, or
- Jest

Backend API tests may use Supertest.

Do not switch frameworks/languages mid-project without a concrete blocker.

## 4. Code Quality Rules

- TypeScript strict mode should be enabled where practical.
- Avoid `any`.
- Prefer small functions with one responsibility.
- Keep controllers thin.
- Put business rules in services.
- Put input schemas in validators.
- Keep API/database types explicit.
- Reuse helpers/components only when it improves clarity.
- Do not create premature abstractions.
- Remove dead code.
- Do not leave unexplained TODOs in final submission.

## 5. Database Rules

- Use migrations.
- Never manually alter production DB structure without a migration.
- Use foreign keys.
- Use unique constraint for user email and product SKU.
- Store money using database decimal/numeric semantics, not floating-point assumptions.
- Use transactions for multi-write business operations.
- Never allow `currentStock < 0`.
- Seed demo/test accounts for all required roles.
- Seed a small amount of realistic demonstration data if helpful.

## 6. Authentication Rules

- Passwords must be hashed.
- Never log passwords.
- JWT secret must come from environment variables.
- Protected routes must authenticate on the backend.
- Authorization must be enforced on the backend.
- Frontend route hiding is UX only, not security.
- Return `401` for invalid/missing authentication.
- Return `403` for authenticated users lacking permission.

## 7. Validation Rules

Validate at the API boundary.

Never trust:

- Route params.
- Query params.
- Request bodies.
- Frontend validation alone.

Minimum checks:

- Required strings are non-empty.
- Enum values are valid.
- Quantities are positive integers.
- Stock cannot become negative.
- Minimum stock quantity is non-negative.
- Challans contain at least one product.
- Product IDs exist.
- Customer exists.
- Duplicate SKU is rejected.
- Invalid state transitions are rejected.

## 8. Sales Challan Rules — Non-Negotiable

These are the highest priority rules in the project.

### Draft
- Draft creation must not reduce stock.

### Confirmation
- Only a valid Draft may be confirmed.
- Confirmation must run inside a database transaction.
- Re-check current stock at confirmation time.
- If any item is insufficient, reject the entire confirmation.
- Do not partially deduct products.
- If confirmation succeeds:
  - deduct every product quantity;
  - create stock `OUT` movement logs;
  - mark challan `CONFIRMED`.
- A repeated confirmation attempt must not deduct stock again.

### Snapshot
A challan item must save product snapshot values, including at minimum:
- product name
- SKU/code
- unit price
- quantity

Changing the Product master later must not rewrite old challan snapshots.

## 9. Stock Movement Rules

- Every explicit stock adjustment creates a movement log.
- Every confirmed challan stock deduction creates an `OUT` movement log.
- Store who performed the action.
- Store timestamp.
- Store a useful reason.
- `IN` increases stock.
- `OUT` decreases stock.
- An `OUT` movement must fail if it would make stock negative.

## 10. REST API Rules

- Use predictable resource names.
- Return JSON.
- Use correct HTTP status codes.
- Use one consistent error structure.
- Add pagination to list endpoints likely to grow.
- Add search/filter to customers and other useful lists.
- Never return password hashes.
- Unexpected errors go through centralized error middleware.
- Do not expose raw stack traces in production responses.

## 11. Error Handling

Expected errors should be explicit, not generic 500s.

Examples:

- `INVALID_CREDENTIALS`
- `UNAUTHORIZED`
- `FORBIDDEN`
- `VALIDATION_ERROR`
- `CUSTOMER_NOT_FOUND`
- `PRODUCT_NOT_FOUND`
- `DUPLICATE_SKU`
- `CHALLAN_NOT_FOUND`
- `INVALID_CHALLAN_STATE`
- `INSUFFICIENT_STOCK`

Each error should include a useful human-readable message.

## 12. Frontend Rules

- Follow `design.md`.
- Provide loading states.
- Provide empty states.
- Show API errors to users in understandable language.
- Forms show validation near relevant fields.
- Disable submit while a mutation is running.
- Never calculate authoritative stock state only on the client.
- Never assume a frontend-hidden action is protected.
- Use responsive layouts.
- Keep navigation consistent.
- Avoid visual overengineering.

## 13. Accessibility / UX Rules

- Inputs have labels.
- Buttons have clear action labels.
- Do not rely only on color for status.
- Visible keyboard focus should remain.
- Tables must remain usable on smaller screens via wrapping/scrolling/card treatment.
- Confirmation should be required for actions such as challan confirmation if the action cannot be trivially reversed.

## 14. Environment Rules

- Commit `.env.example`.
- Do not commit `.env`.
- Validate required backend environment variables at startup.
- Keep frontend and backend base URLs configurable.
- CORS must use configured origin(s).

## 15. Git Rules

Use meaningful commits.

Examples:

```text
chore: scaffold api and web apps
feat(auth): add jwt login and role middleware
feat(crm): add customer endpoints and follow-ups
feat(inventory): add products and stock movements
feat(challan): add transactional challan confirmation
feat(web): add customer management screens
test(challan): cover insufficient stock and duplicate confirmation
docs: add setup deployment and api instructions
```

Avoid one giant final commit when possible.

## 16. AI Working Rules

Before changing code, the AI must:

1. Read `prd.md`.
2. Read `architecture.md`.
3. Read `rules.md`.
4. Read the active phase in `phases.md`.
5. Read `design.md` for frontend tasks.
6. Read `memory.md`.

For each coding task:

1. State the exact sub-goal.
2. Inspect relevant existing files first.
3. Make the smallest coherent change.
4. Do not rewrite unrelated code.
5. Preserve working behavior.
6. Add/update tests for important business logic.
7. Run relevant checks.
8. Report:
   - files changed;
   - commands run;
   - test/build status;
   - unresolved issue.
9. Update `memory.md` after a meaningful milestone.

## 17. AI Must Not

- Invent endpoints that conflict with existing API conventions.
- Add a library merely because it is popular.
- Replace the stack without approval.
- Remove validation to make a test pass.
- Comment out failing tests.
- weaken stock rules.
- store passwords or tokens in source code.
- fabricate command/test results.
- say a task is complete when build/tests are failing.
- regenerate an entire working module to fix a small bug.
- silently introduce bonus scope.

## 18. Completion Gate

A phase is complete only when:

- Acceptance criteria in `phases.md` are met.
- Relevant tests pass.
- No known critical error remains.
- `memory.md` reflects the new state.

If a phase fails a gate, fix it before starting the next major phase unless the blocker is explicitly documented.
