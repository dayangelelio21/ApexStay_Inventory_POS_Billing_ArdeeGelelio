import { sequelize } from '../models/db.js';
import { Product, StockMovement } from '../models/erpModels.js';
import { Op } from 'sequelize';

export async function moveStock({ productId, type, quantity, reference, reason, unitCost, performedBy }) {
  const qty = Number(quantity);
  if (!Number.isFinite(qty) || qty <= 0) throw Object.assign(new Error('Quantity must be greater than zero.'), { status: 400 });
  if (!['IN','OUT','ADJUSTMENT'].includes(type)) throw Object.assign(new Error('Invalid stock movement type.'), { status: 400 });
  return sequelize.transaction(async transaction => {
    const product = await Product.findByPk(productId, { transaction, lock: transaction.LOCK.UPDATE });
    if (!product || !product.isActive) throw Object.assign(new Error('Active product not found.'), { status: 404 });
    const current = Number(product.stockQuantity);
    const next = type === 'IN' ? current + qty : type === 'OUT' ? current - qty : qty;
    if (next < 0) throw Object.assign(new Error(`Insufficient stock. Available: ${current}.`), { status: 409 });
    await product.update({ stockQuantity: next }, { transaction });
    const movement = await StockMovement.create({ productId, type, quantity: qty, reference, reason, unitCost: unitCost ?? product.costPrice, balanceAfter: next, performedBy }, { transaction });
    return { product, movement };
  });
}

export async function lowStockProducts() {
  return Product.findAll({ where: { isActive: true, [Op.and]: sequelize.where(sequelize.col('stock_quantity'), Op.lte, sequelize.col('reorder_level')) }, order: [['stockQuantity','ASC']] });
}
