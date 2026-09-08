# Architecture — Mini ERP + CRM Operations Portal

## 1. Architecture Goal

Use a simple, reviewable full-stack architecture that is fast to build in 48 hours while still demonstrating professional separation of concerns.

```text
React + TypeScript
        |
        | HTTPS / REST JSON
        v
Express + TypeScript API
        |
        | Service layer / transactions
        v
Prisma ORM
        |
        v
PostgreSQL
```

Authentication uses JWT bearer tokens.

## 2. Application Flow

### Login

```text
User enters email/password
        ↓
POST /api/auth/login
        ↓
Validate request
        ↓
Find user + verify hashed password
        ↓
Return JWT + safe user profile
        ↓
Frontend stores session token
        ↓
Protected requests send Authorization: Bearer <token>
```

### Customer CRM

```text
Customer List
  ├─ search/filter/paginate
  ├─ add customer
  └─ open customer
        ├─ edit profile
        └─ add/read follow-up history
```

### Inventory

```text
Product List
  ├─ add/edit product
  ├─ show current stock
  └─ stock adjustment
        ↓
database transaction
        ├─ update current stock
        └─ insert stock movement log
```

### Sales Challan

```text
Sales user selects customer
        ↓
Adds N product lines + quantities
        ↓
POST /api/challans
        ↓
Save as DRAFT
        OR
Create + confirm
        ↓
For confirmation:
  begin DB transaction
  fetch product rows
  verify quantities
  verify available stock
  create/finalize challan + product snapshots
  decrement stock
  create OUT movement logs
  commit
        ↓
Return confirmed challan
```

## 3. Key Architectural Rule

**Business logic belongs in services, not in route handlers or React components.**

Especially:

- Stock validation
- Stock deduction
- Challan confirmation
- Role authorization
- Challan numbering
- State transitions

## 4. Recommended Repository Structure

```text
mini-erp-crm/
├─ apps/
│  ├─ api/
│  │  ├─ prisma/
│  │  │  ├─ schema.prisma
│  │  │  ├─ migrations/
│  │  │  └─ seed.ts
│  │  ├─ src/
│  │  │  ├─ config/
│  │  │  │  └─ env.ts
│  │  │  ├─ controllers/
│  │  │  │  ├─ auth.controller.ts
│  │  │  │  ├─ customer.controller.ts
│  │  │  │  ├─ product.controller.ts
│  │  │  │  ├─ inventory.controller.ts
│  │  │  │  └─ challan.controller.ts
│  │  │  ├─ middleware/
│  │  │  │  ├─ auth.middleware.ts
│  │  │  │  ├─ authorize.middleware.ts
│  │  │  │  ├─ error.middleware.ts
│  │  │  │  └─ notFound.middleware.ts
│  │  │  ├─ routes/
│  │  │  ├─ services/
│  │  │  │  ├─ auth.service.ts
│  │  │  │  ├─ customer.service.ts
│  │  │  │  ├─ product.service.ts
│  │  │  │  ├─ inventory.service.ts
│  │  │  │  └─ challan.service.ts
│  │  │  ├─ validators/
│  │  │  ├─ utils/
│  │  │  ├─ types/
│  │  │  ├─ app.ts
│  │  │  └─ server.ts
│  │  ├─ tests/
│  │  ├─ .env.example
│  │  ├─ package.json
│  │  └─ tsconfig.json
│  │
│  └─ web/
│     ├─ src/
│     │  ├─ api/
│     │  ├─ components/
│     │  │  ├─ layout/
│     │  │  ├─ forms/
│     │  │  ├─ tables/
│     │  │  └─ feedback/
│     │  ├─ contexts/
│     │  ├─ hooks/
│     │  ├─ pages/
│     │  │  ├─ auth/
│     │  │  ├─ dashboard/
│     │  │  ├─ customers/
│     │  │  ├─ products/
│     │  │  └─ challans/
│     │  ├─ routes/
│     │  ├─ types/
│     │  ├─ utils/
│     │  ├─ styles/
│     │  ├─ App.tsx
│     │  └─ main.tsx
│     ├─ .env.example
│     ├─ package.json
│     └─ vite.config.ts
│
├─ docs/
│  ├─ postman/
│  └─ screenshots/
├─ prd.md
├─ architecture.md
├─ rules.md
├─ phases.md
├─ design.md
├─ memory.md
├─ prompts.md
├─ .gitignore
├─ package.json
└─ README.md
```

