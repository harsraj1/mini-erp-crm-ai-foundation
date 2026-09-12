# Product Requirements Document — Mini ERP + CRM Operations Portal

> **Current scope (2026-09-12):** The user approved Case Study 2, Mini Operations ERP. [Current requirements](docs/CASE2.md) supersede conflicting scope below. Required screens now cover Inventory, Work Orders, Internal Transfers and Customer Orders with Admin/Operations/Sales login. This earlier PRD is retained as history for the preserved legacy code/data.

## 1. Product Summary

**Product name:** Mini ERP + CRM Operations Portal

A small internal operations portal for a wholesale/distribution company. The application will help internal employees manage customers, CRM follow-ups, products, stock movements, and sales challans while enforcing role-based access and essential inventory rules.

The assignment is intentionally a **mini ERP/CRM**, not a large enterprise suite. The goal is to demonstrate practical full-stack engineering: REST APIs, relational database design, frontend UI, authentication, validation, error handling, business logic, deployment, and documentation.

## 2. Primary Users

The application is for internal employees in these roles:

| Role | Primary responsibilities in this project |
|---|---|
| Admin | Full access, user/role oversight, operational visibility |
| Sales | Customer CRM and sales challan workflows |
| Warehouse | Product/stock visibility and inventory movements |
| Accounts | Read/access operational data relevant to accounts; future financial workflows can extend from here |

> Exact per-screen permissions beyond the assignment requirements are implementation assumptions and must be documented.

## 3. Core Goals

1. Provide secure login with role-based access.
2. Maintain customer and CRM follow-up information.
3. Maintain products and current stock.
4. Keep an auditable stock movement log.
5. Create draft or confirmed sales challans.
6. Reduce stock only when a challan is confirmed.
7. Prevent stock from going negative.
8. Return clear API validation and business-rule errors.
9. Provide a clean, responsive admin-style React UI.
10. Make the project easy to run, evaluate, and deploy.

## 4. Required Scope

### 4.1 Authentication and Roles

Required roles:

- Admin
- Sales
- Warehouse
- Accounts

Requirements:

- Login functionality.
- JWT-based authentication.
- Protected backend routes.
- Role-based authorization.
- Invalid/expired tokens must return an appropriate authorization error.
- Test credentials for every required role must be available for evaluation.

### 4.2 Customer CRM

Each customer must support:

- Customer name
- Mobile number
- Email
- Business name
- GST number — optional
- Customer type:
  - Retail
  - Wholesale
  - Distributor
- Address
- Status:
  - Lead
  - Active
  - Inactive
- Follow-up date
- Notes

Required customer features:

- Add customer.
- Edit customer.
- Search customer.
- View customer detail.
- Add follow-up notes.

Recommended supporting behavior:

- Paginated customer list.
- Search by name, mobile, email, or business name.
- Filters for customer type/status.
- Validation for email/mobile where appropriate.
- Store CRM follow-up notes as separate timestamped records rather than overwriting historical notes.

### 4.3 Product and Inventory

Each product must support:

- Product name
- SKU/code
- Category
- Unit price
- Current stock
- Minimum stock alert quantity
- Location/warehouse

Required product features:

- Add product.
- Edit product.

Stock movement log must track:

- Product
- Quantity changed
- Movement type: `IN` or `OUT`
- Reason
- Created by
- Timestamp

Recommended supporting behavior:

- SKU should be unique.
- Stock-changing operations must be transactional.
- Inventory mutations should create a stock movement record.
- Low-stock products should be visually identifiable when `currentStock <= minimumStockAlertQuantity`.

### 4.4 Sales Challan

A Sales user must be able to:

- Select a customer.
- Add multiple products.
- Specify quantity for each product.
- Generate a challan number automatically.
- Save challan as:
  - Draft
  - Confirmed

Challan fields:

- Challan number
- Customer
- Products
- Total quantity
- Status:
  - Draft
  - Confirmed
  - Cancelled
- Created by
- Created date

Mandatory business rules:

1. Draft challan creation must not reduce stock.
2. Confirming a challan must reduce stock.
3. Stock must never go negative.
4. Insufficient stock must return a proper API error.
5. A challan item must preserve **product snapshot data**, not only a product ID.
6. Confirmation and all associated stock updates must happen atomically.
7. A challan must not deduct stock more than once.

Suggested product snapshot fields:

- productId
- sku
- productName
- unitPrice
- quantity

### 4.5 API Requirements

Backend must expose clean REST APIs.

Minimum expected examples include:

- `POST /auth/login`
- `GET /customers`

All APIs should use:

