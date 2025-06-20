const mongoose = require("mongoose");

const trainerSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      maxlength: [100, "Full name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please enter a valid email"],
    },
    contact: {
      type: String,
      required: [true, "Contact number is required"],
      match: [
        /^[0-9]{10,15}$/,
        "Please enter a valid 10-15 digit contact number",
      ],
    },
    gender: {
      type: String,
      required: [true, "Gender is required"],
      enum: ["male", "female", "other"],
      trim: true,
    },
    joinDate: {
      type: Date,
      required: [true, "Join date is required"],
    },
    trainerId: {
      type: String,
      unique: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    // Assigned members array
    assignedMembers: [
      {
        memberId: {
          type: String,
          required: true,
          trim: true,
        },
        fullName: {
          type: String,
          required: true,
          trim: true,
        },
        assignedDate: {
          type: Date,
          default: Date.now,
        },
        status: {
          type: String,
          enum: ["active", "inactive"],
          default: "active",
        },
        removedDate: {
          type: Date,
          default: null
        }
      }
    ],
    // Assigned member history
    assignedMemberHistory: [
      {
        memberId: {
          type: String,
          required: true,
          trim: true,
        },
        fullName: {
          type: String,
          required: true,
          trim: true,
        },
        assignedDate: {
          type: Date,
          required: true,
        },
        removedDate: {
          type: Date,
          default: null
        }
      }
    ],
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to ensure email is lowercase and trimmed
trainerSchema.pre("save", function (next) {
  this.email = this.email.toLowerCase().trim();
  this.contact = this.contact.trim();
  next();
});

// Index for faster queries
trainerSchema.index({ "assignedMembers.memberId": 1 });

const Trainer =
  mongoose.models.Trainer || mongoose.model("Trainer", trainerSchema);

module.exports = Trainer;
