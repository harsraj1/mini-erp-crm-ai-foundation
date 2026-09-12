# Current requirements: Mini Operations ERP

On 2026-09-12 the user approved implementing **Full-Stack Developer Technical Case Study 2**, replacing the visible previous workflow while preserving existing code/data. This document supersedes conflicting CRM/challan scope in the older root context files. Their engineering and stock-safety rules remain applicable. The original PDF is the current product constraint.

## Required workflow and screens

Login → Inventory → Work Orders (material stock check) → Internal Transfers / Shortage → Customer Orders (reservation). Only these five screens are in the main navigation. Legacy URLs remain for compatibility but are not part of the new demonstration.

- Inventory identifies an item (unique normalized code, name, category), location and batch. Quantities are physical, reserved and derived available = physical − reserved. Admin/Operations can create items/locations/opening balances and record IN/OUT adjustments with a reason.
- Work orders contain generated ID, location, item/material, positive required quantity, assigned user, status and author/time. Status sequence: Assigned → In Progress → Completed. Availability sums all batches of that item at the work location. Shortage is max(0, required − available). Other locations with available batches are listed.
- Transfers specify a source inventory batch, different destination location, item (from that source), positive quantity, author/time and status. Requested → Dispatched → Received. Requesting does not reserve stock. Dispatch rechecks availability and reduces source physical stock. Receipt increases destination physical stock for the same item/batch. No partial receipt.
- Customer orders contain customer name, selected inventory batch, positive quantity, creator/time. Creation and reservation are one atomic command. Physical stock remains unchanged. No fulfillment or release endpoint is required.

## Backend role matrix

| Operation | ADMIN | OPERATIONS | SALES |
| --- | --- | --- | --- |
| Read inventory, work orders, transfers, orders | Yes | Yes | Yes |
| Create item/location/opening balance, adjust inventory | Yes | Yes | No |
| Create work order / list assignees | Yes | No | No |
| Advance work status | Any work order | Assigned work order | No |
| Request/dispatch/receive transfer | Yes | Yes | No |
| Create customer order and reserve | Yes | No | Yes |

Legacy WAREHOUSE remains an Operations-compatible inventory/transfer role; ACCOUNTS can read new records but cannot mutate them. Existing role values and accounts are retained. JWT middleware reloads the user role from the database; hiding buttons is not authorization. No assigned-location restriction is implemented.

## Transaction design

`InventoryBalance` is unique by item/location/batch. PostgreSQL CHECK constraints enforce `0 <= reserved <= physical`; command quantities must be positive whole integers (maximum 2,147,483,647). Opening stock permits zero. Client-supplied totals, roles and author IDs are rejected by strict Zod schemas.

All balance mutations acquire a row lock with parameterized `SELECT ... FOR UPDATE`. The transaction reads current quantities after acquiring the lock, validates available stock, changes stock and writes `InventoryEvent` before committing. If validation, a unique key, a foreign key or event insertion fails, the command rolls back.

Reservations lock the selected balance. Two requests for 80 and 50 against 100 cannot both succeed. Transfers lock their own state first and then the balance being changed; status changes and logs share the stock transaction. State checks prevent repeated dispatch/receipt. Destination upsert uses the unique item/location/batch key so first receipts into a missing batch can safely serialize. Incoming stock stays in transit until receipt; it is absent from both locations during that interval.

Every create/adjust command affecting inventory takes a client-generated UUID `requestId`. Unique constraints reject replay with HTTP 409; a duplicate adjustment's tentative stock update rolls back along with its duplicate log. Transfer events have unique keys derived from transfer ID and action. Frontend retains the same request ID for retries of an unchanged form and disables pending submissions. After an ambiguous network failure, refresh to check the server before submitting a different command.

## Relationships and portability

New models: Item, Location, InventoryBalance, InventoryEvent, WorkOrder, InternalTransfer and CustomerOrder. User is reused. Legacy Product/StockMovement/Challan tables remain a separate dataset because old data has no reliable batch/reservation mapping. No synthetic batch migration or stock merging is performed.

Express routing delegates to a service and validator, preserving the repository conventions. Prisma handles relationships and migrations; PostgreSQL row locks are deliberate for transaction correctness. No hosting-provider SDK is required. React reuses the Axios API client, auth context and CSS design system. Read-only lists paginate; inventory searches by name/code/location/batch. Selector catalogs load existing inventory pages; this is adequate for the small case-study dataset, not optimized for very large catalogs.

## Explicit assumptions and limits

- Required work-order item is its material; no bill of materials or production recipe is supplied. Completion changes status only, never silently consumes/produces stock. Shortage is a live stock check, not a historical snapshot or work reservation.
- A customer order reserves one batch. Customer name is stored on the order; no CRM dependency is introduced.
- Transfer request checks availability but does not hold it. A later reservation may cause dispatch to return 409 until stock is replenished.
- Categories and batches are labels, not separate administration modules; locations and items have their own records.
- Quantity units are whole pieces; fractional units, damaged stock, partial receipts, order cancellation/release, assignment to locations and invoices are not implemented. The PDF lists the first four changes as possible future live-verification exercises.
- No new deployment, recorded demo video or fabricated commit history is claimed. Submission steps are in `DEMO.md` and actual checks in `CASE2_RELEASE.md`.
