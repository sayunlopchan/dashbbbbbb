import Member from "../models/Member.model.js";
import dayjs from "dayjs";
import { sendMembershipExpiryReminder } from "../utils/emailService.js";
import { createPaymentService } from "./payment.service.js";
import mongoose from "mongoose";

// Create Member
export const createMemberService = async (data, options = {}) => {
  console.log("Creating member with data:", JSON.stringify(data, null, 2));

  const existing = await Member.findOne({ email: data.email });
  if (existing) throw new Error("Member with this email already exists");

  // Ensure required fields are provided
  if (!data.startDate || !data.membershipType) {
    throw new Error("Start date and membership type are required");
  }

  // Calculate end date based on start date and membership type
  const startDate = new Date(data.startDate);
  const endDate = new Date(startDate);

  // Determine membership duration based on membership type
  const membershipDurationMap = {
    silver: 1,
    gold: 3,
    diamond: 6,
    platinum: 12,
  };

  const membershipDuration =
    data.membershipDuration || membershipDurationMap[data.membershipType] || 1; // Default to 1 month if not found
  endDate.setMonth(endDate.getMonth() + membershipDuration);

  // Set status to pending regardless of date
  const memberStatus = "pending";

  const memberData = {
    ...data,
    startDate,
    endDate,
    memberStatus,
    membershipDuration,
    // Explicitly set empty payments array if not provided
    payments: data.payments || [],
    // Ensure address is trimmed if provided
    address: data.address ? data.address.trim() : undefined,
  };

  console.log("Member Data Received:", {
    ...memberData,
    dateOfBirth: memberData.dateOfBirth
      ? new Date(memberData.dateOfBirth)
      : "No date provided",
    address: memberData.address || "No address provided",
  });

  const member = new Member(memberData);

  // Use session if provided (for transactions)
  let savedMember;
  try {
    if (options.session) {
      savedMember = await member.save(options);
    } else {
      savedMember = await member.save();
    }

    console.log("Member saved successfully:", savedMember);
  } catch (saveError) {
    console.error("Error saving member:", saveError);
    throw saveError;
  }

  return savedMember;
};

// Get All Members with pagination/filtering
export const getAllMembersService = async (query = {}) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 0; // Changed from 10 to 0 to fetch all by default
  const skip = (page - 1) * (limit || 1); // Handle case when limit is 0
  const sort = { createdAt: -1 };

  // Prepare filter conditions
  const filter = {};

  // Gender filter
  if (query.gender && ["male", "female", "other"].includes(query.gender)) {
    filter.gender = query.gender;
  }

  // Membership type filter
  if (
    query.membershipType &&
    ["silver", "gold", "diamond", "platinum"].includes(query.membershipType)
  ) {
    filter.membershipType = query.membershipType;
  }

  // Search filter (case-insensitive search across multiple fields)
  if (query.search) {
    const searchRegex = new RegExp(query.search, "i");
    filter.$or = [
      { fullName: searchRegex },
      { email: searchRegex },
      { memberId: searchRegex },
      { contact: searchRegex },
    ];
  }

  // Get total count
  const total = await Member.countDocuments(filter);
  const totalPages = limit ? Math.ceil(total / limit) : 1; // Handle case when limit is 0

  // Get paginated results
  const docs = await Member.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(limit || 0); // Use 0 to fetch all when no limit specified

  return {
    docs,
    pagination: {
      total,
      page,
      limit: limit || total, // Return total as limit when no limit specified
      totalPages,
      hasNextPage: limit ? page < totalPages : false, // No next page when fetching all
      hasPrevPage: page > 1,
    },
  };
};

// Get by memberId
export const getMemberByMemberIdService = async (memberId) => {
  const member = await Member.findOne({ memberId });
  if (!member) throw new Error("Member not found");
  return member;
};

