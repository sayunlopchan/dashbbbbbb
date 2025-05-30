const express = require("express");
const {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
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

module.exports = router;
