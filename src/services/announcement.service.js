import Announcement from "../models/announcement.model.js";
import generateAnnouncementId from "../utils/idgenerator/generateAnnouncementId.js";
import mongoose from "mongoose";

// Get all announcements
export const getAllAnnouncementsService = async () => {
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
export const getAnnouncementByIdService = async (announcementId) => {
  const announcement = await Announcement.findOne({ announcementId });
  if (!announcement) {
    throw new Error("Announcement not found");
  }
  return announcement;
};

// Create a new announcement
export const createAnnouncementService = async (announcementData) => {
  const session = await mongoose.startSession();

  try {
    // Start transaction
    session.startTransaction();

    // Generate unique announcement ID
    const announcementId = await generateAnnouncementId();

    // Create new announcement
    const announcement = new Announcement({
      ...announcementData,
      announcementId,
      postDate: announcementData.postDate || new Date(),
    });

    await announcement.save({ session });

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
export const updateAnnouncementService = async (announcementId, updateData) => {
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
export const deleteAnnouncementService = async (announcementId) => {
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
