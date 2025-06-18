const express = require("express");
const {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  getEventImage,
  checkUploadsDirectory,
  testFileUpload
} = require("../controllers/event.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const upload = require("../middlewares/upload.middleware");

const router = express.Router();

// Event Routes
router
  .route("/")
  // Get all events
  .get(getAllEvents)

  // Create a new event
  .post(authenticate, upload.array('images', 3), createEvent);

router
  .route("/:eventId")
  // Get specific event
  .get(authenticate, getEventById)

  // Update event
  .put(authenticate, upload.array('images', 3), updateEvent)

  // Delete event
  .delete(authenticate, deleteEvent);

// Get event image
router.get("/:eventId/images/:imageId", getEventImage);

// Debug route to check uploads directory
router.get("/debug/uploads", checkUploadsDirectory);

// Test file upload (no authentication)
router.post("/test-upload", upload.array('images', 3), testFileUpload);

// Test event creation without authentication
router.post("/test-create", upload.array('images', 3), createEvent);

module.exports = router;
