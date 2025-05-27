import Counter from '../../models/Counter.model.js';

const generatePaymentId = async () => {
  try {
    // Find and increment the counter for payments, or create it if it doesn't exist
    const counter = await Counter.findOneAndUpdate(
      { name: 'Payment' },
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

    // Generate payment ID with KBP prefix
    return `KBP${paddedSequence}`;
  } catch (error) {
    throw new Error(`Failed to generate payment ID: ${error.message}`);
  }
};

export default generatePaymentId; 