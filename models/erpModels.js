import { DataTypes } from 'sequelize';
import { sequelize } from './db.js';

export const Category = sequelize.define('Category', {
  name: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  description: DataTypes.STRING(500),
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true }
});
export const Supplier = sequelize.define('Supplier', {
  name: { type: DataTypes.STRING(150), allowNull: false },
  contactPerson: DataTypes.STRING(120), email: { type: DataTypes.STRING(160), validate: { isEmail: true } },
  phone: DataTypes.STRING(40), address: DataTypes.TEXT, notes: DataTypes.TEXT,
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true }
});
export const Product = sequelize.define('Product', {
  sku: { type: DataTypes.STRING(60), allowNull: false, unique: true },
  name: { type: DataTypes.STRING(160), allowNull: false },
  description: DataTypes.TEXT, unit: { type: DataTypes.STRING(30), defaultValue: 'piece' },
  costPrice: { type: DataTypes.DECIMAL(12,2), allowNull: false, defaultValue: 0 },
  sellingPrice: { type: DataTypes.DECIMAL(12,2), allowNull: false, defaultValue: 0 },
  stockQuantity: { type: DataTypes.DECIMAL(12,2), allowNull: false, defaultValue: 0 },
  reorderLevel: { type: DataTypes.DECIMAL(12,2), allowNull: false, defaultValue: 5 },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true }
});
export const StockMovement = sequelize.define('StockMovement', {
  type: { type: DataTypes.ENUM('IN','OUT','ADJUSTMENT'), allowNull: false },
  quantity: { type: DataTypes.DECIMAL(12,2), allowNull: false },
  reference: DataTypes.STRING(100), reason: DataTypes.STRING(255),
  unitCost: { type: DataTypes.DECIMAL(12,2), defaultValue: 0 },
  balanceAfter: { type: DataTypes.DECIMAL(12,2), allowNull: false },
  performedBy: DataTypes.STRING(120)
});
export const Sale = sequelize.define('Sale', {
  invoiceNumber: { type: DataTypes.STRING(40), allowNull: false, unique: true },
  customerName: { type: DataTypes.STRING(150), defaultValue: 'Walk-in Customer' },
  customerEmail: DataTypes.STRING(160), customerPhone: DataTypes.STRING(40),
  subtotal: { type: DataTypes.DECIMAL(12,2), allowNull: false },
  discount: { type: DataTypes.DECIMAL(12,2), defaultValue: 0 },
  tax: { type: DataTypes.DECIMAL(12,2), defaultValue: 0 },
  total: { type: DataTypes.DECIMAL(12,2), allowNull: false },
  amountPaid: { type: DataTypes.DECIMAL(12,2), defaultValue: 0 },
  balance: { type: DataTypes.DECIMAL(12,2), allowNull: false },
  status: { type: DataTypes.ENUM('UNPAID','PARTIAL','PAID','VOID'), defaultValue: 'UNPAID' },
  notes: DataTypes.TEXT, soldBy: DataTypes.STRING(120)
});
export const SaleItem = sequelize.define('SaleItem', {
  productName: { type: DataTypes.STRING(160), allowNull: false },
  sku: { type: DataTypes.STRING(60), allowNull: false },
  quantity: { type: DataTypes.DECIMAL(12,2), allowNull: false },
  unitPrice: { type: DataTypes.DECIMAL(12,2), allowNull: false },
  unitCost: { type: DataTypes.DECIMAL(12,2), defaultValue: 0 },
  lineTotal: { type: DataTypes.DECIMAL(12,2), allowNull: false }
});
export const Payment = sequelize.define('Payment', {
  paymentReference: { type: DataTypes.STRING(60), allowNull: false, unique: true },
  amount: { type: DataTypes.DECIMAL(12,2), allowNull: false },
  method: { type: DataTypes.ENUM('CASH','CARD','GCASH','BANK_TRANSFER','OTHER'), allowNull: false },
  paidAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  receivedBy: DataTypes.STRING(120), notes: DataTypes.STRING(500)
});

Category.hasMany(Product, { foreignKey: { name: 'categoryId', allowNull: true }, onDelete: 'SET NULL' });
Product.belongsTo(Category, { foreignKey: 'categoryId' });
Supplier.hasMany(Product, { foreignKey: { name: 'supplierId', allowNull: true }, onDelete: 'SET NULL' });
Product.belongsTo(Supplier, { foreignKey: 'supplierId' });
Product.hasMany(StockMovement, { foreignKey: { name: 'productId', allowNull: false }, onDelete: 'RESTRICT' });
StockMovement.belongsTo(Product, { foreignKey: 'productId' });
Sale.hasMany(SaleItem, { as: 'items', foreignKey: { name: 'saleId', allowNull: false }, onDelete: 'CASCADE' });
SaleItem.belongsTo(Sale, { foreignKey: 'saleId' });
Product.hasMany(SaleItem, { foreignKey: { name: 'productId', allowNull: false }, onDelete: 'RESTRICT' });
SaleItem.belongsTo(Product, { foreignKey: 'productId' });
Sale.hasMany(Payment, { foreignKey: { name: 'saleId', allowNull: false }, onDelete: 'RESTRICT' });
Payment.belongsTo(Sale, { foreignKey: 'saleId' });

export { sequelize };
