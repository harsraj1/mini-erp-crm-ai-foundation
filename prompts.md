# AI Coding Prompt Pack — Mini ERP + CRM Operations Portal

Use these prompts with Cursor, Codex, Claude Code, ChatGPT, Copilot, or another coding agent.

The safest pattern is:

1. Start with the **Session Bootstrap Prompt**.
2. Give only one phase prompt at a time.
3. Require validation/tests before moving forward.
4. Run the **Memory Update Prompt** at the end of each milestone.

---

# Prompt 0 — Session Bootstrap / Context Load

```text
You are working on my repository for a Full Stack Developer case study:
"Mini ERP + CRM Operations Portal".

Before writing or editing any code, read these files in this exact order:

1. prd.md
2. architecture.md
3. rules.md
4. phases.md
5. design.md
6. memory.md

Treat the original case-study requirements summarized in these files as the product constraint.

Important:
- Do not expand scope.
- Do not switch the approved stack without a blocker.
- The required core modules are Authentication/Roles, Customer CRM, Product/Inventory, and Sales Challan.
- Sales Challan stock rules are critical.
- Do not start bonus features until the required project is complete.
- Never fabricate tests/build results.

After reading the files:
1. Inspect the current repository.
2. Compare the repository state with memory.md.
3. Tell me:
   - the current phase;
   - what is already implemented;
   - any mismatch between memory.md and actual code;
   - the single best next task.
4. Do not modify code until you have completed that inspection.
```

---

# Prompt 1 — Phase 0: Foundation

```text
Continue the Mini ERP + CRM project.

First read:
prd.md
architecture.md
rules.md
phases.md
design.md
memory.md

Execute Phase 0 only.

Goal:
Create a stable full-stack repository skeleton using:
- Backend: Node.js + TypeScript + Express
- Database: PostgreSQL + Prisma
- Frontend: React + TypeScript + Vite

Requirements:
- Follow the folder structure in architecture.md, adapting minimally if the repo already exists.
- Add backend and frontend .env.example files.
- Validate backend environment configuration.
- Add GET /health.
- Add database connection setup.
- Add scripts needed to run dev/build/typecheck.
- Add a README skeleton.
- Do not implement CRM/inventory/challan yet.
- Do not add bonus features.
- Do not add unnecessary libraries.

Before changing files, inspect the repo and preserve any correct existing setup.

When finished:
1. run relevant install/typecheck/build/start checks available in the environment;
2. fix issues caused by your changes;
3. list files changed;
4. list commands actually run and PASS/FAIL;
5. update memory.md with the real Phase 0 status;
6. stop. Do not start Phase 1 automatically.
```

---

# Prompt 2 — Phase 1: Authentication and Roles

```text
Read all project context files first, especially rules.md and memory.md.

Execute Phase 1 only: Database, Authentication, and Roles.

Implement:
- User model
- role enum: ADMIN, SALES, WAREHOUSE, ACCOUNTS
- Prisma migration
- seed script with one test account for each required role
- hashed passwords
- POST /api/auth/login
- GET /api/auth/me
- JWT authentication middleware
- role authorization middleware
- centralized auth errors
- tests for login/auth/authorization

Rules:
- JWT secret from environment variables only.
- Never return passwordHash.
- Wrong credentials -> appropriate 401.
- Missing/invalid token -> 401.
- Authenticated but disallowed role -> 403.
- Do not implement unrelated modules.
- Do not hard-code production secrets.

If repo conventions differ from the planned architecture, preserve coherent existing conventions rather than rewriting everything.

At completion:
- run migration/seed if environment allows;
- run tests/typecheck/build;
- fix failures caused by this phase;
- provide test credentials in README using clearly demo-only values;
- update memory.md;
- stop before Phase 2.
```

---

# Prompt 3 — Phase 2: Customer CRM Backend

```text
Read prd.md, architecture.md, rules.md, phases.md, and memory.md first.

Implement only the Customer CRM backend requirements.

Data:
- customerName
- mobileNumber
- email
- businessName
- gstNumber optional
- customerType: RETAIL | WHOLESALE | DISTRIBUTOR
- address
- status: LEAD | ACTIVE | INACTIVE
- followUpDate
- notes

Also create a CustomerFollowUp history model so follow-up notes can be retained rather than overwritten.

Implement:
- GET /api/customers with pagination
- search customers
- useful status/type filters
- POST /api/customers
- GET /api/customers/:id
- PATCH /api/customers/:id
- POST /api/customers/:id/follow-ups

Add Zod validation.
Use correct status codes and existing response/error conventions.
Apply role authorization according to architecture.md.
Add backend tests for validation, create, edit, search, detail, and follow-up.

Do not build frontend in this prompt.

At completion:
- run relevant tests/typecheck/build;
- report actual results;
- update memory.md;
- stop.
```

