const mongoose = require("mongoose");
const Counter = require("../../models/counter.model");

/**
 * Generate a new unique employee ID with prefix "EMP"
 * e.g., KB-EMP001, KB-EMP002, ...
 */
const generateEmployeeId = async () => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const counter = await Counter.findOneAndUpdate(
      { name: "employee" },
      { $inc: { count: 1 } },
      { 
        new: true, 
        upsert: true,
        session 
      }
    );

    if (!counter) {
      throw new Error("Failed to generate counter");
    }

    const paddedSeq = counter.count.toString().padStart(3, "0");
    const employeeId = `KB-EMP${paddedSeq}`;

    await session.commitTransaction();
    return employeeId;
  } catch (error) {
    await session.abortTransaction();
    console.error('Error generating employee ID:', error);
    throw new Error('Failed to generate employee ID');
  } finally {
    session.endSession();
  }
};

module.exports = generateEmployeeId; 