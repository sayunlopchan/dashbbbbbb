const Event = require("../models/Event.model");
const mongoose = require("mongoose");

// Create a new event
const createEventService = async (eventData, userId) => {
  try {
    // Validate MongoDB ObjectId for author
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error("Invalid user ID");
    }

    // Validate required fields
    const { 
      title, 
      organizer,
      category,
      location, 
      startTime, 
      endTime, 
      description 
    } = eventData;

    if (!title || !organizer || !category || !location || !startTime || !endTime || !description) {
      throw new Error("Missing required event details");
    }

    // Validate category
    const validCategories = ["fitness", "competition", "workshop", "social", "other"];
    if (!validCategories.includes(category)) {
      throw new Error("Invalid event category");
    }

    // Ensure description is an array
    const descriptionArray = Array.isArray(description)
      ? description
      : [description];

    // Prepare event data
    const newEventData = {
      ...eventData,
      description: descriptionArray,
      images: eventData.images || [],
      tags: eventData.tags || [],
      author: userId,
      participantCount: 0
    };

    // Create new event
    const event = new Event(newEventData);
    await event.save();

    return event;
  } catch (error) {
    console.error("Create Event Error:", error);
    throw new Error(`Failed to create event: ${error.message}`);
  }
};

// Get all events
const getAllEventsService = async () => {
  try {
    return await Event.find()
      .populate("author", "username email")
      .sort({ startTime: -1 });
  } catch (error) {
    console.error("Get Events Error:", error);
    throw new Error("Failed to retrieve events");
  }
};

// Get event by ID
const getEventByIdService = async (eventId) => {
  try {
    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      throw new Error("Invalid event ID");
    }

    const event = await Event.findById(eventId).populate(
      "author",
      "username email"
    );

    if (!event) {
      throw new Error("Event not found");
    }

    return event;
  } catch (error) {
    console.error("Get Event Error:", error);
    throw error;
  }
};

// Update event
const updateEventService = async (eventId, eventData, userId) => {
  try {
    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      throw new Error("Invalid event ID");
    }

    // Validate category if provided
    if (eventData.category) {
      const validCategories = ["fitness", "competition", "workshop", "social", "other"];
      if (!validCategories.includes(eventData.category)) {
        throw new Error("Invalid event category");
      }
    }

    // Prepare update data
    const updateData = { ...eventData };

    // Ensure description is an array if provided
    if (updateData.description) {
      updateData.description = Array.isArray(updateData.description)
        ? updateData.description
        : [updateData.description];
    }

    // Find and update event
    const event = await Event.findOneAndUpdate(
      { _id: eventId, author: userId },
      updateData,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!event) {
      throw new Error("Event not found or you are not authorized to update");
    }

    return event;
  } catch (error) {
    console.error("Update Event Error:", error);
    throw new Error(`Failed to update event: ${error.message}`);
  }
};

// Delete event
const deleteEventService = async (eventId, userId) => {
  try {
    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      throw new Error("Invalid event ID");
    }

    // Find and delete event
    const event = await Event.findOneAndDelete({
      _id: eventId,
      author: userId,
    });

    if (!event) {
      throw new Error("Event not found or you are not authorized to delete");
    }

    return event;
  } catch (error) {
    console.error("Delete Event Error:", error);
    throw new Error(`Failed to delete event: ${error.message}`);
  }
};

module.exports = {
  createEventService,
  getAllEventsService,
  getEventByIdService,
  updateEventService,
  deleteEventService
};