---

# Prompt 4 — Phase 2: Customer CRM Frontend

```text
Read all context files, including design.md and memory.md.

The Customer CRM backend should already exist. Inspect its actual endpoints/types before coding.

Implement the Customer CRM frontend only.

Required screens/flows:
- customer list
- search
- pagination
- useful filters if backend supports them
- add customer
- edit customer
- customer detail
- follow-up history
- add follow-up note

Requirements:
- follow design.md
- TypeScript
- reuse the project's API client
- loading states
- empty state
- API error state
- visible field validation
- responsive layout
- role-aware UI
- never treat client-side role hiding as security

Do not invent backend endpoints. If an expected endpoint differs, adapt to the actual backend.

At completion:
- run frontend typecheck/build/tests if available;
- fix issues caused by your changes;
- update memory.md;
- stop.
```

---

# Prompt 5 — Phase 3: Product and Inventory Backend

```text
Read the six context files first.

Implement Phase 3 backend only.

Product fields:
- productName
- sku/code
- category
- unitPrice
- currentStock
- minimumStockAlertQuantity
- warehouse/location

StockMovement fields:
- product
- quantityChanged
- movementType: IN | OUT
- reason
- createdBy
- timestamp

Requirements:
- unique SKU
- add/edit/list/detail products
- stock movement history
- explicit stock adjustment endpoint
- IN increases stock
- OUT decreases stock
- stock must never go negative
- every accepted adjustment creates a movement log
- stock update + movement log must be in one transaction
- use validation and existing error structure

Do not implement challans yet.

Tests must cover:
- create product
- duplicate SKU
- IN
- valid OUT
- insufficient OUT
- movement log creation

Run checks, report actual results, update memory.md, then stop.
```

---

# Prompt 6 — Phase 3: Product and Inventory Frontend

```text
Read project context, design.md, and memory.md.

Inspect the existing inventory APIs before making frontend changes.

Implement:
- product list
- add product
- edit product
- current stock display
- low-stock indicator
- stock IN/OUT adjustment form
- stock movement history

Follow design.md.
Handle:
- loading
- empty state
- validation
- server errors
- responsive tables/forms
- role-aware actions

Never change current stock optimistically as authoritative state. Refresh/use confirmed API response after mutations.

Do not implement sales challan yet.

Run frontend checks, update memory.md with actual status, then stop.
```

---

# Prompt 7 — Phase 4: Sales Challan Backend

```text
Read all project context files before touching code.

This is the most important business-logic phase.

Implement Sales Challan backend strictly according to prd.md/rules.md.

A challan must:
- select a customer
- contain multiple products
- store quantity per product
- generate a unique challan number automatically
- support DRAFT, CONFIRMED, CANCELLED
- store createdBy and createdAt
- store total quantity
- store product snapshot data, not only product IDs

At minimum each ChallanItem snapshot must preserve:
- productName
- sku
- unitPrice
- quantity
and may also keep productId for traceability.

Critical confirmation transaction:
1. Load the draft challan.
2. Reject if it is not in DRAFT.
3. Re-read current product stock.
4. Validate all requested quantities.
5. If ANY item has insufficient stock, reject the entire operation.
6. No stock may change on a failed confirmation.
7. Deduct every product quantity atomically.
8. Create StockMovement OUT records for each line.
9. Mark challan CONFIRMED.
10. A second confirmation attempt must never deduct again.

Draft creation must not reduce stock.

Implement appropriate endpoints, including create/list/detail/confirm and draft cancel if planned.

Add strong tests for:
- draft no deduction
- successful confirmation
- multiple items
- insufficient stock
- atomic rollback behavior
- duplicate confirmation
- snapshot immutability after product edit

Do not implement bonus invoice behavior.

Run tests/typecheck/build.
Do not declare this phase complete if critical tests fail.
Update memory.md with actual results and stop.
```

---

# Prompt 8 — Phase 4: Sales Challan Frontend

```text
Read all project files, especially design.md, rules.md, and memory.md.

Inspect the real challan/customer/product endpoints first.

Implement:
- challan list
- challan creation
- customer selector
- dynamic multiple product rows
- product selector
- available stock display if API provides it
- quantity field
- remove/add rows
- total quantity
- Save Draft
- Confirm Challan
- challan detail
- status badge
- confirmation dialog
- insufficient-stock error handling

Rules:
- frontend must not reduce stock itself;
- show backend confirmation result;
- preserve user input when recoverable API errors occur;
- prevent accidental duplicate submit;
- follow design.md and responsive rules.

Do not add invoice/PDF features.

Run frontend checks.
Update memory.md.
Stop.
```

