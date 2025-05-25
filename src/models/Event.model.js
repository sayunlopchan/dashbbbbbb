import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Event title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Event description is required"],
      trim: true,
    },
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
    },
    endDate: {
      type: Date,
      required: [true, "End date is required"],
    },
    location: {
      type: String,
      required: [true, "Event location is required"],
      trim: true,
    },
    capacity: {
      type: Number,
      required: [true, "Event capacity is required"],
      min: [1, "Capacity must be at least 1"],
    },
    status: {
      type: String,
      enum: ["upcoming", "ongoing", "completed", "cancelled"],
      default: "upcoming",
    },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    registrationDeadline: {
      type: Date,
      required: [true, "Registration deadline is required"],
    },
    category: {
      type: String,
      required: [true, "Event category is required"],
      trim: true,
    },
    imageUrl: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Validate that end date is after start date
eventSchema.pre("save", function (next) {
  if (this.endDate <= this.startDate) {
    next(new Error("End date must be after start date"));
  }
  next();
});

// Validate that registration deadline is before start date
eventSchema.pre("save", function (next) {
  if (this.registrationDeadline >= this.startDate) {
    next(new Error("Registration deadline must be before start date"));
  }
  next();
});

// Create indexes
eventSchema.index({ startDate: 1 });
eventSchema.index({ status: 1 });
eventSchema.index({ category: 1 });

// Delete associated participants when an event is deleted
eventSchema.pre("deleteOne", { document: true }, async function (next) {
  try {
    const Participant = mongoose.model("Participant");
    await Participant.deleteMany({ event: this._id });
    next();
  } catch (error) {
    next(error);
  }
});

const Event = mongoose.models.Event || mongoose.model("Event", eventSchema);

export default Event;
