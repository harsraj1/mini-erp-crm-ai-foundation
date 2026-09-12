# Operations schema

Source: `apps/api/prisma/schema.prisma`; additive migration: `20260912090000_operations_erp`.

```mermaid
erDiagram
  User ||--o{ WorkOrder : creates_and_is_assigned
  User ||--o{ InternalTransfer : creates
  User ||--o{ CustomerOrder : creates
  User ||--o{ InventoryEvent : records
  Item ||--o{ InventoryBalance : stocked_as
  Location ||--o{ InventoryBalance : holds
  Item ||--o{ WorkOrder : required_material
  Location ||--o{ WorkOrder : performed_at
  InventoryBalance ||--o{ InventoryEvent : has_history
  InventoryBalance ||--o{ InternalTransfer : source
  Location ||--o{ InternalTransfer : destination
  InventoryBalance ||--o{ CustomerOrder : reserved_from
  InventoryBalance {
    string id PK
    string itemId FK
    string locationId FK
    string batch
    int physicalQuantity
    int reservedQuantity
  }
  WorkOrder {
    string id PK
    string requestId UK
    string itemId FK
    string locationId FK
    string assignedUserId FK
    string createdById FK
    int requiredQuantity
    enum status
    datetime createdAt
  }
  InternalTransfer {
    string id PK
    string requestId UK
    string sourceBalanceId FK
    string destinationLocationId FK
    int quantity
    enum status
    string createdById FK
    datetime createdAt
    datetime dispatchedAt
    datetime receivedAt
  }
  CustomerOrder {
    string id PK
    string requestId UK
    string customerName
    string balanceId FK
    int quantity
    string createdById FK
    datetime createdAt
  }
  InventoryEvent {
    string id PK
    string requestId UK
    string balanceId FK
    int physicalChange
    int reservedChange
    string reason
    string createdById FK
    datetime createdAt
  }
```

Item has unique `code`, `name`, `category`; Location has unique `name`. Balance has a composite unique key `(itemId, locationId, batch)`. Available is derived, never a separately writable column. Foreign keys restrict deletion of referenced records. CHECK constraints protect nonnegative balances and positive order/work/transfer quantities.

User stores name, email, passwordHash and Role. Only safe user fields are returned. ADMIN, OPERATIONS and SALES are the current required roles; WAREHOUSE and ACCOUNTS are retained for compatibility. Legacy Customer, CustomerFollowUp, Product, StockMovement, Challan and ChallanItem relationships remain unchanged and are outside the diagram above.
