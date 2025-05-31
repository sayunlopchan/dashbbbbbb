const Event = require("../models/Event.model");
const asyncHandler = require("../utils/asyncHandler");
const generateEventId = require("../utils/idgenerator/generateEventId");
const fs = require('fs');
const path = require('path');

// Create a new event
const createEvent = asyncHandler(async (req, res) => {
  // Ensure user is authenticated and has a username or email
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required to create an event",
    });
  }

  const { 
    title, 
    organizer,
    category,
    location, 
    startTime, 
    endTime, 
    description, 
    tags
  } = req.body;

  // Validate required fields
  if (!title || !organizer || !category || !location || !startTime || !endTime || !description) {
    return res.status(400).json({
      success: false,
      message: "Missing required event details",
    });
  }

  // Validate category
  const validCategories = ["fitness", "competition", "workshop", "social", "other"];
  if (!validCategories.includes(category)) {
    return res.status(400).json({
      success: false,
      message: "Invalid event category",
    });
  }

  // Handle uploaded files
  const images = req.files ? req.files.map(file => `/uploads/events/${file.filename}`) : [];

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
    organizer,
    category,
    location,
    startTime,
    endTime,
    description: descriptionArray,
    tags: tags || [],
    images,
    authorName,
    participantCount: 0
  });

  await event.save();

  res.status(201).json({
    success: true,
    message: "Event created successfully",
    event,
  });
});

// Get all events
const getAllEvents = asyncHandler(async (req, res) => {
  // Get all events without pagination
  const events = await Event.find({}).sort({ startTime: -1 });

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
const getEventById = asyncHandler(async (req, res) => {
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
const updateEvent = asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  const { 
    title, 
    organizer,
    category,
    location, 
    startTime, 
    endTime, 
    description, 
    tags
  } = req.body;

  const event = await Event.findOne({ eventId });

  if (!event) {
    return res.status(404).json({
      success: false,
      message: "Event not found",
    });
  }

  // Validate category if provided
  if (category) {
    const validCategories = ["fitness", "competition", "workshop", "social", "other"];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: "Invalid event category",
      });
    }
  }

  // Handle uploaded files
  if (req.files && req.files.length > 0) {
    // Delete old images
    if (event.images && event.images.length > 0) {
      event.images.forEach(imagePath => {
        const fullPath = path.join(process.cwd(), imagePath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      });
    }
    // Add new images
    event.images = req.files.map(file => `/uploads/events/${file.filename}`);
  }

  // Update fields if provided
  if (title) event.title = title;
  if (organizer) event.organizer = organizer;
  if (category) event.category = category;
  if (location) event.location = location;
  if (startTime) event.startTime = startTime;
  if (endTime) event.endTime = endTime;

  // Ensure description is an array if provided
  if (description) {
    event.description = Array.isArray(description)
      ? description
      : [description];
  }

  if (tags) event.tags = tags;

  await event.save();

  res.status(200).json({
    success: true,
    message: "Event updated successfully",
    event,
  });
});

// Delete event
const deleteEvent = asyncHandler(async (req, res) => {
  const { eventId } = req.params;

  const event = await Event.findOne({ eventId });

  if (!event) {
    return res.status(404).json({
      success: false,
      message: "Event not found",
    });
  }

  // Delete associated images
  if (event.images && event.images.length > 0) {
    event.images.forEach(imagePath => {
      const fullPath = path.join(process.cwd(), imagePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    });
  }

  await event.deleteOne();

  res.status(200).json({
    success: true,
    message: "Event deleted successfully",
  });
});

module.exports = {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
};
