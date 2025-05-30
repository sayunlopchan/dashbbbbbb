const Counter = require("../../models/counter.model");

/**
 * Generate a new unique trainer ID with prefix "KBT"
 * e.g., KBT01, KBT02, ...
 */
const generateTrainerId = async () => {
  const counter = await Counter.findOneAndUpdate(
    { name: "trainer" },
    { $inc: { count: 1 } },
    { new: true, upsert: true }
  );

  const paddedSeq = counter.count.toString().padStart(2, "0");
  return `KB-TRN${paddedSeq}`;
};

module.exports = generateTrainerId;
