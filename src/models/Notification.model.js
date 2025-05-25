import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    // Notification type
    type: {
      type: String,
      enum: [
        "application",
        "membershipExpiry",
        "MEMBER_START_PENDING",
        "MEMBERSHIP_EXPIRING",
        "MEMBERSHIP_CANCELLED",
      ],
      required: true,
    },

    // Reference to the related document
    relatedId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "relatedModel",
      required: true,
    },

    // Model of the related document
    relatedModel: {
      type: String,
      enum: ["Application", "Member"],
      required: true,
    },

    // Notification content
    title: {
      type: String,
      required: true,
      trim: true,
    },

    message: {
      type: String,
      required: true,
    },

    // Notification status
    status: {
      type: String,
      enum: ["unread", "read"],
      default: "unread",
    },

    // Additional context
    additionalContext: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

// Method to mark notification as read
notificationSchema.methods.markAsRead = function () {
  this.status = "read";
  return this.save();
};

// Static method to create a new notification
notificationSchema.statics.createNotification = async function (data) {
  const notification = new this(data);
  return await notification.save();
};

const Notification =
  mongoose.models.Notification ||
  mongoose.model("Notification", notificationSchema);
export default Notification;
