# API reference

Base URL: `http://localhost:4000/api`. Send JSON and `Authorization: Bearer <token>` except on login. Success is `{success:true,data:...}`; errors are `{success:false,error:{code,message,details?}}`. Validation 400, unauthenticated 401, forbidden 403, missing record 404, duplicate SKU/state conflict/insufficient stock 409. Unknown failures return safe 500 responses.

## Authentication
POST `/auth/login`: `{email,password}` → `data:{token,user}`. GET `/auth/me` → `data:{user}`. User excludes passwordHash. See README demo accounts.

## Customers
GET `/customers`: page (default 1), limit (default 20, max 100), search, status, customerType → `{customers,pagination}`. Search covers name/mobile/email/business.
POST `/customers`: customerName, mobileNumber, email, businessName, customerType (RETAIL/WHOLESALE/DISTRIBUTOR), address, status (LEAD/ACTIVE/INACTIVE); optional gstNumber, followUpDate, notes → 201 `{customer}`.
GET `/customers/:id` → `{customer}` with followUps. PATCH same path accepts partial profile fields → `{customer}`.
POST `/customers/:id/follow-ups`: `{note,followUpDate?}` → 201 `{followUp}`. History is retained; omitted date preserves schedule, null clears it.
Reads ADMIN/SALES/ACCOUNTS; writes ADMIN/SALES. Warehouse denied.

## Products and inventory
GET `/products`: page, limit, search, category → `{products,pagination}`. Search covers productName, sku, category, warehouseLocation.
POST `/products`: `{productName,sku,category,unitPrice,currentStock,minimumStockAlertQuantity,warehouseLocation}` → 201 product directly in data. SKU is uppercase/unique; price is decimal, stock integers nonnegative.
GET `/products/:id` → product directly in data with stockMovements and safe authors.
PATCH `/products/:id`: partial master fields (stock is not editable here) → product directly in data.
POST `/products/:id/stock-movements`: `{movementType:"IN"|"OUT",quantityChanged:positiveInteger,reason}` → 201 updated product directly in data.
GET `/stock-movements`: page, limit, productId, movementType → `{movements,pagination}`.
All roles read; ADMIN/WAREHOUSE write. Accepted adjustments update stock and log atomically. OUT cannot exceed stock.

## Challans
POST `/challans`: `{customerId,items:[{productId,quantity}]}` → 201 `{challan}`. One to 100 distinct products; positive integer quantities. Always creates DRAFT without deduction. Number and product snapshots generated server-side.
GET `/challans`: page, limit, status → `{challans,pagination}`.
GET `/challans/:id` → `{challan}` with customer, safe creator and snapshot items.
POST `/challans/:id/confirm` → `{challan}` CONFIRMED. Insufficient stock returns 409 INSUFFICIENT_STOCK. All deductions/logs/state commit together. Repeated or concurrent confirmation cannot deduct twice.
POST `/challans/:id/cancel` → `{challan}` CANCELLED; drafts only. Invalid transitions return 409 INVALID_CHALLAN_STATUS. No confirmed cancellation or stock reversal.
All roles read; ADMIN/SALES create/confirm/cancel. No draft editing endpoint.

Pagination objects contain page, limit, total, totalPages. Product prices serialize as decimal strings. IDs are CUIDs. `/health` is outside /api and reports process liveness only.
