import {
  addParticipantService,
  getEventParticipantsService,
  removeParticipantService,
  removeEventParticipantsService,
} from "../services/participant.service.js";
import asyncHandler from "../utils/asyncHandler.js";

export const addParticipant = asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  const { fullName, email, contact } = req.body;

  const participant = await addParticipantService(eventId, {
    fullName,
    email,
    contact,
  });

  res.status(201).json({
    success: true,
    message: "Participant added successfully",
    participant,
  });
});

export const getEventParticipants = asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const participants = await getEventParticipantsService(
    eventId,
    parseInt(page),
    parseInt(limit)
  );

  res.status(200).json({
    success: true,
    ...participants,
  });
});

export const removeParticipant = asyncHandler(async (req, res) => {
  const { eventId, participantId } = req.params;

  const participant = await removeParticipantService(eventId, participantId);

  res.status(200).json({
    success: true,
    message: "Participant removed successfully",
    participant,
  });
});

export const removeEventParticipants = asyncHandler(async (req, res) => {
  const { eventId } = req.params;

  const result = await removeEventParticipantsService(eventId);

  res.status(200).json({
    success: true,
    message: "All participants removed successfully",
    deletedCount: result.deletedCount,
  });
});
