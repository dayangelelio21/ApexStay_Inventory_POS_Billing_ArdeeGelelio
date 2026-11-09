import { sequelize } from './models/db.js';
import { Sale, Product } from './models/erpModels.js';

try {
  await sequelize.authenticate();
  const [rows] = await sequelize.query('SELECT DATABASE() AS database_name');
  console.log('Connected database:', rows[0]?.database_name);
  console.log('Sales model table:', Sale.getTableName());
  console.log('Products model table:', Product.getTableName());

  const salesTable = Sale.getTableName();
  const productTable = Product.getTableName();
  const salesColumns = await sequelize.getQueryInterface().describeTable(salesTable);
  const productColumns = await sequelize.getQueryInterface().describeTable(productTable);

  console.log('Sales has branch_id:', Boolean(salesColumns.branch_id));
  console.log('Sales has customer_id:', Boolean(salesColumns.customer_id));
  console.log('Products has barcode:', Boolean(productColumns.barcode));
  console.log('Database connection check completed.');
} catch (error) {
  console.error('Database check failed:', error.message);
  process.exitCode = 1;
} finally {
  await sequelize.close();
}
