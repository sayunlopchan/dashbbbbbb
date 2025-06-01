const Notification = require("../models/Notification.model");

// Create a new notification
const createNotificationService = async (notificationData) => {
  try {
    return await Notification.createNotification(notificationData);
  } catch (error) {
    throw new Error(`Failed to create notification: ${error.message}`);
  }
};

// Get all notifications with pagination and filtering
const getAllNotificationsService = async (query = {}) => {
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
const getNotificationsByRecipientService = async (
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
const markNotificationAsReadService = async (notificationId) => {
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
const markAllNotificationsAsReadService = async (recipientId) => {
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
const createApplicationNotificationService = async (applicationData) => {
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
const createMembershipNotificationService = async (memberData, type) => {
  try {
    let title = "";
    let message = "";

    switch (type) {
      case "MEMBERSHIP_CANCELLED":
        title = "Membership Cancelled";
        message = `${memberData.fullName}'s membership has been cancelled${
          memberData.cancellationReason
            ? ` due to: ${memberData.cancellationReason}`
            : " due to non-payment"
        }.`;
        break;
      case "MEMBERSHIP_EXPIRING":
        title = "Membership Expiring Soon";
        message = `${memberData.fullName}'s membership will expire in ${Math.ceil((new Date(memberData.endDate) - new Date()) / (1000 * 60 * 60 * 24))} days.`;
        break;
      case "MEMBERSHIP_EXPIRED":
        title = "Membership Expired";
        message = `${memberData.fullName}'s membership has expired.`;
        break;
      case "MEMBERSHIP_PAYMENT_PENDING":
        title = "Payment Pending";
        message = `${memberData.fullName} has not made their membership payment yet.`;
        break;
      default:
        throw new Error(`Invalid membership notification type: ${type}`);
    }

    const notificationData = {
      type: "membershipExpiry",
      relatedId: memberData._id,
      relatedModel: "Member",
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
const createMemberStatusNotificationService = async (
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
        message = `${member.fullName}'s membership is pending and about to start.`;
        break;
      case "MEMBERSHIP_EXPIRING":
        title = "Membership Expiring Soon";
        message = `${member.fullName}'s membership is about to expire.`;
        break;
      case "MEMBERSHIP_EXPIRED":
        title = "Membership Expired";
        message = `${member.fullName}'s membership has expired.`;
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
const getUnreadNotificationsCountService = async () => {
  try {
    return await Notification.countDocuments({ status: "unread" });
  } catch (error) {
    console.error("Error getting unread notifications count:", error);
    throw new Error(
      `Failed to get unread notifications count: ${error.message}`
    );
  }
};

module.exports = {
  createNotificationService,
  getAllNotificationsService,
  getNotificationsByRecipientService,
  markNotificationAsReadService,
  markAllNotificationsAsReadService,
  createApplicationNotificationService,
  createMembershipNotificationService,
  createMemberStatusNotificationService,
  getUnreadNotificationsCountService
};
