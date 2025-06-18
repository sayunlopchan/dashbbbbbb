const mongoose = require("mongoose");

const applicationHistorySchema = new mongoose.Schema(
  {
    applicationId: {
      type: String,
      required: true,
      unique: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    gender: {
      type: String,
      required: true,
      enum: ["male", "female", "other"],
      trim: true,
    },
    membershipType: {
      type: String,
      enum: ["silver", "gold", "diamond", "platinum"],
    },
    membershipDuration: {
      type: Number,
      enum: [1, 3, 6, 12],
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
    },
    submittedAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Remove the unique email constraint since multiple applications can have the same email
// applicationHistorySchema.index(
//   { email: 1 },
//   { unique: true, collation: { locale: "en", strength: 2 } }
// );

const ApplicationHistory =
  mongoose.models.ApplicationHistory ||
  mongoose.model("ApplicationHistory", applicationHistorySchema);

module.exports = ApplicationHistory;
