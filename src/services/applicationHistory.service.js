import ApplicationHistory from "../models/ApplicationHistory.model.js";

// Get all application history
export const getAllApplicationHistoryService = async () => {
  try {
    return await ApplicationHistory.find().sort({ createdAt: -1 });
  } catch (error) {
    console.error("Error fetching application history:", error);
    throw new Error("Failed to retrieve application history");
  }
};

// Get application history by applicationId
export const getApplicationHistoryByIdService = async (applicationId) => {
  const history = await ApplicationHistory.findOne({ applicationId });
  if (!history) {
    throw new Error("Application history not found");
  }
  return history;
};

// Create application history record
export const createApplicationHistoryService = async (applicationData) => {
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
export const deleteApplicationHistoryService = async (applicationId) => {
  const history = await ApplicationHistory.findOneAndDelete({ applicationId });
  if (!history) {
    throw new Error("Application history not found");
  }
  return history;
};
