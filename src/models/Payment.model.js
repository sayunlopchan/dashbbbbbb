const mongoose = require("mongoose");

const PaymentSchema = new mongoose.Schema(
  {
    paymentId: {
      type: String,
      unique: true,
      required: true,
    },
    memberId: {
      type: String,
      required: true,
      ref: "Member",
    },
    fullName: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    paymentType: {
      type: String,
      enum: ["membership", "product", "other"],
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "card", "bank", "online_payment"],
      required: true,
    },
    description: {
      type: String,
      required: false,
    },
    paymentDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "completed",
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
PaymentSchema.index({ memberId: 1, paymentDate: -1 });
PaymentSchema.index({ paymentType: 1, paymentDate: -1 });

const Payment =
  mongoose.models.Payment || mongoose.model("Payment", PaymentSchema);

module.exports = Payment;
