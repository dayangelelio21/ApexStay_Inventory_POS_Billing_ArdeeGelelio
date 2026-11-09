import { Op } from 'sequelize';
import { sequelize } from '../models/db.js';
import { Category, Supplier, Product, StockMovement, Sale, SaleItem, Payment } from '../models/erpModels.js';
import { moveStock, lowStockProducts } from '../services/inventoryService.js';

const sendError = (res, error) => {
  console.error(error);
  const status = error.status || (error.name === 'SequelizeUniqueConstraintError' ? 409 : error.name?.startsWith('Sequelize') ? 400 : 500);
  res.status(status).json({ success: false, message: error.message || 'Unexpected server error.' });
};
const asyncHandler = fn => (req,res) => Promise.resolve(fn(req,res)).catch(error => sendError(res,error));
const clean = body => Object.fromEntries(Object.entries(body).filter(([key]) => !['id','createdAt','updatedAt'].includes(key)));

export const health = (req,res) => res.json({ success:true, name:'ApexStay ERP API', module:'Inventory, Material Supply, POS and Billing', status:'online' });
export const dashboard = asyncHandler(async (req,res) => {
  const [products, suppliers, sales, lowStock, recentSales, movements] = await Promise.all([
    Product.count({ where:{isActive:true} }), Supplier.count({ where:{isActive:true} }), Sale.count(), lowStockProducts(),
    Sale.findAll({ limit:6, order:[['createdAt','DESC']], include:[{model:SaleItem,as:'items'}] }),
    StockMovement.count()
  ]);
  const totals = await Sale.findOne({ attributes:[[sequelize.fn('COALESCE',sequelize.fn('SUM',sequelize.col('total')),0),'revenue'],[sequelize.fn('COALESCE',sequelize.fn('SUM',sequelize.col('balance')),0),'outstanding']], where:{status:{[Op.ne]:'VOID'}}, raw:true });
  const today = new Date(); today.setHours(0,0,0,0);
  const todaySales = await Sale.sum('total',{where:{createdAt:{[Op.gte]:today},status:{[Op.ne]:'VOID'}}}) || 0;
  res.json({success:true,data:{products,suppliers,sales,lowStock:lowStock.length,movements,revenue:Number(totals.revenue),outstanding:Number(totals.outstanding),todaySales:Number(todaySales),lowStockItems:lowStock,recentSales}});
});

export const listCategories = asyncHandler(async(req,res)=>res.json({success:true,data:await Category.findAll({order:[['name','ASC']]})}));
export const createCategory = asyncHandler(async(req,res)=>res.status(201).json({success:true,data:await Category.create(clean(req.body))}));
export const updateCategory = asyncHandler(async(req,res)=>{const row=await Category.findByPk(req.params.id);if(!row)return res.status(404).json({success:false,message:'Category not found.'});await row.update(clean(req.body));res.json({success:true,data:row});});
export const deleteCategory = asyncHandler(async(req,res)=>{const row=await Category.findByPk(req.params.id);if(!row)return res.status(404).json({success:false,message:'Category not found.'});await row.update({isActive:false});res.json({success:true,message:'Category archived.'});});

export const listSuppliers = asyncHandler(async(req,res)=>res.json({success:true,data:await Supplier.findAll({where:req.query.all==='true'?{}:{isActive:true},order:[['name','ASC']]})}));
export const createSupplier = asyncHandler(async(req,res)=>res.status(201).json({success:true,data:await Supplier.create(clean(req.body))}));
export const updateSupplier = asyncHandler(async(req,res)=>{const row=await Supplier.findByPk(req.params.id);if(!row)return res.status(404).json({success:false,message:'Supplier not found.'});await row.update(clean(req.body));res.json({success:true,data:row});});
export const deleteSupplier = asyncHandler(async(req,res)=>{const row=await Supplier.findByPk(req.params.id);if(!row)return res.status(404).json({success:false,message:'Supplier not found.'});await row.update({isActive:false});res.json({success:true,message:'Supplier archived.'});});

