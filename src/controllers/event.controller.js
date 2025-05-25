import Event from "../models/Event.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import generateEventId from "../utils/idgenerator/generateEventId.js";

// Create a new event
export const createEvent = asyncHandler(async (req, res) => {
  // Ensure user is authenticated and has a username or email
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required to create an event",
    });
  }

  const { title, description, startTime, endTime, location, tags, images } =
    req.body;

  // Validate required fields
  if (!title || !description || !startTime || !endTime || !location) {
    return res.status(400).json({
      success: false,
      message: "Missing required event details",
    });
  }

  // Ensure description is an array
  const descriptionArray = Array.isArray(description)
    ? description
    : [description];

  // Use username or full name as authorName
  const authorName = req.user.fullName || req.user.username || req.user.email;

  if (!authorName) {
    return res.status(400).json({
      success: false,
      message: "Unable to determine event author name",
    });
  }

  const eventId = await generateEventId();

  const event = new Event({
    eventId,
    title,
    description: descriptionArray,
    startTime,
    endTime,
    location,
    tags: tags || [],
    images: images || [],
    authorName,
  });

  await event.save();

  res.status(201).json({
    success: true,
    message: "Event created successfully",
    event,
  });
});

// Get all events
export const getAllEvents = asyncHandler(async (req, res) => {
  // Get all events without pagination
  const events = await Event.find({}).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    docs: events,
    pagination: {
      total: events.length,
      page: 1,
      limit: events.length,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false,
    },
  });
});

// Get event by EventId
export const getEventById = asyncHandler(async (req, res) => {
  const { eventId } = req.params;

  const event = await Event.findOne({ eventId });

  if (!event) {
    return res.status(404).json({
      success: false,
      message: "Event not found",
    });
  }

  res.status(200).json({
    success: true,
    event,
  });
});

// Update event
export const updateEvent = asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  const { title, description, startTime, endTime, location, tags, images } =
    req.body;

  const event = await Event.findOne({ eventId });

  if (!event) {
    return res.status(404).json({
      success: false,
      message: "Event not found",
    });
  }

  // Only allow updates to specific fields
  if (title) event.title = title;

  // Ensure description is an array if provided
  if (description) {
    event.description = Array.isArray(description)
      ? description
      : [description];
  }

  if (startTime) event.startTime = startTime;
  if (endTime) event.endTime = endTime;

  if (location) event.location = location;

  if (tags) event.tags = tags;

  if (images) event.images = images;

  await event.save();

  res.status(200).json({
    success: true,
    message: "Event updated successfully",
    event,
  });
});

// Delete event
export const deleteEvent = asyncHandler(async (req, res) => {
  const { eventId } = req.params;

  const event = await Event.findOne({ eventId });

  if (!event) {
    return res.status(404).json({
      success: false,
      message: "Event not found",
    });
  }

  // Use document method to trigger pre-delete middleware
  await event.deleteOne();

  res.status(200).json({
    success: true,
    message: "Event and associated participants deleted successfully",
  });
});
