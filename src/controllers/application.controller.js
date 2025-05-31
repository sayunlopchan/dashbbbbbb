const applicationService = require("../services/application.service");
const asyncHandler = require("../utils/asyncHandler");

// Get all applications
const getAllApplications = asyncHandler(async (req, res) => {
  const result = await applicationService.getAllApplicationsService(req.query);

  res.status(200).json({
    success: true,
    data: result.applications,
    pagination: result.pagination,
  });
});

// Get a single application by ID
const getApplicationById = asyncHandler(async (req, res) => {
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
const createApplication = asyncHandler(async (req, res) => {
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
const acceptApplication = asyncHandler(async (req, res) => {
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
const deleteApplication = asyncHandler(async (req, res) => {
  const { applicationId } = req.params;

  await applicationService.deleteApplicationService(applicationId);

  res.status(200).json({
    success: true,
    message: "Application deleted successfully",
  });
});

module.exports = {
  getAllApplications,
  getApplicationById,
  createApplication,
  acceptApplication,
  deleteApplication,
};
