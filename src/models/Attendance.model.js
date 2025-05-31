const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    member: {
      fullName: {
        type: String,
        required: true,
        trim: true,
      },
      email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
      },
      memberId: {
        type: String,
        required: true,
        trim: true,
      },
    },
    date: {
      type: Date,
      required: true,
      default: () => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
      },
    },
    checkIn: {
      time: {
        type: Date,
        default: Date.now,
      },
      isAutoSet: {
        type: Boolean,
        default: false,
      },
    },
    checkOut: {
      time: {
        type: Date,
        default: null,
      },
      isAutoSet: {
        type: Boolean,
        default: false,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Create a compound index for member and date to ensure unique attendance per day
attendanceSchema.index({ "member.memberId": 1, date: 1 }, { unique: true });

const Attendance =
  mongoose.models.Attendance || mongoose.model("Attendance", attendanceSchema);

module.exports = Attendance;
