require('dotenv').config();
const mongoose = require('mongoose');
const { migrateMembershipColors } = require('./src/utils/membershipMigration');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/knox-barbell')
  .then(() => {
    console.log('Connected to MongoDB');
    return migrateMembershipColors();
  })
  .then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  }); 