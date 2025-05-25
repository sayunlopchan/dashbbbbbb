import mongoose from "mongoose";
import Counter from "../../models/Counter.model.js";

/**
 * Generate a new unique employee ID with prefix "EMP"
 * e.g., KB-EMP001, KB-EMP002, ...
 */
export const generateEmployeeId = async () => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const counter = await Counter.findOneAndUpdate(
      { name: "employee" },
      { $inc: { sequence_value: 1 } },
      { 
        new: true, 
        upsert: true,
        session 
      }
    );

    if (!counter) {
      throw new Error("Failed to generate counter");
    }

    const paddedSeq = counter.sequence_value.toString().padStart(3, "0");
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