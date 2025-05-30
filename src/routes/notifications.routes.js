const { Router } = require("express");
const {
  getAllNotifications,
  markNotificationAsRead,
  getUnreadNotificationsCount,
  deleteAllNotifications,
} = require("../controllers/notification.controller");
const { authenticate } = require("../middlewares/auth.middleware");

const router = Router();

// Get all notifications
router.get("/", authenticate, getAllNotifications);

// Get unread notifications count
router.get("/unread-count", authenticate, getUnreadNotificationsCount);

// Mark a single notification as read
router.patch("/:notificationId/read", authenticate, markNotificationAsRead);

// Delete all notifications
router.delete("/all", authenticate, deleteAllNotifications);

module.exports = router;
