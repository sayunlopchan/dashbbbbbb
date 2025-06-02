const Counter = require('../../models/Counter.model');

const generateProductId = async () => {
  try {
    // Find and increment the counter for products, or create it if it doesn't exist
    const counter = await Counter.findOneAndUpdate(
      { name: 'Product' },
      { 
        $inc: { count: 1 }
      },
      { 
        new: true, 
        upsert: true,
        setDefaultsOnInsert: true
      }
    );

    if (!counter || typeof counter.count !== 'number') {
      throw new Error('Failed to generate sequence number');
    }

    // Pad the sequence number to 4 digits
    const paddedSequence = counter.count.toString().padStart(4, '0');

    // Generate product ID with KBP prefix
    return `KB-PRD${paddedSequence}`;
  } catch (error) {
    throw new Error(`Failed to generate product ID: ${error.message}`);
  }
};

module.exports = generateProductId; 