---

# Prompt 9 — Phase 5: Dashboard + Role Integration

```text
Read all project context and inspect the current full-stack app.

Execute Phase 5 only.

Build a coherent admin-style shell:
- sidebar/navigation
- topbar/user role
- dashboard
- route protection
- role-aware navigation
- consistent loading/error/empty states
- responsive behavior

Dashboard may show only metrics derivable from existing core modules:
- customer count
- leads
- product count
- low stock
- draft challans
- confirmed challans

Do not create fake analytics.

Test navigation and core workflows for:
ADMIN
SALES
WAREHOUSE
ACCOUNTS

Remember: backend authorization remains authoritative.

Run build/typecheck/tests.
Fix integration regressions.
Update memory.md and stop.
```

---

# Prompt 10 — Phase 6: Final QA + Documentation

```text
Read all project context files and inspect the repository.

Do not add new feature scope.

Perform a release-readiness review against the case study.

Check:
- all four roles
- customer CRM
- product/inventory
- stock movement log
- sales challan
- draft no stock deduction
- confirmed stock deduction
- no negative stock
- insufficient-stock error
- product snapshot data
- validation
- HTTP status codes
- pagination/search
- responsive admin UI
- environment variables
- README
- proper scripts
- test credentials
- known limitations
- architecture explanation

Create/finalize:
- Postman collection or API documentation
- README setup instructions
- server setup documentation
- environment variable documentation
- local run steps
- deployment steps
- assumptions
- known limitations

Run all feasible backend/frontend tests, typechecks, and builds.

Make a release checklist with PASS/FAIL.
Fix critical failures that are within scope.
Update memory.md with the true final status.
Do not claim PASS for anything not actually verified.
```

---

# Prompt 11 — Deployment

```text
Read architecture.md, rules.md, phases.md, and memory.md.

Prepare/deploy the completed project using free hosting compatible with the assignment.

Preferred simple topology:
- frontend: Vercel, Netlify, or Render Static
- backend: Render, Railway, or Fly.io
- PostgreSQL: Neon, Supabase, or Render Postgres

AWS is optional and must not be introduced if it risks completion.

Tasks:
- ensure production environment variables are documented;
- configure CORS correctly;
- apply production DB migrations safely;
- seed only appropriate demo users/data;
- verify backend health;
- verify frontend API URL;
- verify all four test credentials;
- test at least one end-to-end customer/product/challan flow.

Do not expose secrets in logs or README.

If you cannot perform an external deployment from the current environment, do not pretend that you did. Instead produce exact provider-specific deployment steps and identify what remains manual.

Update memory.md with deployed URLs only after they are actually known.
```

---

# Prompt 12 — Bug Fix / Debugging

```text
Read all context files and memory.md first.

I will give you an error or failing behavior.

Debug it without rewriting unrelated working code.

Process:
1. Reproduce or inspect the failure.
2. Identify the smallest root cause.
3. Explain which rule/requirement is affected.
4. Patch the smallest coherent set of files.
5. Add/update a regression test if the bug affects business logic.
6. Run the relevant check.
7. Report exact commands and results.
8. Update memory.md if the fix changes project state.

Never:
- remove validation just to pass;
- weaken stock/challan rules;
- comment out tests;
- fabricate success;
- replace an entire module for a local bug unless truly necessary.
```

---

# Prompt 13 — Code Review / Assignment Compliance Audit

```text
Act as a strict reviewer for the Full Stack Developer case study.

Read:
prd.md
architecture.md
rules.md
phases.md
design.md
memory.md

Then inspect the actual repository.

Create a compliance table:

Requirement | Implemented? | Evidence | Risk | Required Fix

Audit at minimum:
- required stack
- auth + 4 roles
- Customer CRM fields/features
- Product/Inventory fields/features
- StockMovement fields
- Sales Challan fields/features
- stock deduction on confirmation
- no negative stock
- proper insufficient-stock error
- snapshot data
- validation
- proper HTTP status codes
- pagination/search
- responsive admin UI
- environment variables
- README
- Postman/API docs
- deployment/local alternative requirements
- Git hygiene
- submission checklist

Prioritize findings:
P0 = submission-breaking
P1 = important
P2 = polish
P3 = bonus

Do not modify code in this prompt unless I explicitly ask you to apply the fixes.
```

