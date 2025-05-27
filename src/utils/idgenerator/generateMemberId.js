// utils/generateMemberId.js
import Counter from "../../models/counter.model.js";

/**
 * Generate a new unique member ID with prefix "KB-M"
 * e.g., KB-M01, KB-M02, ...,
 */
export const generateMemberId = async () => {
  try {
    const counter = await Counter.findOneAndUpdate(
      { name: "member" },
      { $inc: { count: 1 } },
      { new: true, upsert: true }
    );

    if (!counter) {
      throw new Error("Failed to generate counter");
    }

    const paddedSeq = counter.count.toString().padStart(2, "0");
    return `KB-M${paddedSeq}`;
  } catch (error) {
    console.error('Error generating member ID:', error);
    throw new Error('Failed to generate member ID');
  }
};
