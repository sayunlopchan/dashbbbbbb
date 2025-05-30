const Counter = require('../../models/counter.model');

const generateAnnouncementId = async () => {
  const COUNTER_NAME = 'announcement_counter';
  
  try {
    // Find and increment the announcement counter
    const counter = await Counter.findOneAndUpdate(
      { name: COUNTER_NAME },
      { $inc: { sequence_value: 1 } },
      { 
        new: true,  // Return the updated document
        upsert: true,  // Create the document if it doesn't exist
        setDefaultsOnInsert: true  // Apply default values when upserting
      }
    );

    // Ensure sequence_value is a number and pad to 2 digits
    const paddedSequence = (counter.sequence_value || 1).toString().padStart(2, '0');

    // Generate the announcement ID with KB-ANN prefix
    return `KB-ANN${paddedSequence}`;
  } catch (error) {
    console.error('Error generating announcement ID:', error);
    
    // Create a fallback mechanism
    try {
      // If the first method fails, try a manual increment
      const manualCounter = await Counter.findOne({ name: COUNTER_NAME });
      const newValue = manualCounter ? manualCounter.sequence_value + 1 : 1;
      
      await Counter.findOneAndUpdate(
        { name: COUNTER_NAME }, 
        { sequence_value: newValue }, 
        { upsert: true }
      );

      return `KB-ANN${newValue.toString().padStart(2, '0')}`;
    } catch (fallbackError) {
      console.error('Fallback ID generation failed:', fallbackError);
      throw new Error('Failed to generate announcement ID');
    }
  }
};

module.exports = generateAnnouncementId; 