const Member = require("../models/Member.model");
const dayjs = require("dayjs");
const { sendMembershipExpiryReminder } = require("../utils/emailService");
const { createPaymentService } = require("./payment.service");
const mongoose = require("mongoose");

// Create Member
const createMemberService = async (data, options = {}) => {
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
const getAllMembersService = async (query = {}) => {
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
const getMemberByMemberIdService = async (memberId) => {
  const member = await Member.findOne({ memberId });
  if (!member) throw new Error("Member not found");
  return member;
};

// Update by memberId
const updateMemberService = async (memberId, data) => {
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
const deleteMemberService = async (memberId) => {
  const deleted = await Member.findOneAndDelete({ memberId });
  if (!deleted) throw new Error("Member not found");
  return deleted;
};

// Process payment for membership
const processMemberPaymentService = async (memberId, paymentData) => {
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
      paymentId: payment._id,
    };

    // Update member's payment history
    member.payments.push(memberPaymentRecord);
    await member.save({ session });

    await session.commitTransaction();
    return payment;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

// Renew membership
const renewMembershipService = async (memberId, renewalData) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // Find the member
    const member = await Member.findOne({ memberId });
    if (!member) {
      throw new Error("Member not found");
    }

    // Set start date to current date
    const startDate = new Date();

    // Calculate new end date based on membership type
    const newEndDate = new Date(startDate);
    const membershipDurationMap = {
      silver: 1,
      gold: 3,
      diamond: 6,
      platinum: 12
    };

    const duration = membershipDurationMap[renewalData.membershipType] || 1;
    newEndDate.setMonth(newEndDate.getMonth() + duration);

    // Update member's dates and status
    member.startDate = startDate;
    member.endDate = newEndDate;
    member.membershipType = renewalData.membershipType;
    member.membershipDuration = duration;
    member.memberStatus = "active";

    // Save member updates
    await member.save({ session });
    await session.commitTransaction();

    // Create payment record in a separate transaction if payment is included
    if (renewalData.paymentAmount && renewalData.paymentMethod) {
      try {
        const paymentRecordData = {
          memberId: member.memberId,
          amount: renewalData.paymentAmount,
          paymentType: "membership",
          paymentMethod: renewalData.paymentMethod,
          description: `Renewal payment for ${renewalData.membershipType} membership`,
          paymentDate: new Date(),
          status: "completed"
        };

        // Create payment in a separate transaction
        await createPaymentService(paymentRecordData);
      } catch (paymentError) {
        console.error("Error creating payment record:", paymentError);
        // Don't throw the error since the renewal was successful
        // Just log it and continue
      }
    }

    return member;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

// Get member payment history
const getMemberPaymentHistoryService = async (memberId) => {
  const member = await Member.findOne({ memberId });
  if (!member) {
    throw new Error("Member not found");
  }
  return member.payments;
};

// Check membership status
const checkMembershipStatusService = async (memberId) => {
  const member = await Member.findOne({ memberId });
  if (!member) {
    throw new Error("Member not found");
  }

  const currentDate = new Date();
  const isActive = currentDate >= member.startDate && currentDate <= member.endDate;

  return {
    memberId: member.memberId,
    status: isActive ? "active" : "expired",
    startDate: member.startDate,
    endDate: member.endDate,
    daysRemaining: isActive
      ? Math.ceil((member.endDate - currentDate) / (1000 * 60 * 60 * 24))
      : 0,
  };
};

// Cancel membership
const cancelMembershipService = async (
  memberId,
  cancelReason = "Manual Cancellation"
) => {
  const member = await Member.findOne({ memberId });
  if (!member) {
    throw new Error("Member not found");
  }

  member.memberStatus = "cancelled";
  member.cancellationDate = new Date();
  member.cancellationReason = cancelReason;

  await member.save();
  return member;
};

// Send expiry reminder sequence
const sendExpiryReminderSequence = async (member) => {
  const daysUntilExpiry = dayjs(member.endDate).diff(dayjs(), "day");

  if (daysUntilExpiry <= 7 && daysUntilExpiry > 0) {
    await sendMembershipExpiryReminder(member, daysUntilExpiry);
  }
};

// Get Member Alerts
const getMemberAlertsService = async (filter = 'all') => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const sevenDaysFromNow = new Date(today);
  sevenDaysFromNow.setDate(today.getDate() + 7);

  console.log('Fetching member alerts with dates:', {
    today: today.toISOString(),
    sevenDaysFromNow: sevenDaysFromNow.toISOString()
  });

  // Base query to find members with end dates
  const query = {
    endDate: { $exists: true },
    memberStatus: { $nin: ['cancelled'] } // Exclude cancelled members
  };

  // Add filter conditions
  switch (filter) {
    case 'expiring':
      // Members expiring in the next 7 days
      query.endDate = {
        $gte: today,
        $lte: sevenDaysFromNow
      };
      break;
    case 'expired':
      // Members whose membership has expired
      query.endDate = { $lt: today };
      break;
    case 'all':
    default:
      // All members with end dates (both expired and expiring)
      query.endDate = { $exists: true };
      break;
  }

  console.log('Query for member alerts:', JSON.stringify(query, null, 2));

  // Get members with their membership details
  const members = await Member.find(query)
    .select('memberId fullName membershipType startDate endDate memberStatus')
    .sort({ endDate: 1 }); // Sort by end date ascending

  console.log(`Found ${members.length} members matching query`);

  // Update member statuses based on end dates
  const updatePromises = members.map(async (member) => {
    const currentDate = new Date();
    let newStatus = member.memberStatus;

    // Only update status if it's not already cancelled
    if (member.memberStatus !== 'cancelled') {
      const daysUntilExpiry = Math.ceil((member.endDate - currentDate) / (1000 * 60 * 60 * 24));
      
      console.log(`Processing member ${member.memberId}:`, {
        currentStatus: member.memberStatus,
        startDate: member.startDate.toISOString(),
        endDate: member.endDate.toISOString(),
        daysUntilExpiry,
        currentDate: currentDate.toISOString()
      });

      if (currentDate > member.endDate) {
        newStatus = 'expired';
      } else if (currentDate >= member.startDate && currentDate <= member.endDate) {
        // If within 7 days of expiry, mark as expiring
        if (daysUntilExpiry <= 7) {
          newStatus = 'expiring';
        } else {
          newStatus = 'active';
        }
      } else if (currentDate < member.startDate) {
        newStatus = 'pending';
      }

      console.log(`Status update for member ${member.memberId}:`, {
        oldStatus: member.memberStatus,
        newStatus,
        willUpdate: newStatus !== member.memberStatus
      });

      // Only update if status has changed
      if (newStatus !== member.memberStatus) {
        try {
          const updateResult = await Member.updateOne(
            { _id: member._id },
            { $set: { memberStatus: newStatus } }
          );
          console.log(`Update result for member ${member.memberId}:`, {
            matchedCount: updateResult.matchedCount,
            modifiedCount: updateResult.modifiedCount
          });
          member.memberStatus = newStatus; // Update the returned object
        } catch (error) {
          console.error(`Failed to update status for member ${member.memberId}:`, error);
        }
      }
    }

    return member;
  });

  // Wait for all status updates to complete
  await Promise.all(updatePromises);

  // Verify final statuses
  const finalMembers = await Member.find({ _id: { $in: members.map(m => m._id) } })
    .select('memberId memberStatus');
  
  console.log('Final member statuses:', 
    finalMembers.map(m => ({ memberId: m.memberId, status: m.memberStatus }))
  );

  return members;
};

// Update member statuses automatically
const updateMemberStatusesService = async () => {
  const currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  console.log('Running automatic member status update at:', currentDate.toISOString());

  try {
    // Find all members that need status update (excluding cancelled members)
    const members = await Member.find({
      memberStatus: { $nin: ['cancelled'] },
      endDate: { $exists: true }
    }).select('memberId fullName membershipType startDate endDate memberStatus');

    console.log(`Found ${members.length} members to check for status updates`);

    const updatePromises = members.map(async (member) => {
      let newStatus = member.memberStatus;
      const daysUntilExpiry = Math.ceil((member.endDate - currentDate) / (1000 * 60 * 60 * 24));

      // Determine new status based on dates
      if (currentDate > member.endDate) {
        newStatus = 'expired';
      } else if (currentDate >= member.startDate && currentDate <= member.endDate) {
        if (daysUntilExpiry <= 7) {
          newStatus = 'expiring';
        } else {
          newStatus = 'active';
        }
      } else if (currentDate < member.startDate) {
        newStatus = 'pending';
      }

      // Only update if status has changed
      if (newStatus !== member.memberStatus) {
        console.log(`Updating member ${member.memberId} status:`, {
          oldStatus: member.memberStatus,
          newStatus,
          daysUntilExpiry
        });

        try {
          await Member.updateOne(
            { _id: member._id },
            { $set: { memberStatus: newStatus } }
          );
          return { memberId: member.memberId, oldStatus: member.memberStatus, newStatus };
        } catch (error) {
          console.error(`Failed to update status for member ${member.memberId}:`, error);
          return null;
        }
      }
      return null;
    });

    const results = await Promise.all(updatePromises);
    const updates = results.filter(r => r !== null);

    console.log(`Status update complete. Updated ${updates.length} members:`, updates);
    return updates;
  } catch (error) {
    console.error('Error in updateMemberStatusesService:', error);
    throw error;
  }
};

module.exports = {
  createMemberService,
  getAllMembersService,
  getMemberByMemberIdService,
  updateMemberService,
  deleteMemberService,
  processMemberPaymentService,
  renewMembershipService,
  getMemberPaymentHistoryService,
  checkMembershipStatusService,
  cancelMembershipService,
  sendExpiryReminderSequence,
  getMemberAlertsService,
  updateMemberStatusesService
};
