import express from "express";
import {
  addParticipant,
  getEventParticipants,
  removeParticipant,
  removeEventParticipants,
} from "../controllers/participant.controller.js";
import {
  validateObjectId,
  validateEventExists,
} from "../middlewares/validation.middleware.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Add participant to an event
router.post(
  "/:eventId/add",
  authenticate,
  validateObjectId("eventId"),
  validateEventExists,
  addParticipant
);

// Get event participants
router.get(
  "/:eventId",
  authenticate,
  validateObjectId("eventId"),
  validateEventExists,
  getEventParticipants
);

// Remove a specific participant from an event
router.delete(
  "/:eventId/remove/:participantId",
  authenticate,
  validateObjectId("eventId"),
  validateObjectId("participantId"),
  validateEventExists,
  removeParticipant
);

// Remove all participants from an event
router.delete(
  "/:eventId/remove-all",
  authenticate,
  validateObjectId("eventId"),
  validateEventExists,
  removeEventParticipants
);

export default router;
