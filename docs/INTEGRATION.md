# Module 04 Integration Contract

## Current module boundary

The module exposes JSON REST endpoints under `/api`. React consumes the API through Vite's `/api` development proxy. The backend remains the supplied XianFire/Express application and follows its Routes → Controllers → Models pattern. MySQL access is through Sequelize + mysql2, as described by the supplied XianFire guide.

## Proposed cross-module links (not yet active)

| Partner module | Proposed exchange | Current status |
|---|---|---|
| Front Office / Guest Management | guest ID, guest name, room folio reference | Contract pending group schema |
| Restaurant / F&B | POS order ID, item lines, stock deduction | Contract pending |
| Housekeeping | supply requisition, stock issue reference | Contract pending |
| Purchasing / Procurement | purchase order, supplier, receiving reference | Supplier and stock-in primitives exist; PO workflow not implemented |
| Accounting | invoice totals, tax, payment method, revenue account mapping | Export/report data exists; accounting posting contract pending |
| HR / User Management | authenticated user ID and role | Existing starter Users table retained; shared identity mapping pending |

## Integration recommendations

1. Agree on one canonical `Users` table and role vocabulary before merging modules.
2. Replace text fields `soldBy`, `performedBy`, and `receivedBy` with the shared user foreign key.
3. Use stable IDs for guest, room, restaurant order and purchase-order references; do not duplicate the authoritative records from other modules.
4. Add optional source fields to Sales (`sourceModule`, `sourceReference`) when the originating module contract is finalized.
5. Keep checkout and inventory updates in one transaction. If a sale originates from another module, use an idempotency key to prevent duplicate charges/deductions on retry.
6. Place shared authentication and role middleware in front of all write endpoints before integration/production.
7. Agree on tax, discounts, invoice numbering and receipt retention rules with the accounting lead.