export const listProducts = asyncHandler(async(req,res)=>{
 const where={...(req.query.all==='true'?{}:{isActive:true})};
 if(req.query.search) where[Op.or]=[{name:{[Op.like]:`%${req.query.search}%`}},{sku:{[Op.like]:`%${req.query.search}%`}},{barcode:{[Op.like]:`%${req.query.search}%`}}];
 if(req.query.categoryId) where.categoryId=req.query.categoryId;
 const data=await Product.findAll({where,include:[{model:Category,attributes:['id','name']},{model:Supplier,attributes:['id','name']}],order:[['name','ASC']]});res.json({success:true,data});
});
export const createProduct = asyncHandler(async(req,res)=>{const data=clean(req.body);const opening=Number(data.stockQuantity||0);if(!Number.isFinite(opening)||opening<0)throw Object.assign(new Error('Opening stock must be zero or greater.'),{status:400});if(!data.barcode)data.barcode=`APX${Date.now()}${Math.floor(Math.random()*1000)}`;data.stockQuantity=0;const row=await sequelize.transaction(async transaction=>{const created=await Product.create(data,{transaction});if(opening>0){await created.update({stockQuantity:opening},{transaction});await StockMovement.create({productId:created.id,type:'IN',quantity:opening,reference:'OPENING-STOCK',reason:'Opening stock',unitCost:created.costPrice,balanceAfter:opening,performedBy:req.body.performedBy||'System'},{transaction});}return created;});res.status(201).json({success:true,data:row});});
export const updateProduct = asyncHandler(async(req,res)=>{const row=await Product.findByPk(req.params.id);if(!row)return res.status(404).json({success:false,message:'Product not found.'});const data=clean(req.body);delete data.stockQuantity;await row.update(data);res.json({success:true,data:row});});
export const deleteProduct = asyncHandler(async(req,res)=>{const row=await Product.findByPk(req.params.id);if(!row)return res.status(404).json({success:false,message:'Product not found.'});await row.update({isActive:false});res.json({success:true,message:'Product archived.'});});
export const stockIn = asyncHandler(async(req,res)=>{const result=await moveStock({...req.body,type:'IN'});res.status(201).json({success:true,data:result});});
export const stockOut = asyncHandler(async(req,res)=>{const result=await moveStock({...req.body,type:'OUT'});res.status(201).json({success:true,data:result});});
export const adjustStock = asyncHandler(async(req,res)=>{const result=await moveStock({...req.body,type:'ADJUSTMENT'});res.status(201).json({success:true,data:result});});
export const listMovements = asyncHandler(async(req,res)=>res.json({success:true,data:await StockMovement.findAll({include:[{model:Product,attributes:['id','sku','name']}],order:[['createdAt','DESC']],limit:200})}));
export const lowStock = asyncHandler(async(req,res)=>res.json({success:true,data:await lowStockProducts()}));

