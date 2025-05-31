const Participant = require("../models/Participant.model");
const Event = require("../models/Event.model");

const addParticipantService = async (eventId, participantInfo) => {
  // Check if event exists
  const event = await Event.findOne({ eventId });

  if (!event) {
    throw new Error("Event not found");
  }

  // Check if participant with this email already exists for the event
  const existingParticipant = await Participant.findOne({
    event: eventId,
    "participantInfo.email": participantInfo.email,
  });

  if (existingParticipant) {
    throw new Error("Participant already registered for this event");
  }

  // Create new participant
  const participant = new Participant({
    event: eventId,
    participantInfo,
  });

  // Save participant and update event participant count
  await participant.save();

  // Increment participant count
  event.participantCount += 1;
  await event.save();

  return participant;
};

const getEventParticipantsService = async (eventId, options = {}) => {
  const page = parseInt(options.page) || 1;
  const limit = parseInt(options.limit) || 10;
  const skip = (page - 1) * limit;
  const sort = { createdAt: -1 };

  // Get total count
  const total = await Participant.countDocuments({ event: eventId });
  const totalPages = Math.ceil(total / limit);

  // Get paginated results
  const docs = await Participant.find({ event: eventId })
    .sort(sort)
    .skip(skip)
    .limit(limit);

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

const removeParticipantService = async (eventId, participantId) => {
  // Check if event exists
  const event = await Event.findOne({ eventId });

  if (!event) {
    throw new Error("Event not found");
  }

  // Find and remove participant
  const participant = await Participant.findOneAndDelete({
    _id: participantId,
    event: eventId,
  });

  if (!participant) {
    throw new Error("Participant not found");
  }

  // Decrement participant count
  event.participantCount -= 1;
  await event.save();

  return participant;
};

const removeEventParticipantsService = async (eventId) => {
  // Remove all participants for a specific event
  const result = await Participant.deleteMany({ event: eventId });

  return result;
};

module.exports = {
  addParticipantService,
  getEventParticipantsService,
  removeParticipantService,
  removeEventParticipantsService
};