---

# Prompt 14 — Test Generator

```text
Read the relevant project context and inspect the current module before writing tests.

Add high-value tests only. Do not write meaningless coverage tests.

For backend business logic, prioritize:
- authentication
- authorization
- validation
- uniqueness constraints
- stock consistency
- transactions
- invalid state transitions
- challan snapshot behavior

For challan, tests MUST include:
- draft does not change stock
- confirmation deducts exactly once
- insufficient stock rejects
- multi-item transaction is atomic
- double confirmation is rejected
- snapshot remains unchanged after product master edit

Follow existing test framework and conventions.
Do not change production behavior merely to make a poor test pass.
Run the tests you add and report actual output.
```

---

# Prompt 15 — Memory Update at End of Every Session

```text
Update memory.md based only on the repository state and commands actually completed in this session.

Preserve important historical decisions.

Update:
- current phase
- phase status
- implemented features
- files/modules changed
- database/migrations
- API state
- frontend state
- auth state
- commands/tests with PASS/FAIL
- environment/deployment state
- decisions
- blockers
- known issues
- next exact task

Rules:
- Never invent a successful test/build/deployment.
- If something was not run, write NOT RUN.
- If partially implemented, write PARTIAL.
- Keep the file concise enough that a new AI session can understand the project in a few minutes.
```

---

# Prompt 16 — New Chat / Model Handoff

```text
You are taking over an existing AI-assisted coding project.

Do not ask me to re-explain the project.

Read these files first:
prd.md
architecture.md
rules.md
phases.md
design.md
memory.md

Then inspect the repository to verify memory.md is still accurate.

Return only:
1. Current project status.
2. Current phase.
3. Last completed milestone.
4. Known blockers.
5. Next exact task.
6. Any contradiction between documentation and code.

Do not modify code until this handoff check is complete.
```

---

# Prompt 17 — Final Submission Review

```text
Act as the evaluator of this case-study submission.

Read the six context files and the final README.
Inspect the repository and, if available, deployed URLs/API docs.

Score these categories from 0–10:
1. Requirement compliance
2. Backend/API design
3. Database design
4. Business logic correctness
5. Authentication/authorization
6. Frontend UX/responsiveness
7. Error handling/validation
8. Code quality/organization
9. Testing
10. Deployment/documentation

Then provide:
- overall score /100
- top 5 strengths
- top 5 weaknesses
- all submission-breaking issues
- exact fixes in highest-impact order
- a final "ready to submit: YES/NO"

Be strict.
Do not reward unverified features.
```

---

# Prompt 18 — Optional Docker Bonus

```text
Only execute this prompt if Phases 1–6 are complete and stable.

Read rules.md and memory.md.

Add a minimal Docker setup without changing application behavior.

Goal:
- make local evaluator setup easier;
- avoid adding infrastructure complexity.

Prefer:
- Dockerfile for backend
- Dockerfile for frontend only if useful
- docker-compose for PostgreSQL + backend (+ frontend if appropriate)
- documented environment variables
- healthcheck where useful

Do not break normal non-Docker local development.

Run a build/config validation if Docker is available.
Update README and memory.md.
If Docker is unavailable, create the files but clearly mark runtime verification as NOT RUN.
```

---

# Prompt 19 — Optional GitHub Actions Bonus

```text
Only execute after the MVP is stable.

Add a minimal GitHub Actions CI workflow that runs appropriate checks on push/pull request.

Preferred checks:
- install dependencies
- backend typecheck
- backend tests
- backend build
- frontend typecheck
- frontend build

Use the repository's actual package manager and scripts.
Do not place production secrets in the workflow.
Do not add deployment automation unless deployment configuration is already stable.

Update README/memory.md and report what was actually verified.
```

---

# Recommended Prompting Workflow

Use prompts in this order:

```text
Prompt 0  -> Bootstrap
Prompt 1  -> Phase 0
Prompt 2  -> Phase 1
Prompt 3  -> CRM backend
Prompt 4  -> CRM frontend
Prompt 5  -> Inventory backend
Prompt 6  -> Inventory frontend
Prompt 7  -> Challan backend
Prompt 8  -> Challan frontend
Prompt 9  -> Integration/dashboard
Prompt 10 -> Final QA/docs
Prompt 11 -> Deployment
Prompt 13 -> Compliance audit
Prompt 17 -> Final evaluator review
```

After every coding milestone:

```text
Prompt 15 -> Update memory.md
```

For a new AI chat/model:

```text
Prompt 16 -> Handoff
```

For bugs:

```text
Prompt 12 -> Debug safely
```