- Input validation.
- Appropriate HTTP status codes.
- Human-readable error messages.
- Pagination where needed.
- Search/filter where needed.

Suggested API shape:

#### Auth
- `POST /api/auth/login`
- `GET /api/auth/me`

#### Customers
- `GET /api/customers`
- `POST /api/customers`
- `GET /api/customers/:id`
- `PATCH /api/customers/:id`
- `POST /api/customers/:id/follow-ups`

#### Products / Inventory
- `GET /api/products`
- `POST /api/products`
- `GET /api/products/:id`
- `PATCH /api/products/:id`
- `POST /api/products/:id/stock-movements`
- `GET /api/stock-movements`

#### Challans
- `GET /api/challans`
- `POST /api/challans`
- `GET /api/challans/:id`
- `PATCH /api/challans/:id`
- `POST /api/challans/:id/confirm`
- `POST /api/challans/:id/cancel`

## 5. Frontend Requirements

Create a clean, responsive admin-style UI using React.

Required/expected screens:

1. Login
2. Dashboard
3. Customers list
4. Add/Edit customer
5. Customer detail + follow-ups
6. Products list
7. Add/Edit product
8. Stock movement/history
9. Challans list
10. Create challan
11. Challan detail

Navigation should adapt to role permissions.

## 6. Non-Functional Requirements

### Security
- Hash passwords.
- Never store plaintext passwords.
- Use JWT secret through environment variables.
- Validate and authorize every protected backend request.
- Do not rely on frontend role checks for security.

### Reliability
- Use database transactions for challan confirmation and stock changes.
- Use database constraints where possible.
- Handle expected errors without crashing the server.

### Maintainability
- TypeScript across backend and frontend.
- Separation between route/controller, service/business logic, validation, and database access.
- Reusable frontend components.
- Consistent response/error structure.

### Usability
- Responsive layout.
- Loading, empty, success, and error states.
- Confirmation for destructive/irreversible actions where appropriate.
- Clear insufficient-stock feedback.

## 7. Tech Stack Decision

To stay within the 48-hour assignment window:

### Backend
- Node.js
- TypeScript
- Express.js
- PostgreSQL
- Prisma ORM
- REST APIs
- Zod for request validation
- JWT for authentication
- bcrypt for password hashing

### Frontend
- React
- TypeScript
- Vite
- React Router
- Axios
- React Hook Form
- Zod
- Plain CSS / CSS Modules or a lightweight consistent CSS approach

### Development / Delivery
- Git + GitHub
- Postman
- Free hosting platform
- Environment variables
- Optional Docker if the MVP is already complete

> Express/PostgreSQL are choices made within the options allowed by the assignment. Prisma and supporting libraries are implementation choices, not assignment mandates.

## 8. Out of Scope for the Required MVP

Do **not** expand scope until all required modules work.

The business context mentions purchase orders and invoices, but the explicit required core modules focus on:

- Authentication and Roles
- Customer CRM
- Product and Inventory
- Sales Challan

Therefore the following are deferred unless time remains:

- Purchase-order workflow
- Full invoicing/accounting workflow
- Payment collection
- Advanced analytics
- Multi-company tenancy
- Complex warehouse transfers
- Notifications
- Fine-grained permission editor

The assignment lists invoice PDF export as a bonus feature; it should only be attempted after the required submission is stable.

## 9. Definition of Done

The MVP is complete when:

- All 4 roles can log in with test credentials.
- Protected routes reject unauthenticated access.
- Role restrictions are enforced server-side.
- Customer CRUD/search/detail/follow-up flow works.
- Product add/edit works.
- Stock can be adjusted with movement logging.
- Challan can contain multiple products.
- Challan numbers are generated automatically.
- Draft challans do not reduce stock.
- Confirming a challan reduces stock exactly once.
- Insufficient stock blocks confirmation.
- Stock cannot become negative.
- Challan product snapshot data remains unchanged if product master data changes later.
- Core APIs have validation and useful error responses.
- UI is responsive and usable.
- README includes setup, environment, local run, deployment, assumptions, architecture summary, and known limitations.
- Postman collection/API documentation is available.
- Repository has meaningful commits.
- Submission contains required URLs/credentials or, if not deployed, the required local demonstration material.

## 10. Success Criteria for the Case Study

The evaluator should be able to understand, run, test, and review the project without needing the candidate to explain missing setup steps.

Priority order:

1. Correct business logic.
2. Working full-stack flow.
3. Clean database/API structure.
4. Clear validation/error handling.
5. Usable frontend.
6. Reproducible setup/documentation.
7. Deployment.
8. Bonus features.