// Update by memberId
export const updateMemberService = async (memberId, data) => {
  // Find existing member to get current details
  const existingMember = await Member.findOne({ memberId });
  if (!existingMember) throw new Error("Member not found");

  // Calculate new dates if membershipType or startDate is updated
  let startDate = data.startDate || existingMember.startDate;
  let endDate = data.endDate;
  let membershipType = data.membershipType || existingMember.membershipType;
  let membershipDuration =
    data.membershipDuration || existingMember.membershipDuration;

  // Membership duration mapping
  const membershipDurationMap = {
    silver: 1,
    gold: 3,
    diamond: 6,
    platinum: 12,
  };

  // If membershipType is provided or startDate is updated, recalculate end date
  if (data.membershipType || data.startDate || data.membershipDuration) {
    startDate = new Date(startDate);
    endDate = new Date(startDate);

    // Determine membership duration
    membershipDuration =
      membershipDuration || membershipDurationMap[membershipType] || 1;

    endDate.setMonth(endDate.getMonth() + membershipDuration);
  }

  // Recalculate status
  const currentDate = new Date();
  const memberStatus =
    currentDate >= startDate && currentDate <= endDate ? "active" : "pending";

  // Prepare update data
  const updateData = {
    ...data,
    startDate,
    endDate,
    memberStatus,
    membershipDuration,
    // Trim address if provided
    address: data.address ? data.address.trim() : undefined,
  };

  // Remove undefined values
  Object.keys(updateData).forEach(
    (key) => updateData[key] === undefined && delete updateData[key]
  );

  const updated = await Member.findOneAndUpdate({ memberId }, updateData, {
    new: true,
    runValidators: true,
  });

  if (!updated) throw new Error("Member not found");
  return updated;
};

// Delete by memberId
export const deleteMemberService = async (memberId) => {
  const deleted = await Member.findOneAndDelete({ memberId });
  if (!deleted) throw new Error("Member not found");
  return deleted;
};

