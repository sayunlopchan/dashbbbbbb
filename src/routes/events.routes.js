import express from "express";
import {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
} from "../controllers/event.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Event Routes
router
  .route("/")
  // Get all events
  .get(getAllEvents)

  // Create a new event
  .post(authenticate, createEvent);

router
  .route("/:eventId")
  // Get specific event
  .get(authenticate, getEventById)

  // Update event
  .put(authenticate, updateEvent)

  // Delete event
  .delete(authenticate, deleteEvent);

export default router;
