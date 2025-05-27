import Notification from "../models/notification.model.js";

// Create a new notification
export const createNotificationService = async (notificationData) => {
  try {
    return await Notification.createNotification(notificationData);
  } catch (error) {
    throw new Error(`Failed to create notification: ${error.message}`);
  }
};

// Get all notifications with pagination and filtering
export const getAllNotificationsService = async (query = {}) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 0;
  const skip = (page - 1) * limit;
  const sort = { createdAt: -1 };

  // Prepare filter conditions
  const filter = {};

  // Status filter
  if (query.status && ["read", "unread"].includes(query.status)) {
    filter.status = query.status;
  }

  // Type filter
  if (query.type) {
    filter.type = query.type;
  }

  // Get total count
  const total = await Notification.countDocuments(filter);
  const totalPages = limit > 0 ? Math.ceil(total / limit) : 1;

  // Get paginated results
  const docs = await Notification.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(limit || 0);

  return {
    docs,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};

// Get notifications for a specific recipient
export const getNotificationsByRecipientService = async (
  recipientId,
  query = {}
) => {
  try {
    const baseQuery = { recipientId, ...query };
    return await getAllNotificationsService(baseQuery);
  } catch (error) {
    throw new Error(
      `Failed to fetch recipient notifications: ${error.message}`
    );
  }
};

// Mark a single notification as read
export const markNotificationAsReadService = async (notificationId) => {
  try {
    const notification = await Notification.findById(notificationId);
    if (!notification) {
      throw new Error("Notification not found");
    }
    return await notification.markAsRead();
  } catch (error) {
    throw new Error(`Failed to mark notification as read: ${error.message}`);
  }
};

// Mark all notifications for a recipient as read
export const markAllNotificationsAsReadService = async (recipientId) => {
  try {
    return await Notification.updateMany(
      { recipientId, isRead: false },
      { isRead: true }
    );
  } catch (error) {
    throw new Error(
      `Failed to mark all notifications as read: ${error.message}`
    );
  }
};

// Create notification for application events
export const createApplicationNotificationService = async (applicationData) => {
  try {
    // Check if a notification for this application already exists
    const existingNotification = await Notification.findOne({
      relatedId: applicationData._id,
      relatedModel: "Application",
      type: "application",
    });

    // If notification already exists, return early
    if (existingNotification) {
      return existingNotification;
    }

    const notificationData = {
      type: "application",
      relatedId: applicationData._id,
      relatedModel: "Application",
      title: "New Application Received",
      message: `${applicationData.fullName} sent an application`,
      additionalContext: applicationData,
    };

    return await createNotificationService(notificationData);
  } catch (error) {
    console.error("Error in createApplicationNotificationService:", error);
    throw new Error(
      `Failed to create application notification: ${error.message}`
    );
  }
};

// Create notification for membership events
export const createMembershipNotificationService = async (memberData, type) => {
  try {
    let title = "";
    let message = "";

    switch (type) {
      case "MEMBERSHIP_CANCELLED":
        title = "Membership Cancelled";
        message = `Your membership has been cancelled${
          memberData.cancellationReason
            ? ` due to: ${memberData.cancellationReason}`
            : " due to non-payment"
        }.`;
        break;
      case "MEMBERSHIP_EXPIRING":
        title = "Membership Expiring Soon";
        message = `Your membership will expire in ${Math.ceil((new Date(memberData.endDate) - new Date()) / (1000 * 60 * 60 * 24))} days. Please renew to continue accessing our services.`;
        break;
      case "MEMBERSHIP_EXPIRED":
        title = "Membership Expired";
        message = "Your membership has expired. Please renew to continue accessing our services.";
        break;
      default:
        title = `Membership ${type.replace("MEMBERSHIP_", "").toLowerCase()}`;
        message = `Your membership status has been updated: ${type
          .replace("MEMBERSHIP_", "")
          .toLowerCase()}`;
        break;
    }

    const notificationData = {
      type: "membership",
      relatedId: memberData._id,
      relatedModel: "Membership",
      title: title,
      message: message,
      additionalContext: memberData,
    };

    return await createNotificationService(notificationData);
  } catch (error) {
    console.error("Error in createMembershipNotificationService:", error);
    throw new Error(
      `Failed to create membership notification: ${error.message}`
    );
  }
};

// Restore the original createMemberStatusNotificationService function
export const createMemberStatusNotificationService = async (
  member,
  notificationType
) => {
  try {
    // Prevent duplicate notifications
    const existingNotification = await Notification.findOne({
      relatedId: member._id,
      relatedModel: "Member",
      type: notificationType,
    });

    if (existingNotification) {
      return existingNotification;
    }

    let title = "";
    let message = "";

    switch (notificationType) {
      case "MEMBER_START_PENDING":
        title = "Membership Start Pending";
        message = `Your membership is pending and about to start. Please complete any remaining steps.`;
        break;
      case "MEMBERSHIP_EXPIRING":
        title = "Membership Expiring Soon";
        message = `Your membership is about to expire. Please renew to continue enjoying our services.`;
        break;
      default:
        throw new Error("Invalid notification type");
    }

    const notificationData = {
      type: notificationType,
      relatedId: member._id,
      relatedModel: "Member",
      title,
      message,
      recipientId: member.userId, // Assuming member has a user reference
      additionalContext: {
        memberId: member.memberId,
        membershipType: member.membershipType,
        startDate: member.startDate,
        endDate: member.endDate,
      },
    };

    return await createNotificationService(notificationData);
  } catch (error) {
    console.error(
      `Error in createMemberStatusNotificationService: ${error.message}`
    );
    throw new Error(
      `Failed to create member status notification: ${error.message}`
    );
  }
};

// Get unread notifications count
export const getUnreadNotificationsCountService = async () => {
  try {
    return await Notification.countDocuments({ status: "unread" });
  } catch (error) {
    console.error("Error getting unread notifications count:", error);
    throw new Error(
      `Failed to get unread notifications count: ${error.message}`
    );
  }
};

// Delete all notifications for a specific user
export const deleteAllNotificationsService = async (userId) => {
  try {
    return await Notification.deleteMany({ recipientId: userId });
  } catch (error) {
    console.error("Error deleting all notifications:", error);
    throw new Error(`Failed to delete all notifications: ${error.message}`);
  }
};