// Process payment for membership
export const processMemberPaymentService = async (memberId, paymentData) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // Find the member
    const member = await Member.findOne({ memberId });
    if (!member) {
      throw new Error("Member not found");
    }

    // Validate payment data
    if (!paymentData.paymentAmount) {
      throw new Error("Payment amount is required");
    }

    // Determine if this is the first payment
    const isFirstPayment = member.payments.length === 0;
    const paymentType = isFirstPayment ? "first_payment" : "additional";

    // Create payment record in Payment model
    const paymentRecordData = {
      memberId: member.memberId,
      amount: paymentData.paymentAmount,
      paymentType: "membership",
      paymentMethod: paymentData.paymentMethod,
      description: `${paymentType} payment for ${member.membershipType} membership`,
      paymentDate: new Date(),
      status: "completed",
    };

    const payment = await createPaymentService(paymentRecordData);

    // Prepare payment record for member's payment history
    const memberPaymentRecord = {
      amount: paymentData.paymentAmount,
      paymentMethod: paymentData.paymentMethod,
      paymentDate: new Date(),
      status: "completed",
      type: paymentType,
      paymentId: payment.paymentId, // Store the payment ID reference
    };

    // Add payment to member's payment history
    member.payments.push(memberPaymentRecord);

    // Update last payment date
    member.lastPaymentDate = new Date();

    // If membership type is provided and different from current, update it
    if (
      paymentData.membershipType &&
      paymentData.membershipType !== member.membershipType
    ) {
      member.membershipType = paymentData.membershipType;

      // Update membership duration based on type
      const membershipDurationMap = {
        silver: 1,
        gold: 3,
        diamond: 6,
        platinum: 12,
      };
      member.membershipDuration =
        membershipDurationMap[paymentData.membershipType];

      // Recalculate end date
      const newEndDate = new Date(member.startDate);
      newEndDate.setMonth(newEndDate.getMonth() + member.membershipDuration);
      member.endDate = newEndDate;
    }

    // Activate membership if it was pending or cancelled
    if (["pending", "cancelled"].includes(member.memberStatus)) {
      member.memberStatus = "active";

      // Clear cancellation details if they exist
      member.cancellationReason = null;
      member.cancellationDate = null;
    }

    // Save the member with new payment
    await member.save({ session });

    await session.commitTransaction();

    return {
      payment: memberPaymentRecord,
      paymentRecord: payment,
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

// Renew membership
export const renewMembershipService = async (memberId, renewalData) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // Find the member
    const member = await Member.findOne({ memberId });
    if (!member) {
      throw new Error("Member not found");
    }

    // Validate renewal data
    if (!renewalData.membershipType) {
      throw new Error("Membership type is required");
    }

    // Determine membership duration based on type
    const membershipDurationMap = {
      silver: 1,
      gold: 3,
      diamond: 6,
      platinum: 12,
    };
    const membershipDuration =
      membershipDurationMap[renewalData.membershipType];

    // Capture previous membership details
    const previousMembershipDetails = {
      membershipType: member.membershipType,
      startDate: member.startDate,
      endDate: member.endDate,
      memberStatus: member.memberStatus,
    };

    // Calculate new end date
    const currentEndDate = member.endDate;
    const newEndDate = new Date(currentEndDate);
    newEndDate.setMonth(newEndDate.getMonth() + membershipDuration);

    // Prepare renewal record with both previous and new details
    const renewalRecord = {
      previousMembership: previousMembershipDetails,
      newMembership: {
        membershipType: renewalData.membershipType,
        startDate: currentEndDate, // New start date is the previous end date
        endDate: newEndDate,
        status: "active",
      },
      renewalDate: new Date(),
    };

    // Create payment record in Payment model
    const paymentData = {
      memberId: member.memberId,
      amount: renewalData.paymentAmount,
      paymentType: "membership",
      paymentMethod: renewalData.paymentMethod,
      description: `Renewal payment for ${
        renewalData.membershipType
      } membership (${membershipDuration} month${
        membershipDuration > 1 ? "s" : ""
      })`,
      paymentDate: new Date(),
      status: "completed",
    };

    const payment = await createPaymentService(paymentData);

    // Add payment record to member's payment history
    const paymentRecord = {
      amount: renewalData.paymentAmount,
      paymentMethod: renewalData.paymentMethod || "cash",
      paymentDate: new Date(),
      status: "completed",
      type: "renewal",
      paymentId: payment.paymentId, // Store the payment ID reference
    };

    // Update member details
    member.endDate = newEndDate;
    member.membershipType = renewalData.membershipType;
    member.memberStatus = "active";
    member.nextRenewalDate = newEndDate;

    // Add payment to payment history
    member.payments.push(paymentRecord);

    // Add to renewal history
    member.renewalHistory.push(renewalRecord);

    // Update last payment date
    member.lastPaymentDate = new Date();

    // Save updated member
    await member.save({ session });

    await session.commitTransaction();

    return {
      member,
      renewalRecord,
      paymentRecord,
      paymentType: "renewal",
      payment,
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

// Get membership payment history
export const getMemberPaymentHistoryService = async (memberId) => {
  const member = await Member.findOne({ memberId }).select(
    "payments renewalHistory"
  );
  if (!member) {
    throw new Error("Member not found");
  }

  return {
    payments: member.payments,
    renewalHistory: member.renewalHistory,
  };
};

// Check and update membership status
export const checkMembershipStatusService = async (memberId) => {
  const member = await Member.findOne({ memberId });
  if (!member) {
    throw new Error("Member not found");
  }

  const currentDate = new Date();

  // Check if membership has expired
  if (currentDate > member.endDate) {
    member.memberStatus = "inactive";
    await member.save();
  }

  return member;
};

// Periodic status check method (can be used in a cron job)
export const updateAllMembershipStatusesService = async () => {
  const currentDate = new Date();

  // Find all active or pending members
  const members = await Member.find({
    memberStatus: { $in: ["active", "pending"] },
  });

  for (const member of members) {
    if (currentDate > member.endDate) {
      member.memberStatus = "inactive";
      await member.save();
    }
  }

  return members.filter((member) => member.memberStatus === "inactive");
};

// Cancel Member Membership
export const cancelMembershipService = async (
  memberId,
  cancelReason = "Manual Cancellation"
) => {
  try {
    // Find the member
    const member = await Member.findOne({ memberId });

    if (!member) {
      throw new Error("Member not found");
    }

    // Check if membership can be cancelled
    if (member.memberStatus === "cancelled") {
      throw new Error("Membership is already cancelled");
    }

    // Update member status and add cancellation details
    member.memberStatus = "cancelled";
    member.cancellationReason = cancelReason;
    member.cancellationDate = new Date();

    // Save the updated member
    await member.save();

    return member;
  } catch (error) {
    console.error(`Error in cancelMembershipService: ${error.message}`);
    throw error;
  }
};

// Utility function to track and send expiry reminder emails
export const sendExpiryReminderSequence = async (member) => {
  try {
    // Increment expiry reminder count
    member.expiryReminderCount = (member.expiryReminderCount || 0) + 1;

    // Calculate days until expiry
    const daysUntilExpiry = dayjs(member.membershipExpiry).diff(dayjs(), "day");

    // Send reminder email
    await sendMembershipExpiryReminder({
      email: member.email,
      fullName: member.fullName,
      memberId: member.memberId,
      membershipType: member.membershipType,
      expiryDate: dayjs(member.membershipExpiry).format("YYYY-MM-DD"),
      reminderCount: member.expiryReminderCount,
      daysUntilExpiry: daysUntilExpiry,
    });

    // Save updated member with reminder count
    await member.save();

    console.log(
      `📧 Expiry Reminder #${member.expiryReminderCount} sent to ${member.fullName} (${daysUntilExpiry} days remaining)`
    );
    return member.expiryReminderCount;
  } catch (error) {
    console.error(
      `❌ Failed to send expiry reminder to ${member.fullName}:`,
      error
    );
    throw error;
  }
};
