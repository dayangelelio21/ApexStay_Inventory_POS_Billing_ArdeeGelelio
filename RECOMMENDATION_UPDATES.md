# ApexStay Recommendation Update

## Implemented in this revision
- Added additive Sequelize entities: Branch, BranchInventory, Customer, MembershipType, Membership, and UserBranch.
- Added nullable unique Product barcode field and automatic barcode generation for new products.
- Product search now also matches barcode.
- Added API endpoints for branch CRUD, customer CRUD, membership types and memberships, branch inventory reads/stock setting, barcode lookup, sales analytics, transaction history, CSV export, and user-to-branch assignment.
- Added a safe migration path that does not drop tables, adds missing barcode/branch columns, creates a Bongabong Branch if missing, and copies legacy global stock into Bongabong inventory only where a branch-product inventory row does not already exist.
- Added Customers, Membership, and Branches navigation pages to the existing React application.
- Added POS barcode scan input and F5 checkout / F6 customer prompt shortcuts.
- Preserved the no-login/no-logout version requested by the user and retained the existing ApexStay logo and styling.

## Important limitations — not yet complete
- Branch inventory is introduced and legacy stock is backfilled, but the existing stock movement and checkout services still use the legacy Product.stockQuantity. Branch-aware stock deduction, stock transfer, and branch isolation are not yet wired end-to-end.
- Sales can carry a branchId/customerId column, but the existing checkout form/API does not yet persist a selected Customer record or cashier-to-branch context.
- UserBranch assignment is an API primitive only. Backend role authorization and branch-scoped access control are not active. The current application remains unauthenticated per the requested removal of login/logout; do not expose it publicly.
- Membership card visual generation/QR or barcode printing is not included yet. Membership records and membership types are available through the API; the UI uses basic prompts pending a fuller form.
- Dashboard analytics API provides today/week/month and previous-period totals, but branch charts and consolidated/branch role-aware dashboard views are not fully integrated.
- Transaction history API and CSV export are available. XLSX and PDF export are not implemented in this revision.
- Automated end-to-end tests against a live MySQL database and a production frontend build were not run in this environment because dependencies and the user's database are not available here.

## Migration and setup
1. Back up the MySQL database before running migrations.
2. Keep the local `.env` file; it is intentionally excluded from this ZIP.
3. From the project root run `npm install`, then `npm run migrate`, then `npm run seed`.
4. In another terminal run `npm run xian`.
5. In `frontend`, run `npm install` and `npm run dev`.
6. Open the Vite URL shown in the terminal.

The migration is additive and does not use `force: true`. Review the migration output and verify legacy product quantities before using the new branch inventory features.
