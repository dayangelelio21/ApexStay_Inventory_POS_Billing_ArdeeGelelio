import express from 'express';
import path from 'path';
import session from 'express-session';
import flash from 'connect-flash';
import fs from 'fs';
import hbs from 'hbs';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname } from 'path';
import router from './routes/index.js';
import apiRoutes from './routes/apiRoutes.js';
import { sequelize } from './models/db.js';
import './models/erpModels.js';

const __filename=fileURLToPath(import.meta.url);const __dirname=dirname(__filename);
const app=express();const PORT=Number(process.env.PORT||3000);
app.disable('x-powered-by');app.use(express.json({limit:'2mb'}));app.use(express.urlencoded({extended:true}));
app.use(express.static(path.join(__dirname,'public')));
app.use(session({secret:process.env.SESSION_SECRET||'change-this-local-development-secret',resave:false,saveUninitialized:false,cookie:{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',maxAge:8*60*60*1000}}));app.use(flash());
app.engine('xian',(filePath,options,callback)=>hbs.__express(filePath,options,callback));app.set('views',path.join(__dirname,'views'));app.set('view engine','xian');
const partialsDir=path.join(__dirname,'views/partials');if(fs.existsSync(partialsDir)){for(const file of fs.readdirSync(partialsDir).filter(f=>f.endsWith('.xian'))){hbs.registerPartial(file.replace('.xian',''),fs.readFileSync(path.join(partialsDir,file),'utf8'));}}
app.use((req,res,next)=>{res.locals.success_msg=req.flash('success_msg');res.locals.error_msg=req.flash('error_msg');next();});
app.use('/api',apiRoutes);app.use('/',router);
app.use((req,res)=>req.path.startsWith('/api')?res.status(404).json({success:false,message:'API endpoint not found.'}):res.status(404).send('Page not found.'));
app.use((err,req,res,next)=>{console.error(err);if(res.headersSent)return next(err);res.status(500).json({success:false,message:'Internal server error.'});});
export default app;
export const startServer=async(port=PORT)=>{await sequelize.authenticate();console.log('MySQL connection established.');if(process.env.DB_SYNC==='true'){await sequelize.sync();console.log('Database tables synchronized.');}return app.listen(port,()=>console.log(`ApexStay XianFire API running at http://localhost:${port}`));};
const direct=process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href;if(direct)startServer().catch(err=>{console.error('Startup failed:',err.message);process.exit(1);});
