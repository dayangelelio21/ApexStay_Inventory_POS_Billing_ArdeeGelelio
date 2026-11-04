# Database Design — Module 04

## Tables and purpose

| Table | Purpose | Key relationships |
|---|---|---|
| Categories | Product grouping | One category has many products |
| Suppliers | Vendor contact records | One supplier may supply many products |
| Products | SKU, price, unit, current on-hand and reorder level | Belongs to category/supplier; referenced by movements and sale lines |
| StockMovements | Immutable movement history | Belongs to product; IN, OUT or ADJUSTMENT |
| Sales | Invoice header, totals, payment status and customer | Has many sale items and payments |
| SaleItems | Product snapshot, quantity, unit price and line total | Belongs to sale and product |
| Payments | Cash/card/GCash/bank-transfer collection record | Belongs to sale |
| Users | Existing XianFire starter user table | Retained; future shared auth integration |

## Business rules

1. Product SKU is unique.
2. Quantities and monetary values are decimal values; frontend displays PHP.
3. Stock OUT cannot reduce stock below zero.
4. Stock IN adds quantity; Stock OUT subtracts quantity; ADJUSTMENT sets the counted balance to the submitted quantity.
5. Every stock movement records the resulting balance.
6. POS checkout runs in one Sequelize transaction and obtains row locks for products. If any line fails validation, the sale, payments, movements and stock changes roll back together.
7. Sale item name, SKU, price and cost are snapshots so historic invoices remain intelligible if the product catalog changes.
8. Additional payments cannot exceed the remaining balance.
9. Low stock means `stock_quantity <= reorder_level`.
10. Products and suppliers are archived with `is_active=false`, not hard-deleted.

## Integration boundaries

- `soldBy`, `performedBy` and `receivedBy` are text placeholders for the shared authenticated user ID/name. Replace with a foreign key to the common Users table when the group agrees on its canonical user schema.
- POS sales can later accept a room/guest/restaurant order reference from other ApexStay modules. Proposed optional integration fields: `source_module`, `source_reference`, `guest_id`, `room_id`.
- Tax is configurable per checkout in this module; confirm the hotel-wide tax policy before production.
