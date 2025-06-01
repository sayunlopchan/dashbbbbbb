const mongoose = require("mongoose");

const MemberSchema = new mongoose.Schema(
  {
    memberId: {
      type: String,
      unique: true,
      required: true,
      trim: true,
    },
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
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please fill a valid email address",
      ],
    },
    contact: {
      type: String,
      required: [true, "Contact number is required"],
      trim: true,
      match: [/^[0-9]{10,15}$/, "Please provide a valid contact number"],
    },
    dateOfBirth: {
      type: Date,
      required: [true, "Date of Birth is required"],
    },
    gender: {
      type: String,
      required: [true, "Gender is required"],
      enum: ["male", "female", "other"],
      trim: true,
    },
    address: {
      type: String,
      required: [true, "Address is required"],
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
      default: "silver",
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    memberStatus: {
      type: String,
      enum: ["active", "inactive", "pending", "cancelled", "expiring", "expired"],
      default: "pending",
    },
    cancellationDate: {
      type: Date,
      default: null
    },
    cancellationReason: {
      type: String,
      trim: true,
      default: null
    },
    payments: [
      {
        amount: {
          type: Number,
          required: true,
          min: 0,
        },
        paymentDate: {
          type: Date,
          default: Date.now,
        },
        paymentMethod: {
          type: String,
          enum: ["cash", "card", "bank", "online_payment"],
          required: true,
        },
        status: {
          type: String,
          enum: ["pending", "completed", "failed"],
          default: "pending",
        },
      },
    ],
    membershipDuration: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure email is always lowercase
MemberSchema.pre("save", function (next) {
  this.email = this.email.toLowerCase().trim();
  next();
});

// Pre-save hook to set membership type based on duration
MemberSchema.pre("save", function (next) {
  if (!this.membershipType && this.membershipDuration) {
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

  if (!this.membershipDuration && this.membershipType) {
    switch (this.membershipType) {
      case "silver":
        this.membershipDuration = 1;
        break;
      case "gold":
        this.membershipDuration = 3;
        break;
      case "diamond":
        this.membershipDuration = 6;
        break;
      case "platinum":
        this.membershipDuration = 12;
        break;
      default:
        this.membershipDuration = 1;
    }
  }

  next();
});

const Member = mongoose.models.Member || mongoose.model("Member", MemberSchema);
module.exports = Member;
