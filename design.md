# Design System — Mini ERP + CRM Operations Portal

## 1. Design Goal

Create a clean, professional, admin-style internal operations UI.

The design should feel:

- trustworthy;
- efficient;
- easy to scan;
- business-oriented;
- responsive;
- intentionally simple.

Avoid spending assignment time on visual novelty.

## 2. Visual Direction

Use:

- light application background;
- white content surfaces;
- strong readable typography;
- restrained primary accent;
- semantic status colors;
- subtle borders;
- modest corner radius;
- compact but comfortable tables/forms.

## 3. Color Tokens

Suggested palette:

```css
:root {
  --color-bg: #f6f8fb;
  --color-surface: #ffffff;
  --color-surface-muted: #f1f5f9;

  --color-text: #172033;
  --color-text-muted: #667085;

  --color-primary: #2563eb;
  --color-primary-hover: #1d4ed8;
  --color-primary-soft: #eff6ff;

  --color-border: #dfe5ec;

  --color-success: #15803d;
  --color-success-bg: #f0fdf4;

  --color-warning: #b45309;
  --color-warning-bg: #fffbeb;

  --color-danger: #b42318;
  --color-danger-bg: #fef3f2;

  --color-info: #0369a1;
  --color-info-bg: #f0f9ff;
}
```

If a UI library or existing project styling is already established, map these semantic intentions rather than fighting the codebase.

## 4. Typography

Preferred font stack:

```css
font-family:
  Inter,
  ui-sans-serif,
  system-ui,
  -apple-system,
  BlinkMacSystemFont,
  "Segoe UI",
  sans-serif;
```

Do not block the project on loading an external font. System fonts are acceptable.

Suggested scale:

- Page title: 28px / 700
- Section title: 20px / 600–700
- Card title: 16px / 600
- Body: 14–16px / 400
- Table header: 12–13px / 600
- Helper text: 12–13px / 400

## 5. Spacing

Use a simple 4/8-based scale:

```text
4px
8px
12px
16px
24px
32px
40px
```

Default page padding:

- desktop: 24–32px
- tablet: 20–24px
- mobile: 16px

## 6. Shape / Elevation

- Small radius: 6px
- Standard radius: 8px
- Large card/modal radius: 12px
- Prefer borders over heavy shadows.
- Use one light shadow level for floating elements/modals.

## 7. App Shell

Desktop:

```text
┌──────── Sidebar ────────┬─────────────────────────────┐
│ Logo / Project          │ Topbar: page + user/role    │
│ Dashboard               ├─────────────────────────────┤
│ Customers               │                             │
│ Products                │ Main content                │
│ Inventory               │                             │
│ Challans                │                             │
│                         │                             │
└─────────────────────────┴─────────────────────────────┘
```

Mobile:

- Sidebar becomes drawer or collapsible navigation.
- Tables may horizontally scroll or transform to cards where practical.

## 8. Core Components

Build a small reusable set:

- `AppShell`
- `Sidebar`
- `Topbar`
- `PageHeader`
- `Card`
- `Button`
- `TextInput`
- `Select`
- `TextArea`
- `FormField`
- `Table`
- `StatusBadge`
- `Pagination`
- `EmptyState`
- `LoadingState`
- `ErrorAlert`
- `ConfirmDialog`

Do not build a large component library.

## 9. Button Hierarchy

### Primary
For the main action:

- Save Customer
- Add Product
- Create Challan
- Confirm Challan

### Secondary
For:

- Cancel form
- Edit
- Back
- Filters

### Danger
For irreversible/destructive actions.

Never present multiple visually dominant primary actions without reason.

## 10. Forms

Rules:

- Label above input.
- Required fields clearly indicated.
- Field error directly below input.
- Group related fields.
- Do not use placeholders as the only labels.
- Preserve entered data after API failure.
- Disable submit while saving.
- Show success feedback without forcing a full-page reload.

## 11. Tables

Table conventions:

- Clear header row.
- Consistent alignment.
- Amounts/numbers right-aligned where useful.
- Status rendered as badge plus text.
- Row action column at end.
- Pagination below table.
- Empty state instead of a blank table.
- Search/filter near the table header.

## 12. Status Badges

Customer:

- Lead → informational/warning treatment
- Active → success
- Inactive → neutral

Challan:

- Draft → warning/neutral
- Confirmed → success
- Cancelled → neutral/danger-muted

Inventory:

- Low Stock → warning
- Out of Stock → danger

Never rely only on color; always show status text.

## 13. Dashboard

Keep dashboard useful and modest.

Suggested cards:

- Total Customers
- Leads
- Products
- Low Stock
- Draft Challans
- Confirmed Challans

Do not invent analytics that the backend does not support.

## 14. Customer UX

Customer list columns:

- Customer
- Business
- Mobile
- Type
- Status
- Follow-up date
- Action

Customer detail:

- Main customer information card.
- Follow-up section with chronological notes.
- Clear `Add Follow-up` action.

## 15. Product / Inventory UX

Product list columns:

- Product
- SKU
- Category
- Unit price
- Stock
- Minimum alert
- Location
- Action

Low-stock rows should be noticeable but not visually overwhelming.

Stock adjustment:

- Product
- Movement type
- Quantity
- Reason
- Submit

## 16. Challan UX

Create challan should optimize for speed:

1. Customer selector.
2. Dynamic product lines.
3. Each line:
   - product;
   - available stock;
   - unit price;
   - quantity;
   - remove.
4. Add product line.
5. Total quantity summary.
6. `Save Draft`.
7. `Confirm Challan`.

Before confirmation, show:

- customer;
- line items;
- requested quantities;
- confirmation warning that stock will be reduced.

If insufficient stock is returned, show the API message prominently and keep the form recoverable.

## 17. Responsive Rules

Target widths:

- Desktop: >= 1024px
- Tablet: 768–1023px
- Mobile: < 768px

At narrow widths:

- collapse navigation;
- stack form columns;
- keep actions reachable;
- prevent horizontal page overflow;
- allow data table container scrolling when necessary.

## 18. Loading / Empty / Error States

Every API-driven screen needs explicit states.

### Loading
Use a simple spinner/skeleton/text; consistency matters more than animation.

### Empty
Example:
`No customers found. Add your first customer to get started.`

### Error
Show:
- concise error message;
- retry action where useful.

Do not expose stack traces to the user.

## 19. UI Definition of Done

A screen is complete when:

- It matches the semantic design tokens.
- It works on desktop and mobile widths.
- Forms validate visibly.
- Loading and errors are handled.
- Empty state exists where relevant.
- Buttons cannot accidentally double-submit.
- Role-restricted navigation is sensible.
- The UI does not pretend an API action succeeded before confirmation from the backend.
