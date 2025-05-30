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

const Trainer =
  mongoose.models.Trainer || mongoose.model("Trainer", trainerSchema);

module.exports = Trainer;
