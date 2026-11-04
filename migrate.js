import { sequelize } from './models/db.js';
import './models/erpModels.js';
import './models/userModel.js';

// Safe additive synchronization. Never use force:true in a project containing data.
try {
  await sequelize.authenticate();
  await sequelize.sync({ alter: process.env.DB_ALTER === 'true' });
  console.log('Database tables are ready. Existing data was not force-dropped.');
} catch (error) {
  console.error('Migration failed:', error.message);
  process.exitCode = 1;
} finally { await sequelize.close(); }