export const createSale = asyncHandler(async(req,res)=>{
 const {items,customerName='Walk-in Customer',customerEmail,customerPhone,discount=0,taxRate=0,amountPaid=0,method='CASH',notes,soldBy='Ardie'}=req.body;
 if(!Array.isArray(items)||!items.length) throw Object.assign(new Error('Add at least one item to the sale.'),{status:400});
 const disc=Number(discount), taxPct=Number(taxRate), paid=Number(amountPaid);
 if([disc,taxPct,paid].some(n=>!Number.isFinite(n)||n<0)) throw Object.assign(new Error('Discount, tax and payment must be valid non-negative numbers.'),{status:400});
 const result=await sequelize.transaction(async transaction=>{
  let subtotal=0; const resolved=[];
  for(const item of items){
   const qty=Number(item.quantity);if(!Number.isFinite(qty)||qty<=0)throw Object.assign(new Error('Each item quantity must be greater than zero.'),{status:400});
   const product=await Product.findByPk(item.productId,{transaction,lock:transaction.LOCK.UPDATE});
   if(!product||!product.isActive)throw Object.assign(new Error(`Product ${item.productId} was not found.`),{status:404});
   if(Number(product.stockQuantity)<qty)throw Object.assign(new Error(`Insufficient stock for ${product.name}. Available: ${product.stockQuantity}.`),{status:409});
   const unitPrice=Number(product.sellingPrice), lineTotal=Number((qty*unitPrice).toFixed(2));subtotal+=lineTotal;resolved.push({product,qty,unitPrice,lineTotal});
  }
  if(disc>subtotal)throw Object.assign(new Error('Discount cannot exceed subtotal.'),{status:400});
  const taxable=subtotal-disc, tax=Number((taxable*taxPct/100).toFixed(2)), total=Number((taxable+tax).toFixed(2));
  if(paid>total)throw Object.assign(new Error('Initial payment cannot exceed sale total.'),{status:400});
  const invoiceNumber=`APS-${Date.now()}-${Math.floor(Math.random()*900+100)}`;
  const sale=await Sale.create({invoiceNumber,customerName,customerEmail,customerPhone,subtotal,discount:disc,tax,total,amountPaid:paid,balance:Number((total-paid).toFixed(2)),status:paid>=total?'PAID':paid>0?'PARTIAL':'UNPAID',notes,soldBy},{transaction});
  for(const item of resolved){
   const next=Number(item.product.stockQuantity)-item.qty;
   await item.product.update({stockQuantity:next},{transaction});
   await SaleItem.create({saleId:sale.id,productId:item.product.id,productName:item.product.name,sku:item.product.sku,quantity:item.qty,unitPrice:item.unitPrice,unitCost:item.product.costPrice,lineTotal:item.lineTotal},{transaction});
   await StockMovement.create({productId:item.product.id,type:'OUT',quantity:item.qty,reference:invoiceNumber,reason:'POS sale',unitCost:item.product.costPrice,balanceAfter:next,performedBy:soldBy},{transaction});
  }
  if(paid>0)await Payment.create({saleId:sale.id,paymentReference:`PAY-${Date.now()}-${Math.floor(Math.random()*900+100)}`,amount:paid,method,receivedBy:soldBy},{transaction});
  return Sale.findByPk(sale.id,{include:[{model:SaleItem,as:'items'},{model:Payment}],transaction});
 });
 res.status(201).json({success:true,data:result});
});
export const listSales = asyncHandler(async(req,res)=>res.json({success:true,data:await Sale.findAll({include:[{model:SaleItem,as:'items'},{model:Payment}],order:[['createdAt','DESC']],limit:300})}));
export const getSale = asyncHandler(async(req,res)=>{const row=await Sale.findByPk(req.params.id,{include:[{model:SaleItem,as:'items'},{model:Payment}]});if(!row)return res.status(404).json({success:false,message:'Sale not found.'});res.json({success:true,data:row});});
export const addPayment = asyncHandler(async(req,res)=>{
 const amount=Number(req.body.amount);if(!Number.isFinite(amount)||amount<=0)throw Object.assign(new Error('Payment amount must be greater than zero.'),{status:400});
 const result=await sequelize.transaction(async transaction=>{const sale=await Sale.findByPk(req.params.id,{transaction,lock:transaction.LOCK.UPDATE});if(!sale||sale.status==='VOID')throw Object.assign(new Error('Valid sale not found.'),{status:404});if(amount>Number(sale.balance))throw Object.assign(new Error('Payment exceeds outstanding balance.'),{status:400});await Payment.create({saleId:sale.id,paymentReference:`PAY-${Date.now()}-${Math.floor(Math.random()*900+100)}`,amount,method:req.body.method||'CASH',receivedBy:req.body.receivedBy||'Ardie',notes:req.body.notes},{transaction});const paid=Number(sale.amountPaid)+amount;await sale.update({amountPaid:paid,balance:Number((Number(sale.total)-paid).toFixed(2)),status:paid>=Number(sale.total)?'PAID':'PARTIAL'},{transaction});return Sale.findByPk(sale.id,{include:[{model:SaleItem,as:'items'},{model:Payment}],transaction});});res.json({success:true,data:result});
});
export const salesReport = asyncHandler(async(req,res)=>{
 const from=req.query.from?new Date(req.query.from):new Date(new Date().getFullYear(),new Date().getMonth(),1);const to=req.query.to?new Date(req.query.to):new Date();to.setHours(23,59,59,999);
 const sales=await Sale.findAll({where:{createdAt:{[Op.between]:[from,to]},status:{[Op.ne]:'VOID'}},include:[{model:SaleItem,as:'items'}],order:[['createdAt','ASC']]});
 const total=sales.reduce((s,x)=>s+Number(x.total),0), paid=sales.reduce((s,x)=>s+Number(x.amountPaid),0);
 res.json({success:true,data:{from,to,count:sales.length,total,paid,outstanding:total-paid,sales}});
});
export const inventoryReport = asyncHandler(async(req,res)=>{const products=await Product.findAll({where:{isActive:true},include:[Category,Supplier],order:[['name','ASC']]});const stockValue=products.reduce((s,p)=>s+Number(p.stockQuantity)*Number(p.costPrice),0);res.json({success:true,data:{products,stockValue,lowStockCount:(await lowStockProducts()).length}});});
