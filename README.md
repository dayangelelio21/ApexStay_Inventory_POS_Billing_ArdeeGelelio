# ApexStay ERP — Module 04

**Inventory, Material Supply, POS and Billing**  
Developer: Ardie Gelelio  
Stack: XianFire (Express MVC), React + Vite, Sequelize, MySQL, Tailwind CSS.

## Features implemented

- Product catalog with SKU, category, supplier, unit, cost/selling price and reorder threshold.
- Supplier CRUD and category management API.
- Stock-in, stock-out and stock adjustment with movement ledger and balance-after snapshots.
- Low-stock monitoring and dashboard alerts.
- POS cart with quantity controls, discount and tax calculation.
- Transaction-safe checkout: locks products, validates available stock, creates sale/items/payment, deducts stock and records stock movements in one database transaction.
- Invoice view and browser print layout.
- Partial/full payment collection with balance and payment status updates.
- Sales summary and inventory valuation reports.
- Responsive React dashboard using ApexStay palette.

## Requirements

- Node.js 20 or newer (supports `--env-file`)
- MySQL 8 or compatible MySQL server
- npm

## Setup (Windows / Laragon)

1. Extract the project ZIP.
2. Open the project root in VS Code / PowerShell.
3. Create the database in phpMyAdmin or MySQL:

   ```sql
   CREATE DATABASE apexstay_erp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

4. Copy `.env.example` to `.env` and set your MySQL credentials. For Laragon's default local setup, the defaults may be `DB_HOST=127.0.0.1`, `DB_USER=root`, `DB_PASSWORD=`.
5. Install backend packages:

   ```powershell
   npm install
   ```

6. Create the tables (safe sync; no `force: true`):

   ```powershell
   npm run migrate
   ```

7. Add optional sample catalog data:

   ```powershell
   npm run seed
   ```

8. Start the XianFire backend in terminal 1:

   ```powershell
   npm run dev
   ```

   API health check: `http://localhost:3000/api/health`

9. Open a second terminal, enter the frontend folder and install/start React:

   ```powershell
   cd frontend
   npm install
   npm run dev
   ```

   Frontend: `http://localhost:5173`

Vite proxies `/api` requests to XianFire on port 3000.

## Environment variables

See `.env.example`. Never commit `.env` or production credentials.

## Important data safety notes

- Do not run Sequelize with `force: true`; it drops tables.
- `npm run migrate` creates missing tables. Set `DB_ALTER=true` only for a controlled local schema update after backing up data; Sequelize `alter` is not a replacement for versioned production migrations.
- The included demo seed is additive and uses `findOrCreate` by SKU/name.
- Archive endpoints set `isActive=false`; they do not physically delete products or suppliers.
- This module currently uses local development assumptions and does not yet implement production-grade user authorization, audit identity, tax compliance, or external payment gateway integration. Protect it behind the shared ApexStay authentication/role middleware before production/integration deployment.

## API overview

Base URL: `/api`

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/health` | Health check |
| GET | `/dashboard` | KPI summary, low-stock list, recent sales |
| GET/POST | `/categories` | List/create categories |
| PUT/DELETE | `/categories/:id` | Update/archive category |
| GET/POST | `/suppliers` | List/create suppliers |
| PUT/DELETE | `/suppliers/:id` | Update/archive supplier |
| GET/POST | `/products` | List/create products |
| PUT/DELETE | `/products/:id` | Update/archive product |
| GET | `/inventory/low-stock` | Reorder alerts |
| GET | `/inventory/movements` | Stock ledger |
| POST | `/inventory/stock-in` | Receive stock |
| POST | `/inventory/stock-out` | Issue stock |
| POST | `/inventory/adjust` | Set counted stock quantity |
| GET/POST | `/sales` | List sales / checkout |
| GET | `/sales/:id` | Invoice detail |
| POST | `/sales/:id/payments` | Collect additional payment |
| GET | `/reports/sales` | Sales report (`from`, `to` optional) |
| GET | `/reports/inventory` | Inventory valuation |

## Database entities

`Categories`, `Suppliers`, `Products`, `StockMovements`, `Sales`, `SaleItems`, and `Payments`. Existing `Users` model is retained from the supplied XianFire starter. See `database/schema.sql` and `docs/DATABASE.md`.

## Testing

Run syntax checks from the project root:

```powershell
node --check index.js
node --check controllers/apiController.js
node --check models/erpModels.js
```

Run the API smoke tests with `npm run test:smoke` after starting MySQL and the backend. See `docs/TEST-PLAN.md` for manual end-to-end cases.

## Diagrams

PlantUML source files for all 16 requested diagrams are in `docs/diagrams/`. See `docs/DIAGRAM-INDEX.md` for rendering instructions and figure descriptions. Diagrams reflect this module's implemented scope and identify external ApexStay modules as integration actors/systems.
