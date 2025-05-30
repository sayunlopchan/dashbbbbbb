const Counter = require('../../models/counter.model');

const generateApplicationId = async () => {
  const COUNTER_NAME = 'application_counter';
  
  try {
    // Find and increment the application counter
    const counter = await Counter.findOneAndUpdate(
      { name: COUNTER_NAME },
      { $inc: { count: 1 } },
      { 
        new: true,  // Return the updated document
        upsert: true,  // Create the document if it doesn't exist
        setDefaultsOnInsert: true  // Apply default values when upserting
      }
    );

    // Ensure count is a number and pad to 2 digits
    const paddedSequence = (counter.count || 1).toString().padStart(2, '0');

    // Generate the application ID with KBA prefix
    return `KB-APP${paddedSequence}`;
  } catch (error) {
    console.error('Error generating application ID:', error);
    
    // Create a fallback mechanism
    try {
      // If the first method fails, try a manual increment
      const manualCounter = await Counter.findOne({ name: COUNTER_NAME });
      const newValue = manualCounter ? manualCounter.count + 1 : 1;
      
      await Counter.findOneAndUpdate(
        { name: COUNTER_NAME }, 
        { count: newValue }, 
        { upsert: true }
      );

      return `KBA${newValue.toString().padStart(2, '0')}`;
    } catch (fallbackError) {
      console.error('Fallback ID generation failed:', fallbackError);
      throw new Error('Failed to generate application ID');
    }
  }
};

module.exports = generateApplicationId; 