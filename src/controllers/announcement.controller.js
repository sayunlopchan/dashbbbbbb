import * as announcementService from "../services/announcement.service.js";
import asyncHandler from "../utils/asyncHandler.js";

// Get all announcements
export const getAllAnnouncements = asyncHandler(async (req, res) => {
  // Get all announcements without pagination
  const announcements = await announcementService.getAllAnnouncementsService();

  res.status(200).json({
    success: true,
    ...announcements,
  });
});

// Get a single announcement by ID
export const getAnnouncementById = asyncHandler(async (req, res) => {
  const { announcementId } = req.params;

  const announcement = await announcementService.getAnnouncementByIdService(
    announcementId
  );

  res.status(200).json({
    success: true,
    data: announcement,
  });
});

// Create a new announcement
export const createAnnouncement = asyncHandler(async (req, res) => {
  const announcementData = req.body;

  const announcement = await announcementService.createAnnouncementService(
    announcementData
  );

  res.status(201).json({
    success: true,
    data: announcement,
  });
});

// Update an announcement
export const updateAnnouncement = asyncHandler(async (req, res) => {
  const { announcementId } = req.params;
  const updateData = req.body;

  const announcement = await announcementService.updateAnnouncementService(
    announcementId,
    updateData
  );

  res.status(200).json({
    success: true,
    data: announcement,
  });
});

// Delete an announcement
export const deleteAnnouncement = asyncHandler(async (req, res) => {
  const { announcementId } = req.params;

  await announcementService.deleteAnnouncementService(announcementId);

  res.status(200).json({
    success: true,
    message: "Announcement deleted successfully",
  });
});
