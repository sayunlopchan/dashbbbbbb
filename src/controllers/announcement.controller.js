const announcementService = require("../services/announcement.service");
const asyncHandler = require("../utils/asyncHandler");

// Get all announcements
const getAllAnnouncements = asyncHandler(async (req, res) => {
  // Get all announcements without pagination
  const announcements = await announcementService.getAllAnnouncementsService();

  res.status(200).json({
    success: true,
    ...announcements,
  });
});

// Get a single announcement by ID
const getAnnouncementById = asyncHandler(async (req, res) => {
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
const createAnnouncement = asyncHandler(async (req, res) => {
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
const updateAnnouncement = asyncHandler(async (req, res) => {
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
const deleteAnnouncement = asyncHandler(async (req, res) => {
  const { announcementId } = req.params;

  await announcementService.deleteAnnouncementService(announcementId);

  res.status(200).json({
    success: true,
    message: "Announcement deleted successfully",
  });
});

module.exports = {
  getAllAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
};
