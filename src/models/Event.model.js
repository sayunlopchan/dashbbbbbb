import mongoose from "mongoose";
import Participant from "./Participant.model.js";

const EventSchema = new mongoose.Schema(
  {
    eventId: {
      type: String,
      unique: true,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: [String],
      required: true,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    authorName: {
      type: String,
      required: true,
    },
    participantCount: {
      type: Number,
      default: 0,
    },
    images: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Delete associated participants when an event is deleted
EventSchema.pre("deleteOne", { document: true }, async function (next) {
  try {
    await Participant.deleteMany({ event: this.eventId });
    next();
  } catch (error) {
    next(error);
  }
});

const Event = mongoose.models.Event || mongoose.model("Event", EventSchema);

export default Event;
