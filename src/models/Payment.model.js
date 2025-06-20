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
      enum: ["membership", "product", "locker", "other"],
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "card", "bank", "online_payment"],
      required: true,
    },
    quantity: {
      type: Number,
      required: function() {
        return this.paymentType === "product";
      },
      min: [1, "Quantity must be at least 1"],
      validate: {
        validator: function(value) {
          return this.paymentType !== "product" || value > 0;
        },
        message: "Quantity must be greater than 0 for product payments"
      }
    },
    productId: {
      type: String,
      ref: "Product",
      required: function() {
        return this.paymentType === "product";
      },
      validate: {
        validator: function(value) {
          return this.paymentType !== "product" || /^KB-PRD\d{4}$/.test(value);
        },
        message: "Invalid product ID format. Must be in format KB-PRD0000"
      }
    },
    description: {
      type: String,
      required: false,
    },
    remark: {
      type: String,
      trim: true,
      maxlength: [500, "Remark cannot exceed 500 characters"],
      default: null
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
    // Locker schema
    locker: {
      lockerNumber: {
        type: String,
        trim: true,
        required: false,
      }
    },
    // Personal Trainer schema
    personalTrainer: {
      trainerFullName: {
        type: String,
        trim: true,
        required: false,
      },
      trainerId: {
        type: String,
        trim: true,
        required: false,
      }
    }
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
PaymentSchema.index({ memberId: 1, paymentDate: -1 });
PaymentSchema.index({ paymentType: 1, paymentDate: -1 });
PaymentSchema.index({ productId: 1 });
PaymentSchema.index({ "personalTrainer.trainerId": 1 });

const Payment =
  mongoose.models.Payment || mongoose.model("Payment", PaymentSchema);

module.exports = Payment;