A simpler two-folder structure (`backend/` + `frontend/`) is also acceptable. Do not spend time restructuring after implementation begins unless necessary.

## 5. Database Model

### User

```text
id
name
email UNIQUE
passwordHash
role: ADMIN | SALES | WAREHOUSE | ACCOUNTS
createdAt
updatedAt
```

### Customer

```text
id
customerName
mobileNumber
email
businessName
gstNumber NULLABLE
customerType: RETAIL | WHOLESALE | DISTRIBUTOR
address
status: LEAD | ACTIVE | INACTIVE
followUpDate NULLABLE
notes NULLABLE
createdAt
updatedAt
```

### CustomerFollowUp

```text
id
customerId FK
note
followUpDate NULLABLE
createdById FK -> User
createdAt
```

### Product

```text
id
productName
sku UNIQUE
category
unitPrice DECIMAL
currentStock INT
minimumStockAlertQuantity INT
warehouseLocation
createdAt
updatedAt
```

### StockMovement

```text
id
productId FK
quantityChanged INT
movementType: IN | OUT
reason
createdById FK -> User
challanId NULLABLE
createdAt
```

Convention:

- `quantityChanged` stores a positive magnitude.
- Direction is represented by `movementType`.
- Product stock cannot fall below 0.

### Challan

```text
id
challanNumber UNIQUE
customerId FK
status: DRAFT | CONFIRMED | CANCELLED
totalQuantity INT
createdById FK -> User
createdAt
updatedAt
confirmedAt NULLABLE
cancelledAt NULLABLE
```

### ChallanItem

```text
id
challanId FK
productId FK

# Snapshot fields
productNameSnapshot
skuSnapshot
unitPriceSnapshot

quantity
```

This satisfies the requirement that a challan store product snapshot data rather than only product IDs.

## 6. Challan State Rules

Allowed baseline transitions:

```text
DRAFT -> CONFIRMED
DRAFT -> CANCELLED
```

Do not allow:

```text
CONFIRMED -> CONFIRMED
CONFIRMED -> DRAFT
CANCELLED -> CONFIRMED
```

For the assignment MVP, cancelling a previously confirmed challan is intentionally **not** supported unless a proper stock reversal transaction is implemented.

## 7. Stock Consistency Strategy

Challan confirmation is the most important transaction.

Pseudo-flow:

```ts
transaction(async (tx) => {
  const challan = await loadDraftChallan(tx);

  if (challan.status !== "DRAFT") {
    throw conflict("Only draft challans can be confirmed");
  }

  const products = await loadCurrentProducts(tx, challan.items);

  for (const item of challan.items) {
    if (product.currentStock < item.quantity) {
      throw conflict("Insufficient stock");
    }
  }

  for (const item of challan.items) {
    decrement product stock;
    create OUT stock movement;
  }

  update challan to CONFIRMED;
});
```

Important:

- Never decrement stock in the frontend.
- Never run stock deduction as unrelated database calls without a transaction.
- Avoid hidden side effects in generic product update APIs.
- Duplicate confirmation requests must not double-deduct stock.

## 8. API Response Convention

### Success

```json
{
  "success": true,
  "data": {}
}
```

### Error

```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_STOCK",
    "message": "Insufficient stock for SKU ABC-001",
    "details": {}
  }
}
```

Suggested status usage:

- `200` successful read/update
- `201` successful create
- `400` malformed request
- `401` unauthenticated
- `403` unauthorized role
- `404` resource not found
- `409` business/state conflict, duplicate SKU, insufficient stock
- `422` optional alternative for validation errors if used consistently
- `500` unexpected server error

## 9. Validation

Use Zod request schemas.

Validate:

- Required fields.
- Enum values.
- Positive quantities.
- Non-negative stock thresholds.
- Valid identifiers.
- Arrays contain at least one challan item.
- No duplicate product lines in one challan, or normalize/merge them explicitly.
- Price values as valid non-negative decimal amounts.
- Pagination/query values.

## 10. Role Authorization Matrix

This matrix is a pragmatic implementation assumption.

| Capability | Admin | Sales | Warehouse | Accounts |
|---|---:|---:|---:|---:|
| Login | ✓ | ✓ | ✓ | ✓ |
| View customers | ✓ | ✓ | optional read | ✓ read |
| Add/edit customers | ✓ | ✓ | — | — |
| Add follow-up | ✓ | ✓ | — | — |
| View products | ✓ | ✓ | ✓ | ✓ |
| Add/edit products | ✓ | — | ✓ | — |
| Stock adjustment | ✓ | — | ✓ | — |
| View stock movement | ✓ | ✓ read | ✓ | ✓ read |
| Create challan | ✓ | ✓ | — | — |
| Confirm challan | ✓ | ✓ | — | — |
| View challans | ✓ | ✓ | ✓ read | ✓ read |

If evaluator expectations differ, document this matrix under assumptions.

## 11. Frontend Architecture

### Auth
- `AuthContext` owns current user/session.
- Axios interceptor adds bearer token.
- Protected routes check authentication.
- Role-aware navigation improves UX.
- Backend remains the authority for permissions.

### Data
Keep it simple:

- Fetch lists from APIs.
- Maintain page-local loading/error state.
- Use reusable API client modules.
- Avoid adding Redux unless genuinely needed.

### Forms
Use React Hook Form + Zod for:

- Login
- Customer create/edit
- Product create/edit
- Stock adjustment
- Challan create

## 12. Environment Variables

### Backend `.env.example`

```env
NODE_ENV=development
PORT=4000
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE
JWT_SECRET=replace_me
JWT_EXPIRES_IN=8h
CORS_ORIGIN=http://localhost:5173
```

### Frontend `.env.example`

```env
VITE_API_BASE_URL=http://localhost:4000/api
```

Never commit real secrets.

## 13. Deployment Architecture

Assignment-safe free deployment:

```text
Vercel/Netlify/Render Static Site
        |
        v
Render/Railway/Fly.io API
        |
        v
Neon/Supabase/Render PostgreSQL
```

AWS is optional bonus and must not delay core delivery.

## 14. Testing Priorities

Highest-value backend tests:

1. Login success/failure.
2. Unauthorized protected route.
3. Role rejection.
4. Customer validation.
5. Duplicate SKU rejection.
6. Stock IN adjustment.
7. Stock OUT cannot make stock negative.
8. Draft challan does not reduce stock.
9. Confirmed challan reduces stock.
10. Insufficient stock rejects confirmation.
11. Multiple challan items update correctly.
12. Confirming twice does not double-deduct.
13. Snapshot data survives later product edits.

Frontend smoke paths:

- Login.
- Customer create/search/detail.
- Product create.
- Stock adjustment.
- Challan draft.
- Challan confirmation success.
- Challan insufficient-stock error.

## 15. Architecture Trade-offs

Chosen for assignment speed:

- Express rather than NestJS: less framework ceremony.
- Prisma: faster migrations/schema work and typed DB access.
- PostgreSQL: strong relational and transactional fit.
- React Context rather than Redux: auth/global needs are small.
- REST rather than GraphQL: explicitly aligned with assignment.

Do not introduce microservices, message queues, event sourcing, or complex infrastructure for this case study.
