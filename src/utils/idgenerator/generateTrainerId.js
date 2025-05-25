import Counter from "../../models/Counter.model.js";

/**
 * Generate a new unique trainer ID with prefix "KBT"
 * e.g., KBT01, KBT02, ...
 */
export const generateTrainerId = async () => {
  const counter = await Counter.findOneAndUpdate(
    { name: "trainer" },
    { $inc: { sequence_value: 1 } },
    { new: true, upsert: true }
  );

  const paddedSeq = counter.sequence_value.toString().padStart(2, "0");
  return `KBT${paddedSeq}`;
};
