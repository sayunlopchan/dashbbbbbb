import * as applicationHistoryService from "../services/applicationHistory.service.js";
import asyncHandler from "../utils/asyncHandler.js";

// Get all application history
export const getAllApplicationHistory = asyncHandler(async (req, res) => {
  const history =
    await applicationHistoryService.getAllApplicationHistoryService();

  res.status(200).json({
    success: true,
    count: history.length,
    data: history,
  });
});

// Get application history by ID
export const getApplicationHistoryById = asyncHandler(async (req, res) => {
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
export const deleteApplicationHistory = asyncHandler(async (req, res) => {
  const { applicationId } = req.params;

  await applicationHistoryService.deleteApplicationHistoryService(
    applicationId
  );

  res.status(200).json({
    success: true,
    message: "Application history deleted successfully",
  });
});
