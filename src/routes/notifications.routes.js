import { Router } from "express";
import {
  getAllNotifications,
  markNotificationAsRead,
  getUnreadNotificationsCount,
  deleteAllNotifications,
} from "../controllers/notification.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

// Get all notifications
router.get("/", authenticate, getAllNotifications);

// Get unread notifications count
router.get("/unread-count", authenticate, getUnreadNotificationsCount);

// Mark a single notification as read
router.patch("/:notificationId/read", authenticate, markNotificationAsRead);

// Delete all notifications
router.delete("/all", authenticate, deleteAllNotifications);

export default router;
