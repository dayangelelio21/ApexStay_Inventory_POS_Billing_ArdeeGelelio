import { Op } from 'sequelize';
import { sequelize } from '../models/db.js';
import { Branch, BranchInventory, Product, Customer, MembershipType, Membership, Sale, SaleItem, Payment, StockMovement, UserBranch } from '../models/erpModels.js';
const wrap=fn=>(req,res)=>Promise.resolve(fn(req,res)).catch(e=>{console.error(e);res.status(e.status||400).json({success:false,message:e.message||'Request failed'});});
const result=(res,data,status=200)=>res.status(status).json({success:true,data});
const code=(prefix)=>`${prefix}-${Date.now()}-${Math.floor(Math.random()*900+100)}`;
export const branches=wrap(async(req,res)=>result(res,await Branch.findAll({order:[['name','ASC']]})));
export const createBranch=wrap(async(req,res)=>{const b=await Branch.create({branchId:req.body.branchId||code('BR'),code:req.body.code||code('BC'),name:req.body.name,address:req.body.address,contactInformation:req.body.contactInformation,status:req.body.status||'ACTIVE'});return result(res,b,201);});
export const updateBranch=wrap(async(req,res)=>{const b=await Branch.findByPk(req.params.id);if(!b)return res.status(404).json({success:false,message:'Branch not found'});await b.update(req.body);return result(res,b);});
export const customers=wrap(async(req,res)=>result(res,await Customer.findAll({where:req.query.search?{[Op.or]:[{name:{[Op.like]:`%${req.query.search}%`}},{phone:{[Op.like]:`%${req.query.search}%`}},{email:{[Op.like]:`%${req.query.search}%`}},{customerNumber:{[Op.like]:`%${req.query.search}%`}}]}:{},order:[['name','ASC']]})));
export const createCustomer=wrap(async(req,res)=>result(res,await Customer.create({...req.body,customerNumber:req.body.customerNumber||code('CUS')}),201));
export const updateCustomer=wrap(async(req,res)=>{const c=await Customer.findByPk(req.params.id);if(!c)return res.status(404).json({success:false,message:'Customer not found'});await c.update(req.body);return result(res,c);});
export const membershipTypes=wrap(async(req,res)=>result(res,await MembershipType.findAll({where:{isActive:true},order:[['name','ASC']]})));
export const createMembershipType=wrap(async(req,res)=>result(res,await MembershipType.create(req.body),201));
export const memberships=wrap(async(req,res)=>result(res,await Membership.findAll({include:[Customer,MembershipType],order:[['createdAt','DESC']]})));
export const createMembership=wrap(async(req,res)=>{
 const customer=await Customer.findByPk(req.body.customerId);const type=await MembershipType.findByPk(req.body.membershipTypeId);
 if(!customer||!type)throw Object.assign(new Error('Select a valid customer and membership type'),{status:400});
 const registeredAt=new Date();const expiresAt=type.durationMonths?new Date(registeredAt.getFullYear(),registeredAt.getMonth()+type.durationMonths,registeredAt.getDate()):null;
 const m=await Membership.create({customerId:customer.id,membershipTypeId:type.id,membershipNumber:req.body.membershipNumber||code('MEM'),registeredAt,expiresAt,status:'ACTIVE'});
 return result(res,await Membership.findByPk(m.id,{include:[Customer,MembershipType]}),201);
});
export const branchInventory=wrap(async(req,res)=>{
 const where={};if(req.query.branchId)where.branchId=req.query.branchId;
 return result(res,await BranchInventory.findAll({where,include:[Branch,Product],order:[['updatedAt','DESC']]}));
});
export const setBranchStock=wrap(async(req,res)=>{
 const {branchId,productId,stockQuantity,reorderLevel}=req.body;
 const b=await Branch.findByPk(branchId),p=await Product.findByPk(productId);
 if(!b||!p)throw Object.assign(new Error('Branch and product are required'),{status:400});
 const [row]=await BranchInventory.findOrCreate({where:{branchId,productId},defaults:{stockQuantity:0,reorderLevel:reorderLevel??p.reorderLevel}});
 await row.update({stockQuantity:Number(stockQuantity),reorderLevel:Number(reorderLevel??row.reorderLevel)});
 return result(res,row);
});
export const barcodeLookup=wrap(async(req,res)=>{
 const value=String(req.params.value||'').trim();
 const p=await Product.findOne({where:{isActive:true,[Op.or]:[{barcode:value},{sku:value}]}});
 if(!p)return res.status(404).json({success:false,message:'No product found for this barcode or SKU'});
 return result(res,p);
});
export const salesAnalytics=wrap(async(req,res)=>{
 const now=new Date();const start=new Date(now.getFullYear(),now.getMonth(),now.getDate());const week=new Date(start);week.setDate(week.getDate()-6);const month=new Date(now.getFullYear(),now.getMonth(),1);
 const sum=async(from,to)=>Number(await Sale.sum('total',{where:{createdAt:{[Op.gte]:from,[Op.lt]:to},status:{[Op.ne]:'VOID'},...(req.query.branchId?{branchId:req.query.branchId}:{})}})||0);
 const tomorrow=new Date(start);tomorrow.setDate(tomorrow.getDate()+1);const nextMonth=new Date(now.getFullYear(),now.getMonth()+1,1);
 const [todaySales,weeklySales,monthlySales,previousWeek,previousMonth]=await Promise.all([sum(start,tomorrow),sum(week,tomorrow),sum(month,nextMonth),sum(new Date(week.getTime()-7*86400000),week),sum(new Date(now.getFullYear(),now.getMonth()-1,1),month)]);
 const pct=(a,b)=>b?Number(((a-b)/b*100).toFixed(1)):null;
 return result(res,{todaySales,weeklySales,monthlySales,previousWeek,previousMonth,weeklyChange:pct(weeklySales,previousWeek),monthlyChange:pct(monthlySales,previousMonth)});
});
export const transactionHistory=wrap(async(req,res)=>{
 const where={...(req.query.branchId?{branchId:req.query.branchId}:{}),...(req.query.from||req.query.to?{createdAt:{...(req.query.from?{[Op.gte]:new Date(req.query.from)}:{}),...(req.query.to?{[Op.lte]:new Date(`${req.query.to}T23:59:59`)}:{})}}:{})};
 return result(res,await Sale.findAll({where,include:[{model:SaleItem,as:'items'},Payment,Customer],order:[['createdAt','DESC']],limit:500}));
});
export const assignUserBranch=wrap(async(req,res)=>result(res,await UserBranch.create({userId:req.body.userId,branchId:req.body.branchId,role:req.body.role||'CASHIER'}),201));

export const exportTransactions=wrap(async(req,res)=>{
 const rows=await Sale.findAll({include:[{model:SaleItem,as:'items'}],order:[['createdAt','DESC']],limit:5000});
 const q=v=>`"${String(v??'').replace(/"/g,'""')}"`;
 const lines=[['Invoice','Date','Customer','Cashier','Branch ID','Status','Subtotal','Discount','Tax','Total','Paid','Balance','Items'].join(',')];
 for(const sale of rows){const items=(sale.items||[]).map(i=>`${i.productName} x${i.quantity} @ ${i.unitPrice}`).join('; ');lines.push([sale.invoiceNumber,sale.createdAt,sale.customerName,sale.soldBy,sale.branchId,sale.status,sale.subtotal,sale.discount,sale.tax,sale.total,sale.amountPaid,sale.balance,items].map(q).join(','));}
 res.setHeader('Content-Type','text/csv; charset=utf-8');res.setHeader('Content-Disposition','attachment; filename="apexstay-transactions.csv"');res.send(lines.join('\r\n'));
});
