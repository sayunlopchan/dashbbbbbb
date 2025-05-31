const notificationService = require("../services/notification.service");

// Get all notifications
const getAllNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 0, type, status } = req.query;

    // Build query based on filters
    const query = {};
    if (type) query.type = type;
    if (status) query.status = status;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
    };

    const result = await notificationService.getAllNotificationsService(
      query,
      options
    );

    res.status(200).json({
      success: true,
      data: result.docs,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch notifications",
    });
  }
};

// Get notifications for the current user
const getUserNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 0, ...filterQuery } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
    };

    const result = await notificationService.getNotificationsByRecipientService(
      req.user._id,
      { ...filterQuery }
    );

    res.status(200).json({
      success: true,
      data: result.docs,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Error fetching user notifications:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch user notifications",
    });
  }
};

// Mark single notification as read
const markNotificationAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification =
      await notificationService.markNotificationAsReadService(notificationId);

    res.status(200).json({
      success: true,
      message: "Notification marked as read",
      data: notification,
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    const status = error.message === "Notification not found" ? 404 : 500;
    res.status(status).json({
      success: false,
      message: error.message || "Failed to mark notification as read",
    });
  }
};

// Get unread notifications count
const getUnreadNotificationsCount = async (req, res) => {
  try {
    const count =
      await notificationService.getUnreadNotificationsCountService();

    res.status(200).json({
      success: true,
      data: {
        unreadCount: count,
      },
    });
  } catch (error) {
    console.error("Error getting unread notifications count:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get unread notifications count",
    });
  }
};

// Delete all notifications for the current user
const deleteAllNotifications = async (req, res) => {
  try {
    const userId = req.user._id;

    const result = await notificationService.deleteAllNotificationsService(
      userId
    );

    res.status(200).json({
      success: true,
      message: "All notifications deleted successfully",
      data: {
        deletedCount: result.deletedCount,
      },
    });
  } catch (error) {
    console.error("Error deleting all notifications:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to delete all notifications",
    });
  }
};

module.exports = {
  getAllNotifications,
  getUserNotifications,
  markNotificationAsRead,
  getUnreadNotificationsCount,
  deleteAllNotifications,
};
