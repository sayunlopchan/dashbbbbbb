import * as applicationService from "../services/application.service.js";
import asyncHandler from "../utils/asyncHandler.js";

// Get all applications
export const getAllApplications = asyncHandler(async (req, res) => {
  const result = await applicationService.getAllApplicationsService(req.query);

  res.status(200).json({
    success: true,
    data: result.applications,
    pagination: result.pagination,
  });
});

// Get a single application by ID
export const getApplicationById = asyncHandler(async (req, res) => {
  const { applicationId } = req.params;

  const application = await applicationService.getApplicationByIdService(
    applicationId
  );

  res.status(200).json({
    success: true,
    data: application,
  });
});

// Create a new application
export const createApplication = asyncHandler(async (req, res) => {
  // Remove user extraction, as we no longer need it
  const applicationData = req.body;

  const application = await applicationService.createApplicationService(
    applicationData
  );

  res.status(201).json({
    success: true,
    data: application,
  });
});

// Accept an application
export const acceptApplication = asyncHandler(async (req, res) => {
  const { applicationId } = req.params;

  const member = await applicationService.acceptApplicationService(
    applicationId
  );

  res.status(200).json({
    success: true,
    data: member,
  });
});

// Delete an application
export const deleteApplication = asyncHandler(async (req, res) => {
  const { applicationId } = req.params;

  await applicationService.deleteApplicationService(applicationId);

  res.status(200).json({
    success: true,
    message: "Application deleted successfully",
  });
});
