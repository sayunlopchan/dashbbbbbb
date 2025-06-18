const mongoose = require("mongoose");
const fs = require('fs');
const path = require('path');

const eventSchema = new mongoose.Schema(
  {
    eventId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    title: {
      type: String,
      required: [true, "Event title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    organizer: {
      type: String,
      required: [true, "Event organizer is required"],
      trim: true,
    },
    category: {
      type: String,
      required: [true, "Event category is required"],
      enum: ["fitness", "competition", "workshop", "social", "other"],
      trim: true,
    },
    location: {
      type: String,
      required: [true, "Event location is required"],
      trim: true,
    },
    startTime: {
      type: Date,
      required: [true, "Start time is required"],
    },
    endTime: {
      type: Date,
      required: [true, "End time is required"],
    },
    description: {
      type: [String],
      required: [true, "Event description is required"],
    },
    tags: {
      type: [String],
      default: [],
    },
    images: [{
      filename: String,
      originalName: String,
      path: String
    }],
    authorName: {
      type: String,
      required: true,
    },
    participantCount: {
      type: Number,
      default: 0,
    }
  },
  {
    timestamps: true,
  }
);

// Validate that end time is after start time
eventSchema.pre("save", function (next) {
  if (this.endTime <= this.startTime) {
    next(new Error("End time must be after start time"));
  }
  next();
});

// Create indexes
eventSchema.index({ startTime: 1 });
eventSchema.index({ category: 1 });

// Delete associated participants and images when an event is deleted
eventSchema.pre("deleteOne", { document: true }, async function (next) {
  try {
    // Delete associated participants
    const Participant = mongoose.model("Participant");
    await Participant.deleteMany({ event: this._id });
    
    // Delete associated images from filesystem
    if (this.images && this.images.length > 0) {
      console.log(`🗑️ Model middleware: Deleting ${this.images.length} images for event ${this.eventId}`);
      
      for (const image of this.images) {
        if (image.filename) {
          try {
            const imagePath = path.join(process.cwd(), 'uploads', image.filename);
            if (fs.existsSync(imagePath)) {
              fs.unlinkSync(imagePath);
              console.log(`✅ Model middleware: Deleted image ${image.filename}`);
            } else {
              console.warn(`⚠️ Model middleware: Image file not found ${imagePath}`);
            }
          } catch (error) {
            console.error(`❌ Model middleware: Failed to delete image ${image.filename}:`, error.message);
          }
        }
      }
    }
    
    next();
  } catch (error) {
    console.error('❌ Model middleware: Error in pre-delete:', error);
    next(error);
  }
});

const Event = mongoose.models.Event || mongoose.model("Event", eventSchema);

module.exports = Event;
