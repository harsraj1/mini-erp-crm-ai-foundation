# Project Memory — Mini ERP + CRM Operations Portal

> This file is the running handoff context for AI-assisted development.
> Update it after every meaningful milestone. Keep it factual and concise.
> Never claim a feature/test is complete unless it actually is.

## 1. Project Identity

**Project:** Mini ERP + CRM Operations Portal

**Purpose:** Full Stack Developer case-study project for a wholesale/distribution business.

**Deadline:** 48 hours from assignment sharing.

## 2. Assignment Requirements Snapshot

Required stack:

- Node.js
- TypeScript
- Express.js or NestJS
- PostgreSQL or MySQL
- REST APIs
- Validation and error handling
- React
- HTML/CSS
- JavaScript/TypeScript
- Responsive UI
- Environment variables
- GitHub repository with proper commits
- README setup instructions

Required roles:

- Admin
- Sales
- Warehouse
- Accounts

Required core modules:

1. Authentication and Roles
2. Customer CRM
3. Product and Inventory
4. Sales Challan

Critical challan rules:

- Confirmed challan reduces stock.
- Stock cannot go negative.
- Insufficient stock returns a proper error.
- Challan stores product snapshot data.
- Draft should not deduct stock.
- Confirmation should be atomic/idempotent in implementation.

Submission expectations:

- GitHub repository
- Live frontend URL
- Live backend API URL
- Test credentials for all roles
- Postman/API documentation
- README
- Architecture explanation
- Known limitations/incomplete parts

AWS is optional bonus. Free hosting is acceptable.

## 3. Current Architecture Decision

Planned stack:

### Backend
- Express.js + TypeScript
- PostgreSQL
- Prisma
- Zod
- JWT
- bcrypt

### Frontend
- React + TypeScript + Vite
- React Router
- Axios
- React Hook Form + Zod

### Delivery
- Free hosting platform first
- Postman
- GitHub
- Optional Docker only after MVP

## 4. Current Phase

`Phase 0 — Foundation`

Status: **NOT STARTED**

Next target:

- Scaffold backend/frontend.
- Configure PostgreSQL/Prisma.
- Add environment examples.
- Create health endpoint.

## 5. Completed Work

None yet.

## 6. Database / Migration State

No migrations yet.

Planned entities:

- User
- Customer
- CustomerFollowUp
- Product
- StockMovement
- Challan
- ChallanItem

## 7. API State

No endpoints implemented yet.

Planned initial endpoint:

- `GET /health`

## 8. Frontend State

Not scaffolded yet.

## 9. Authentication State

Not implemented.

Required seeded roles:

- Admin
- Sales
- Warehouse
- Accounts

## 10. Tests / Build Status

Not run yet.

Use this exact format after each run:

```text
Backend typecheck:
Backend tests:
Backend build:
Frontend typecheck:
Frontend tests:
Frontend build:
Manual smoke test:
```

Do not replace `not run` with `pass` unless command output proves it.

## 11. Environment / Deployment State

Local environment not configured yet.

Production URLs:

```text
Frontend:
Backend:
Database provider:
```

## 12. Decisions Made

### Decision 001
Use Express rather than NestJS to reduce setup/boilerplate within a 48-hour case study.

### Decision 002
Use PostgreSQL because inventory/challan workflows benefit from relational constraints and transactions.

### Decision 003
Use Prisma to accelerate schema, migrations, seed data, and typed DB access.

### Decision 004
Implement core requirements before assignment bonus features.

## 13. Assumptions

Current assumptions:

1. Admin can access all core modules.
2. Sales manages customers/follow-ups and challans.
3. Warehouse manages product/inventory adjustments.
4. Accounts receives read access to relevant operational records in the MVP.
5. Confirmed challans are not cancellable unless stock reversal is explicitly implemented.
6. Purchase-order and complete invoice modules are outside the required MVP unless time remains.

Update this section if implementation/evaluator expectations establish different behavior.

## 14. Known Issues / Blockers

None yet.

## 15. Pending Work

- Phase 0 foundation.
- Phase 1 auth.
- Phase 2 customer CRM.
- Phase 3 product/inventory.
- Phase 4 sales challan.
- Phase 5 frontend integration/dashboard.
- Phase 6 documentation/deployment/submission.
- Phase 7 bonus only if safe.

## 16. Memory Update Template

Append/update this file after each meaningful coding session:

```md
### YYYY-MM-DD — <Milestone>

**Phase:**  
**Status:** COMPLETE / PARTIAL / BLOCKED

**Implemented**
- ...

**Files changed**
- ...

**Database changes**
- ...

**API changes**
- ...

**Frontend changes**
- ...

**Commands/tests actually run**
- `...` → PASS/FAIL

**Important decisions**
- ...

**Known issues**
- ...

**Next exact task**
- ...
```

Keep old major decisions; remove stale transient details when they no longer help continuation.
