const ApplicationHistory = require("../models/ApplicationHistory.model");

// Get all application history
const getAllApplicationHistoryService = async () => {
  try {
    return await ApplicationHistory.find().sort({ createdAt: -1 });
  } catch (error) {
    console.error("Error fetching application history:", error);
    throw new Error("Failed to retrieve application history");
  }
};

// Get application history by applicationId
const getApplicationHistoryByIdService = async (applicationId) => {
  const history = await ApplicationHistory.findOne({ applicationId });
  if (!history) {
    throw new Error("Application history not found");
  }
  return history;
};

// Create application history record
const createApplicationHistoryService = async (applicationData) => {
  try {
    const historyData = {
      applicationId: applicationData.applicationId,
      fullName: applicationData.fullName,
      email: applicationData.email,
      gender: applicationData.gender,
      membershipType: applicationData.membershipType,
      membershipDuration: applicationData.membershipDuration,
      startDate: applicationData.startDate,
      endDate: applicationData.endDate,
      submittedAt: applicationData.submittedAt,
    };

    const history = new ApplicationHistory(historyData);
    await history.save();
    return history;
  } catch (error) {
    console.error("Error creating application history:", error);
    throw new Error("Failed to create application history");
  }
};

// Delete application history
const deleteApplicationHistoryService = async (applicationId) => {
  const history = await ApplicationHistory.findOneAndDelete({ applicationId });
  if (!history) {
    throw new Error("Application history not found");
  }
  return history;
};

module.exports = {
  getAllApplicationHistoryService,
  getApplicationHistoryByIdService,
  createApplicationHistoryService,
  deleteApplicationHistoryService
};
