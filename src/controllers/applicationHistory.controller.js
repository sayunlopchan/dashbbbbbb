const applicationHistoryService = require("../services/applicationHistory.service");
const asyncHandler = require("../utils/asyncHandler");

// Get all application history
const getAllApplicationHistory = asyncHandler(async (req, res) => {
  const history =
    await applicationHistoryService.getAllApplicationHistoryService();

  res.status(200).json({
    success: true,
    count: history.length,
    data: history,
  });
});

// Get application history by ID
const getApplicationHistoryById = asyncHandler(async (req, res) => {
  const { applicationId } = req.params;

  const history =
    await applicationHistoryService.getApplicationHistoryByIdService(
      applicationId
    );

  res.status(200).json({
    success: true,
    data: history,
  });
});

// Delete application history
const deleteApplicationHistory = asyncHandler(async (req, res) => {
  const { applicationId } = req.params;

  await applicationHistoryService.deleteApplicationHistoryService(
    applicationId
  );

  res.status(200).json({
    success: true,
    message: "Application history deleted successfully",
  });
});

module.exports = {
  getAllApplicationHistory,
  getApplicationHistoryById,
  deleteApplicationHistory,
};
