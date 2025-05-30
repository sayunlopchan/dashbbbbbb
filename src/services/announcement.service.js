const Announcement = require("../models/announcement.model");
const generateAnnouncementId = require("../utils/idgenerator/generateAnnouncementId");
const mongoose = require("mongoose");

// Get all announcements
const getAllAnnouncementsService = async () => {
  // Get all announcements without pagination
  const docs = await Announcement.find({}).sort({ createdAt: -1 });

  return {
    docs,
    pagination: {
      total: docs.length,
      page: 1,
      limit: docs.length,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false,
    },
  };
};

// Get announcement by announcementId
const getAnnouncementByIdService = async (announcementId) => {
  const announcement = await Announcement.findOne({ announcementId });
  if (!announcement) {
    throw new Error("Announcement not found");
  }
  return announcement;
};

// Create a new announcement
const createAnnouncementService = async (announcementData) => {
  const session = await mongoose.startSession();

  try {
    // Start transaction
    session.startTransaction();

    // Get the last announcement to determine the next ID
    const lastAnnouncement = await Announcement.findOne({}, {}, { sort: { 'announcementId': -1 } });
    
    let announcementId;
    if (lastAnnouncement) {
      // Extract the number from the last announcement ID
      const lastNumber = parseInt(lastAnnouncement.announcementId.replace('KB-ANN', ''));
      const nextNumber = lastNumber + 1;
      announcementId = `KB-ANN${nextNumber.toString().padStart(2, '0')}`;
    } else {
      // If no announcements exist, start with KB-ANN01
      announcementId = 'KB-ANN01';
    }

    // Create new announcement
    const announcement = new Announcement({
      ...announcementData,
      announcementId,
      postDate: announcementData.postDate || new Date(),
    });

    await announcement.save({ session });

    // Update the counter to match the last used number
    if (lastAnnouncement) {
      const lastNumber = parseInt(lastAnnouncement.announcementId.replace('KB-ANN', ''));
      await mongoose.model('Counter').findOneAndUpdate(
        { name: 'announcement_counter' },
        { sequence_value: lastNumber },
        { upsert: true }
      );
    }

    // Commit transaction
    await session.commitTransaction();

    return announcement;
  } catch (error) {
    // Abort transaction on error
    await session.abortTransaction();

    console.error("Error in createAnnouncementService:", error);
    throw new Error(`Failed to create announcement: ${error.message}`);
  } finally {
    // End session
    session.endSession();
  }
};

// Update an announcement
const updateAnnouncementService = async (announcementId, updateData) => {
  try {
    const announcement = await Announcement.findOneAndUpdate(
      { announcementId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!announcement) {
      throw new Error("Announcement not found");
    }

    return announcement;
  } catch (error) {
    console.error("Error in updateAnnouncementService:", error);
    throw new Error(`Failed to update announcement: ${error.message}`);
  }
};

// Delete an announcement
const deleteAnnouncementService = async (announcementId) => {
  try {
    const announcement = await Announcement.findOneAndDelete({
      announcementId,
    });

    if (!announcement) {
      throw new Error("Announcement not found");
    }

    return announcement;
  } catch (error) {
    console.error("Error in deleteAnnouncementService:", error);
    throw new Error(`Failed to delete announcement: ${error.message}`);
  }
};

module.exports = {
  getAllAnnouncementsService,
  getAnnouncementByIdService,
  createAnnouncementService,
  updateAnnouncementService,
  deleteAnnouncementService
};
