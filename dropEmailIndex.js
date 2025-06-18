const mongoose = require('mongoose');
require('dotenv').config();

async function dropEmailIndex() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get the ApplicationHistory collection
    const db = mongoose.connection.db;
    const collection = db.collection('applicationhistories');

    // List all indexes to see what exists
    const indexes = await collection.indexes();
    console.log('Current indexes:', indexes);

    // Drop the email index if it exists
    try {
      await collection.dropIndex('email_1');
      console.log('Successfully dropped email_1 index');
    } catch (error) {
      if (error.code === 27) {
        console.log('Index email_1 does not exist, skipping...');
      } else {
        console.error('Error dropping index:', error);
      }
    }

    // List indexes again to confirm
    const indexesAfter = await collection.indexes();
    console.log('Indexes after dropping:', indexesAfter);

    console.log('Index cleanup completed');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

dropEmailIndex(); 