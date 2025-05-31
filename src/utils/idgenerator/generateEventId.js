const Counter = require('../../models/Counter.model');

const generateEventId = async () => {
  try {
    // Find and increment the counter for events
    const counter = await Counter.findOneAndUpdate(
      { name: 'Event' },
      { $inc: { count: 1 } },
      { 
        new: true, 
        upsert: true,
        setDefaultsOnInsert: { count: 0 }
      }
    );

    // Ensure we have a valid counter value
    if (!counter || typeof counter.count !== 'number') {
      throw new Error('Invalid counter state');
    }

    // Generate a random letter for the prefix
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const randomLetter = letters[Math.floor(Math.random() * letters.length)];

    // Pad the sequence number to 3 digits
    const paddedSequence = counter.count.toString().padStart(3, '0');

    // Generate event ID with random letter prefix
    return `KB-EVT${randomLetter}${paddedSequence}`;
  } catch (error) {
    console.error('Error in generateEventId:', error);
    throw new Error(`Failed to generate event ID: ${error.message}`);
  }
};

module.exports = generateEventId; 