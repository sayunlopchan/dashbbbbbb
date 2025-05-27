import mongoose from "mongoose";
import generateApplicationId from "../utils/idgenerator/generateApplicationId.js";

const applicationSchema = new mongoose.Schema(
  {
    applicationId: {
      type: String,
      unique: true,
      default: null,
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
    contact: {
      type: String,
      required: true,
      trim: true,
    },
    dateOfBirth: {
      type: Date,
      required: true,
    },
    gender: {
      type: String,
      required: true,
      enum: ["male", "female", "other"],
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
      maxlength: [200, "Address cannot exceed 200 characters"],
    },
    emergencyNumber: {
      type: String,
      required: true,
      trim: true,
    },
    emergencyContactName: {
      type: String,
      required: true,
      trim: true,
    },
    emergencyContactRelationship: {
      type: String,
      required: true,
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
    applicationStatus: {
      type: String,
      enum: ["pending", "rejected", "accepted"],
      default: "pending",
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    strict: true,
    strictPopulate: false,
  }
);

// Ensure case-insensitive email uniqueness
applicationSchema.index(
  { email: 1 },
  { unique: true, collation: { locale: "en", strength: 2 } }
);

// Pre-save hook to set membership type based on duration
applicationSchema.pre("save", function (next) {
  if (this.isModified("membershipDuration") && !this.membershipType) {
    switch (this.membershipDuration) {
      case 1:
        this.membershipType = "silver";
        break;
      case 3:
        this.membershipType = "gold";
        break;
      case 6:
        this.membershipType = "diamond";
        break;
      case 12:
        this.membershipType = "platinum";
        break;
      default:
        this.membershipType = "silver";
    }
  }
  next();
});

// Pre-save hook to generate applicationId only when creating a new document
applicationSchema.pre("save", async function (next) {
  // Only generate ID if:
  // 1. The document is new (being created for the first time)
  // 2. No applicationId has been manually provided
  if (this.isNew && !this.applicationId) {
    try {
      this.applicationId = await generateApplicationId();
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

const Application =
  mongoose.models.Application ||
  mongoose.model("Application", applicationSchema);

export default Application;
