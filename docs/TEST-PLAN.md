# Test Plan — ApexStay Module 04

## Environment

- MySQL database `apexstay_erp`
- XianFire backend on port 3000
- React/Vite frontend on port 5173
- Optional demo records loaded with `npm run seed`

## Functional test cases

| ID | Feature | Test | Expected result |
|---|---|---|---|
| TC-01 | API health | GET `/api/health` | 200 and `status: online` |
| TC-02 | Product create | Create product with unique SKU | 201; product appears in catalog |
| TC-03 | Duplicate SKU | Create existing SKU | 409 validation response |
| TC-04 | Supplier CRUD | Create, edit, archive supplier | Changes persist; archived supplier hidden by default |
| TC-05 | Stock in | Receive 10 units | Product balance increases by 10; IN ledger row created |
| TC-06 | Stock out | Issue available units | Balance decreases; OUT ledger row created |
| TC-07 | Insufficient stock | Issue more than available | 409; stock unchanged |
| TC-08 | Low-stock alert | Set quantity at/below reorder level | Product appears in alert list |
| TC-09 | POS checkout | Sell one or more available products | Invoice, lines, movement rows and optional payment persist |
| TC-10 | Checkout rollback | Include a line with insufficient stock | No partial sale; no stock changes |
| TC-11 | Discount/tax | Checkout with discount and tax | Total = subtotal − discount + tax on discounted subtotal |
| TC-12 | Partial payment | Pay less than total | Status PARTIAL and correct balance |
| TC-13 | Full payment | Collect remaining balance | Status PAID and zero balance |
| TC-14 | Overpayment | Payment greater than balance | 400; payment not saved |
| TC-15 | Invoice | Open and print invoice | Correct saved item snapshots and totals |
| TC-16 | Sales report | Select date range | Correct total, paid and outstanding aggregates |
| TC-17 | Inventory report | Open report | Stock value equals sum of on-hand × unit cost |

## Status

The source code and frontend build configuration are prepared. Runtime/database tests must be run on the user's machine because this workspace does not have access to the user's local MySQL service or Windows/Laragon environment. Do not mark the above cases passed until executed there.
