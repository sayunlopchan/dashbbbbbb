const mongoose = require("mongoose");

const membershipSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Membership title is required"],
      trim: true,
      unique: true,
    },
    price: {
      type: Number,
      required: [true, "Membership price is required"],
      min: [0, "Price cannot be negative"],
    },
    duration: {
      type: String,
      required: [true, "Membership duration is required"],
    },
  },
  {
    timestamps: true,
  }
);

// Validate price is a positive number
membershipSchema.path("price").validate(function (value) {
  return value >= 0;
}, "Price must be a non-negative number");

const Membership = mongoose.model("Membership", membershipSchema);

module.exports = Membership;
