import Counter from '../../models/Counter.model.js';

const generateEventId = async () => {
  try {
    // Find and increment the counter for events
    const counter = await Counter.findOneAndUpdate(
      { name: 'Event' },
      { $inc: { sequence_value: 1 } },
      { new: true, upsert: true }
    );

    // Pad the sequence number to 3 digits
    const paddedSequence = counter.sequence_value.toString().padStart(3, '0');

    // Generate event ID with KBE prefix
    return `KBE${paddedSequence}`;
  } catch (error) {
    throw new Error(`Failed to generate event ID: ${error.message}`);
  }
};

export default generateEventId; 