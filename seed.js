import { sequelize } from './models/db.js';
import { Category, Supplier, Product, StockMovement } from './models/erpModels.js';

try {
 await sequelize.authenticate();
 await sequelize.sync();
 const categories=[['Housekeeping','Cleaning and guest-room supplies'],['Food & Beverage','Food, drinks and service supplies'],['Guest Amenities','Guest toiletries and welcome items'],['Maintenance','Property maintenance materials']];
 for(const [name,description] of categories) await Category.findOrCreate({where:{name},defaults:{description}});
 const suppliers=[{name:'Northstar Hospitality Supplies',contactPerson:'Sample Contact',email:'sales@example.com',phone:'+63 900 000 0000',address:'Puerto Princesa City'},{name:'Islandwide General Trading',contactPerson:'Sample Contact',email:'orders@example.com',phone:'+63 900 000 0001',address:'Palawan, Philippines'}];
 for(const supplier of suppliers) await Supplier.findOrCreate({where:{name:supplier.name},defaults:supplier});
 const cats=await Category.findAll();const sups=await Supplier.findAll();
 const products=[
  {sku:'HK-001',name:'Bath Towel',unit:'piece',costPrice:180,sellingPrice:280,stockQuantity:48,reorderLevel:15,categoryId:cats[0].id,supplierId:sups[0].id,description:'White hotel bath towel'},
  {sku:'HK-002',name:'Bed Sheet - Queen',unit:'piece',costPrice:420,sellingPrice:650,stockQuantity:22,reorderLevel:10,categoryId:cats[0].id,supplierId:sups[0].id,description:'Queen-size white bed sheet'},
  {sku:'GA-001',name:'Dental Kit',unit:'set',costPrice:22,sellingPrice:45,stockQuantity:9,reorderLevel:20,categoryId:cats[2].id,supplierId:sups[1].id,description:'Guest dental amenity kit'},
  {sku:'GA-002',name:'Shampoo 30ml',unit:'bottle',costPrice:12,sellingPrice:25,stockQuantity:80,reorderLevel:25,categoryId:cats[2].id,supplierId:sups[1].id,description:'Single-use guest shampoo'},
  {sku:'FB-001',name:'Bottled Water 500ml',unit:'bottle',costPrice:12,sellingPrice:30,stockQuantity:120,reorderLevel:30,categoryId:cats[1].id,supplierId:sups[1].id,description:'Purified bottled water'},
  {sku:'MT-001',name:'LED Bulb 9W',unit:'piece',costPrice:65,sellingPrice:110,stockQuantity:14,reorderLevel:8,categoryId:cats[3].id,supplierId:sups[0].id,description:'Energy-saving LED bulb'}
 ];
 for(const product of products) { const [row,created]=await Product.findOrCreate({where:{sku:product.sku},defaults:product}); if(created && Number(product.stockQuantity)>0) await StockMovement.create({productId:row.id,type:'IN',quantity:product.stockQuantity,reference:'OPENING-STOCK',reason:'Demo opening balance',unitCost:product.costPrice,balanceAfter:product.stockQuantity,performedBy:'System seed'}); }
 console.log('Sample data ready. No duplicate SKU records were created.');
} catch(e){console.error('Seed failed:',e.message);process.exitCode=1;} finally {await sequelize.close();}
