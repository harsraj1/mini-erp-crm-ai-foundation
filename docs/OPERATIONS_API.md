# Mini Operations ERP API

Base: `http://localhost:4000/api`. JSON request/response. Login: `POST /auth/login` with `{ "email": "admin@demo.example.com", "password": "<your-demo-password>" }`; token is in `data.token`. Send `Authorization: Bearer <token>` for all routes below. `GET /auth/me` returns safe user data.

Success: `{ "success": true, "data": ... }`. Failure: `{ "success": false, "error": { "code": "...", "message": "...", "details": [] } }`; validation details contain field/message and are optional for other errors.

Role shorthand: **I** = ADMIN/OPERATIONS (legacy WAREHOUSE also accepted), **A** = ADMIN, **S** = ADMIN/SALES. Read routes allow all authenticated roles. Author fields come from authentication, never request input.

| Method/path (under `/api/operations`) | Role | Success | Body / purpose |
| --- | --- | --- | --- |
| GET `/catalog` | Read | 200 | `{items, locations}` sorted by name |
| GET `/assignees` | A | 200 | Array of safe Admin/Operations/Warehouse users |
| POST `/items` | I | 201 | `name`, `code`, `category`; code normalized uppercase and unique |
| POST `/locations` | I | 201 | `name`, unique |
| GET `/inventory` | Read | 200 | Paginated balances with item/location and availableQuantity |
| POST `/inventory` | I | 201 | `requestId`, `itemId`, `locationId`, `batch`, `physicalQuantity` |
| POST `/inventory/:id/adjust` | I | 200 | `requestId`, `direction` IN/OUT, `quantity`, `reason` |
| GET `/inventory/:id/history` | Read | 200 | Paginated physical/reserved deltas, reason, safe author, timestamp |
| GET `/work-orders` | Read | 200 | Paginated work orders including availableQuantity, shortage, alternatives |
| POST `/work-orders` | A | 201 | `requestId`, `itemId`, `locationId`, `requiredQuantity`, `assignedUserId` |
| PATCH `/work-orders/:id` | I | 200 | `status`: IN_PROGRESS or COMPLETED; assigned user/Admin only |
| GET `/transfers` | Read | 200 | Paginated transfers, source item/batch/location and destination |
| POST `/transfers` | I | 201 | `requestId`, `sourceBalanceId`, `destinationLocationId`, `quantity` |
| POST `/transfers/:id/dispatch` | I | 200 | Empty body; atomic source deduction + event + status |
| POST `/transfers/:id/receive` | I | 200 | Empty body; atomic destination addition + event + status |
| GET `/orders` | Read | 200 | Paginated customer orders with balance and safe creator |
| POST `/orders` | S | 201 | `requestId`, `customerName`, `balanceId`, `quantity`; atomic reservation |

List shape: `data: { rows: [], pagination: { page, limit, total, totalPages } }`. Query `page` defaults to 1, limit to 20 (maximum100). Inventory supports `search` as a case-insensitive substring on item name/code, location or batch. Lists sort deterministically; no results give rows[] and totalPages0. All list queries currently accept optional search, but only inventory applies it; omit it elsewhere. IDs use generated CUIDs; assignee IDs use existing User IDs.

## Example sequence

1. Create an item: `{ "name":"Cotton", "code":"COT-001", "category":"Raw material" }`. Save returned ID.
2. Create locations: `{ "name":"Factory" }` and `{ "name":"Main warehouse" }`. Save IDs.
3. Create each balance with a new UUID requestId:

```json
{
  "requestId": "0f09d638-96ee-4f72-a86a-f4227237175c",
  "itemId": "<item-id>",
  "locationId": "<factory-id>",
  "batch": "B-001",
  "physicalQuantity": 60
}
```

Create another at Main warehouse with quantity50 and a different UUID. Placeholders must be replaced with actual returned IDs. Each distinct command needs a new UUID; reuse the same one for retrying unchanged input.

4. As Admin create work requiring100 at Factory, assigning the Operations user's ID from `/assignees`. GET work orders shows available60, shortage40 and Main warehouse alternative50.
5. Request a transfer of40 from the Main warehouse balance to Factory. Dispatch: source becomes10, Factory stays60. Receive: Factory becomes100. A repeat receive returns409 without changing stock.
6. As Sales create an order with customerName, Factory balanceId, quantity60 and new UUID. Physical remains100, reserved becomes60, available40. Requesting another50 fails with409.

## Validation and error semantics

- Required text is trimmed/nonempty. Item name/customer name maximum200; code/category/location/batch maximum100; adjustment reason maximum500. Unknown JSON fields are rejected on create/adjust/work status.
- Quantities are JSON integers, positive except opening stock may be0; maximum2,147,483,647. Numeric strings, fractions and negatives return400. Aggregate stock overflow returns400.
- `400 VALIDATION_ERROR`: invalid fields/IDs/quantities or same source/destination; `400 INVALID_ASSIGNEE`: invalid/non-operations assignee.
- `401 UNAUTHORIZED`: missing/invalid/expired token. Wrong login: `401 INVALID_CREDENTIALS`. `403 FORBIDDEN`: disallowed role or another user's work order.
- `404 NOT_FOUND`: absent operation record or referenced record. `409 INSUFFICIENT_STOCK`: requested quantity exceeds current available, with no partial mutation. `409 INVALID_STATE`: invalid work/transfer transition.
- `409 DUPLICATE_REQUEST`: duplicate request UUID, item code, location name or item/location/batch balance. Stock/event changes roll back. Refresh after an ambiguous response to see whether the original command was accepted; the API does not replay cached success responses.

Transfer request creates no stock hold. Availability is checked again under a row lock at dispatch. Destination receives the same item/batch; receipt cannot be repeated. Reservations leave physical stock unchanged. Frontend stock values are informational and can become stale; backend checks are authoritative.
