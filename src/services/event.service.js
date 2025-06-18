const Event = require("../models/Event.model");
const Member = require("../models/Member.model");
const mongoose = require("mongoose");
const { sendEventNotificationToAllMembers } = require("../utils/emailService");

// Create a new event
const createEventService = async (eventData, userId) => {
  try {
    // Validate MongoDB ObjectId for author only if userId is provided
    if (userId && !mongoose.Types.ObjectId.isValid(userId)) {
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

    // Check for duplicate events (same title, organizer, and start time within 5 minutes)
    const startTimeDate = new Date(startTime);
    const fiveMinutesBefore = new Date(startTimeDate.getTime() - 5 * 60 * 1000);
    const fiveMinutesAfter = new Date(startTimeDate.getTime() + 5 * 60 * 1000);

    const existingEvent = await Event.findOne({
      title: title.trim(),
      organizer: organizer.trim(),
      startTime: {
        $gte: fiveMinutesBefore,
        $lte: fiveMinutesAfter
      }
    });

    if (existingEvent) {
      throw new Error(`An event with the same title "${title}" by "${organizer}" at this time already exists. Please check for duplicates.`);
    }

    // Ensure description is an array
    const descriptionArray = Array.isArray(description)
      ? description
      : [description];

    // Prepare event data
    const newEventData = {
      ...eventData,
      description: descriptionArray,
      images: eventData.images || [], // This will now contain file paths
      tags: eventData.tags || [],
      participantCount: 0
    };

    console.log('📝 Creating event with data:', {
      title: newEventData.title,
      organizer: newEventData.organizer,
      category: newEventData.category,
      location: newEventData.location,
      startTime: newEventData.startTime,
      endTime: newEventData.endTime,
      description: newEventData.description,
      tags: newEventData.tags,
      images: newEventData.images?.length || 0
    });

    // Create new event
    const event = new Event(newEventData);
    await event.save();

    console.log('✅ Event created successfully:', {
      eventId: event.eventId,
      title: event.title,
      _id: event._id
    });

    // Send event notification to all active members
    try {
      // Fetch all active members
      const activeMembers = await Member.find({ 
        memberStatus: { $in: ['active', 'expiring'] } // Include both active and expiring members
      }).select('fullName email memberStatus');

      console.log(`🔍 Found ${activeMembers.length} active/expiring members`);

      if (activeMembers.length > 0) {
        console.log(`📧 Sending event notification to ${activeMembers.length} active members`);
        console.log('📧 Members to notify:', activeMembers.map(m => `${m.fullName} (${m.email})`));
        
        const emailResults = await sendEventNotificationToAllMembers(event, activeMembers);
        
        console.log(`📊 Event notification email results:`, {
          total: emailResults.total,
          successful: emailResults.successful,
          failed: emailResults.failed
        });
        
        if (emailResults.failed > 0) {
          console.warn(`⚠️ ${emailResults.failed} event notification emails failed to send`);
          console.warn('❌ Failed emails:', emailResults.errors);
        }
      } else {
        console.log('📧 No active members found to send event notifications to');
      }
    } catch (emailError) {
      console.error('❌ Error sending event notification emails:', emailError.message);
      console.error('❌ Email error stack:', emailError.stack);
      // Don't throw the error - event creation was successful, email failure is non-critical
    }

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
