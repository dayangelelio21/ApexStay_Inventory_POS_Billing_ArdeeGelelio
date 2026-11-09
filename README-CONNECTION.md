# ApexStay ERP — Backend, Frontend, and MySQL Setup

## 1. Configure MySQL
Create the database in phpMyAdmin (SQL tab):
```sql
CREATE DATABASE IF NOT EXISTS apexstay_erp
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

## 2. Configure the backend
Copy `.env.example` to `.env` in this project root. Set your own MySQL credentials:
```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=apexstay_erp
DB_USER=root
DB_PASSWORD=
PORT=3004
```
Keep your real `.env` private; it is intentionally not included in this ZIP.

## 3. Install and migrate
From the project root (the folder containing `package.json`):
```powershell
npm install
npm run migrate
npm run db:check
```
The migration is additive. It does not drop tables or erase existing rows.

## 4. Start the backend
In terminal 1, from the project root:
```powershell
npm run xian
```
Check `http://localhost:3000/api/health`. It should return JSON with `"status":"online"`.

## 5. Start the frontend
In terminal 2:
```powershell
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173`. Vite forwards `/api` requests to `http://127.0.0.1:3000`.

## Important
- Keep backend and frontend running in separate terminals.
- Do not run `npm run seed` unless you intentionally want to add the sample records.
- Back up the MySQL database before migrations.
- Keep your existing `.env` file when replacing project files; do not overwrite it with `.env.example`.
