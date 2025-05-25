import Counter from '../../models/Counter.model.js';

const generatePaymentId = async () => {
  try {
    // Find and increment the counter for payments
    const counter = await Counter.findOneAndUpdate(
      { name: 'Payment' },
      { $inc: { sequence_value: 1 } },
      { new: true, upsert: true }
    );

    // Pad the sequence number to 4 digits
    const paddedSequence = counter.sequence_value.toString().padStart(4, '0');

    // Generate payment ID with KBP prefix
    return `KBP${paddedSequence}`;
  } catch (error) {
    throw new Error(`Failed to generate payment ID: ${error.message}`);
  }
};

export default generatePaymentId; 