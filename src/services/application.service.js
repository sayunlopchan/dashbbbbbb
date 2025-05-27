import Application from "../models/application.model.js";
import Member from "../models/member.model.js";
import * as memberService from "./member.service.js";
import * as applicationHistoryService from "./applicationHistory.service.js";
import { generateMemberId } from "../utils/idgenerator/generateMemberId.js";
import * as notificationService from "./notification.service.js";
import mongoose from "mongoose";
import {
  sendWelcomeEmail,
  sendMembershipAcceptanceEmail,
} from "../utils/emailService.js";

// Validate input data for application creation
const validateApplicationData = async (applicationData) => {
  // Validate email uniqueness across Members and Applications
  const [existingMember, existingApplication] = await Promise.all([
    Member.findOne({ email: applicationData.email.toLowerCase() }),
    Application.findOne({ email: applicationData.email.toLowerCase() }),
  ]);

  if (existingMember) {
    throw new Error("An account with this email already exists");
  }

  if (existingApplication) {
    throw new Error("An application with this email is already in progress");
  }

  return true;
};

// Get all applications
export const getAllApplicationsService = async (query = {}) => {
  try {
    const {
      page = 1,
      limit = 0, // Set to 0 to remove limit
      status,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = query;

    const filter = {};
    if (status) filter.applicationStatus = status;

    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { applicationId: { $regex: search, $options: "i" } },
      ];
    }

    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    const applications = await Application.find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit) || 0); // Set to 0 to remove limit

    const total = await Application.countDocuments(filter);

    return {
      applications,
      pagination: {
        total,
        page: parseInt(page),
        pages: limit > 0 ? Math.ceil(total / limit) : 1,
        hasNextPage: page < (limit > 0 ? Math.ceil(total / limit) : 1),
        hasPrevPage: page > 1,
      },
    };
  } catch (error) {
    console.error("Error fetching applications:", error);
    throw new Error("Failed to retrieve applications");
  }
};

// Get application by applicationId
export const getApplicationByIdService = async (applicationId) => {
  const application = await Application.findOne({ applicationId });
  if (!application) {
    throw new Error("Application not found");
  }
  return application;
};

// Create a new application
export const createApplicationService = async (applicationData) => {
  const session = await mongoose.startSession();

  try {
    // Start transaction
    session.startTransaction();

    // Validate input data
    await validateApplicationData(applicationData);

    // Prepare application data
    const applicationWithData = {
      ...applicationData,
      email: applicationData.email.toLowerCase(),
      applicationStatus: "pending",
      // Ensure startDate is provided
      startDate: applicationData.startDate || new Date(),
      // Set membershipType based on duration if not provided
      membershipType:
        applicationData.membershipType ||
        (() => {
          switch (applicationData.membershipDuration) {
            case 1:
              return "silver";
            case 3:
              return "gold";
            case 6:
              return "diamond";
            case 12:
              return "platinum";
            default:
              return "silver";
          }
        })(),
    };

    // Create new application within transaction
    const application = new Application(applicationWithData);
    await application.save({ session });

    // Log the generated applicationId
    console.log(
      `New application created with ID: ${application.applicationId}`
    );

    // Create application history within transaction
    await applicationHistoryService.createApplicationHistoryService(
      application
    );

    // Create notification within transaction
    await notificationService.createApplicationNotificationService(
      application,
      { session }
    );

    // Send welcome email to applicant
    try {
      await sendWelcomeEmail(
        application.email,
        application.fullName || "Applicant",
        {
          applicationId: application.applicationId,
          message:
            "Your application has been successfully submitted and is under review.",
        }
      );
    } catch (emailError) {
      console.error("Failed to send application creation email:", emailError);
      // Non-critical error, don't stop the transaction
    }

    // Commit transaction
    await session.commitTransaction();

    return application;
  } catch (error) {
    // Abort transaction on error
    await session.abortTransaction();

    console.error("Error in createApplicationService:", error);
    throw new Error(`Failed to create application: ${error.message}`);
  } finally {
    // End session
    session.endSession();
  }
};

// Accept application and create a member
export const acceptApplicationService = async (applicationId) => {
  const session = await mongoose.startSession();
  let application;
  let member;

  try {
    // Start transaction
    session.startTransaction();

    // Find the application
    application = await Application.findOne({ applicationId }).session(session);
    if (!application) {
      throw new Error("Application not found");
    }

    // Check if email already exists in Member collection
    const existingMember = await Member.findOne({
      email: application.email,
    }).session(session);

    if (existingMember) {
      throw new Error("A member with this email already exists");
    }

    // Generate member ID
    const memberId = await generateMemberId();

    // Calculate end date based on start date and membership duration
    const startDate = application.startDate;
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + application.membershipDuration);

    // Prepare member data with explicit membership type
    const memberData = {
      memberId,
      fullName: application.fullName,
      email: application.email,
      contact: application.contact,
      dateOfBirth: application.dateOfBirth,
      emergencyNumber: application.emergencyNumber,
      emergencyContactName: application.emergencyContactName,
      emergencyContactRelationship: application.emergencyContactRelationship,
      gender: application.gender,
      address: application.address || "Not provided", // Set a default value if address is missing
      membershipType:
        application.membershipType ||
        (() => {
          // Fallback membership type determination
          switch (application.membershipDuration) {
            case 1:
              return "silver";
            case 3:
              return "gold";
            case 6:
              return "diamond";
            case 12:
              return "platinum";
            default:
              return "silver";
          }
        })(),
      startDate,
      endDate,
      membershipDuration: application.membershipDuration,
      // Explicitly set memberStatus to pending
      memberStatus: "pending",
    };

    // Validate required fields
    if (!memberData.address) {
      throw new Error("Address is required for member creation");
    }

    console.log(
      "Creating member with data:",
      JSON.stringify(memberData, null, 2)
    );

    // Create member within transaction
    member = await memberService.createMemberService(memberData, { session });

    // Create notification within transaction
    await notificationService.createApplicationNotificationService(
      application,
      { session }
    );

    // Delete the application after successful member creation
    await Application.deleteOne({ applicationId }).session(session);

    // Commit transaction
    await session.commitTransaction();

    // Send membership acceptance email (outside of transaction)
    try {
      await sendMembershipAcceptanceEmail(member);
    } catch (emailError) {
      console.error("Failed to send membership acceptance email:", emailError);
    }

    return member;
  } catch (error) {
    // Abort transaction on error
    await session.abortTransaction();

    // Log the full error
    console.error("Accept Application Error:", error);

    // Optionally create a rejection notification
    if (application) {
      try {
        await notificationService.createApplicationNotificationService(
          application
        );
      } catch (notificationError) {
        console.error(
          "Failed to create rejection notification:",
          notificationError
        );
      }
    }

    throw error;
  } finally {
    // End session
    session.endSession();
  }
};

// Delete an application
export const deleteApplicationService = async (applicationId) => {
  const application = await Application.findOneAndDelete({ applicationId });
  if (!application) {
    throw new Error("Application not found");
  }

  // Optionally create a notification about application deletion
  try {
    await notificationService.createApplicationNotificationService(application);
  } catch (notificationError) {
    console.error("Failed to create deletion notification:", notificationError);
  }

  return application;
};
