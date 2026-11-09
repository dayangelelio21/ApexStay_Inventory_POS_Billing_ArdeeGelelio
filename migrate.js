import { DataTypes } from 'sequelize';
import { sequelize } from './models/db.js';
import './models/erpModels.js';
import './models/userModel.js';
import {
  Branch,
  BranchInventory,
  Product,
  StockMovement,
  MembershipType
} from './models/erpModels.js';

// Additive migration only: never drop tables or overwrite existing records.
async function findTableName(queryInterface, expectedName) {
  const tables = await queryInterface.showAllTables();
  const normalize = (value) => String(value).toLowerCase().replace(/[^a-z0-9]/g, '');
  return tables.find((table) => {
    const name = typeof table === 'string' ? table : table.tableName;
    return normalize(name) === normalize(expectedName);
  }) || null;
}

async function ensureColumn(queryInterface, tableName, columnName, definition) {
  const columns = await queryInterface.describeTable(tableName);
  if (!Object.keys(columns).some((name) => name.toLowerCase() === columnName.toLowerCase())) {
    await queryInterface.addColumn(tableName, columnName, definition);
    console.log(`Added ${tableName}.${columnName}`);
  } else {
    console.log(`Verified ${tableName}.${columnName}`);
  }
}

try {
  await sequelize.authenticate();
  console.log(`Connected to MySQL database: ${sequelize.config.database}`);

  // Create tables that do not yet exist. alter:false avoids destructive alterations.
  await sequelize.sync({ alter: false });

  const qi = sequelize.getQueryInterface();

  const productsTable = await findTableName(qi, Product.getTableName());
  const salesTable = await findTableName(qi, 'Sales');
  // Resolve the actual Sequelize table name (typically stock_movements when
  // underscored naming is enabled), rather than assuming StockMovements.
  const movementsTable = await findTableName(qi, StockMovement.getTableName());

  if (!productsTable || !salesTable || !movementsTable) {
    throw new Error(
      `Expected core tables were not found. Products=${productsTable}, Sales=${salesTable}, StockMovements=${movementsTable}. Check DB_NAME in .env.`
    );
  }

  // With underscored:true, Sequelize stores camelCase attributes as snake_case columns.
  await ensureColumn(qi, productsTable, 'barcode', {
    type: DataTypes.STRING(80),
    allowNull: true
  });

  await ensureColumn(qi, salesTable, 'branch_id', {
    type: DataTypes.INTEGER,
    allowNull: true
  });

  await ensureColumn(qi, salesTable, 'customer_id', {
    type: DataTypes.INTEGER,
    allowNull: true
  });

  await ensureColumn(qi, movementsTable, 'branch_id', {
    type: DataTypes.INTEGER,
    allowNull: true
  });

  const [branch] = await Branch.findOrCreate({
    where: { code: 'BONGABONG' },
    defaults: {
      branchId: 'BR-BONGABONG',
      code: 'BONGABONG',
      name: 'Bongabong Branch',
      status: 'ACTIVE'
    }
  });

  await MembershipType.findOrCreate({
    where: { typeId: 'STANDARD' },
    defaults: {
      typeId: 'STANDARD',
      name: 'Standard Membership',
      durationMonths: 12,
      description: 'Default ApexStay membership'
    }
  });

  // Copy old global stock into the default branch only for missing inventory rows.
  const products = await Product.findAll();
  for (const product of products) {
    const [, created] = await BranchInventory.findOrCreate({
      where: { branchId: branch.id, productId: product.id },
      defaults: {
        stockQuantity: product.stockQuantity,
        reorderLevel: product.reorderLevel
      }
    });
    if (created) console.log(`Copied legacy stock for product ${product.id} to Bongabong Branch.`);
  }

  console.log('Migration completed. Existing records were preserved.');
} catch (error) {
  console.error('Migration failed:', error.message);
  process.exitCode = 1;
} finally {
  await sequelize.close();
}
