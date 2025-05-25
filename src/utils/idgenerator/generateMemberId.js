// utils/generateMemberId.js
import Counter from "../../models/Counter.model.js";

/**
 * Generate a new unique member ID with prefix "KB"
 * e.g., KB01, KB02, ...,
 */
export const generateMemberId = async () => {
  try {
    const counter = await Counter.findOneAndUpdate(
      { name: "member" },
      { $inc: { sequence_value: 1 } },
      { new: true, upsert: true }
    );

    if (!counter) {
      throw new Error("Failed to generate counter");
    }

    const paddedSeq = counter.sequence_value.toString().padStart(2, "0");
    return `KB${paddedSeq}`;
  } catch (error) {
    console.error('Error generating member ID:', error);
    throw new Error('Failed to generate member ID');
  }
};
