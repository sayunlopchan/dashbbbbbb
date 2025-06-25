const Member = require("../models/Member.model");
const dayjs = require("dayjs");
const { sendMembershipExpiryReminder, sendMemberCreationEmail, sendExpiryEmail } = require("../utils/emailService");
const { createPaymentService } = require("./payment.service");
const mongoose = require("mongoose");
const Trainer = require("../models/Trainer.model");

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

    // Send welcome email
    try {
      await sendMemberCreationEmail(savedMember);
      console.log("Welcome email sent successfully to:", savedMember.email);
    } catch (emailError) {
      console.error("Failed to send welcome email:", emailError.message);
      // Don't throw the error - member creation was successful, email failure is non-critical
    }
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
  let memberStatus = "pending";
  
  // Only set to active if current date is >= start date AND payment has been made
  if (currentDate >= startDate && currentDate <= endDate) {
    // Check if member has payments (we need to get the current member data)
    const existingMember = await Member.findOne({ memberId });
    if (existingMember && existingMember.payments && existingMember.payments.length > 0) {
      memberStatus = "active";
    }
  }

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
      remark: paymentData.remark
    };

    const payment = await createPaymentService(paymentRecordData);

    // Prepare payment record for member's payment history
    const memberPaymentRecord = {
      amount: paymentData.paymentAmount,
      paymentMethod: paymentData.paymentMethod,
      paymentDate: new Date(),
      status: "completed",
      paymentId: payment._id,
      remark: paymentData.remark
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
    member.memberStatus = "pending";

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
          status: "completed",
          remark: renewalData.remark
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
  cancelReason = "Non Payment"
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
    .select('memberId fullName email membershipType startDate endDate memberStatus payments')
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
        // Send expiry email if status is changing to expired
        if (member.memberStatus !== 'expired') {
          try {
            await sendExpiryEmail(member.email, member.fullName, member);
            console.log(`📧 Sent expiry email to ${member.fullName} (${member.email})`);
          } catch (emailErr) {
            console.error(`❌ Failed to send expiry email to ${member.fullName} (${member.email}):`, emailErr);
          }
        }
      } else if (currentDate >= member.startDate && currentDate <= member.endDate) {
        // Only set to active if payment has been made
        if (member.payments && member.payments.length > 0) {
          // If within 7 days of expiry, mark as expiring
          if (daysUntilExpiry <= 7) {
            newStatus = 'expiring';
          } else {
            newStatus = 'active';
          }
        } else {
          // If no payment made, keep as pending even if start date has passed
          newStatus = 'pending';
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
    }).select('memberId fullName email membershipType startDate endDate memberStatus payments');

    console.log(`Found ${members.length} members to check for status updates`);

    const updatePromises = members.map(async (member) => {
      let newStatus = member.memberStatus;
      const daysUntilExpiry = Math.ceil((member.endDate - currentDate) / (1000 * 60 * 60 * 24));

      // Determine new status based on dates and payment status
      if (currentDate > member.endDate) {
        newStatus = 'expired';
        // Send expiry email if status is changing to expired
        if (member.memberStatus !== 'expired') {
          try {
            await sendExpiryEmail(member.email, member.fullName, member);
            console.log(`📧 Sent expiry email to ${member.fullName} (${member.email})`);
          } catch (emailErr) {
            console.error(`❌ Failed to send expiry email to ${member.fullName} (${member.email}):`, emailErr);
          }
        }
      } else if (currentDate >= member.startDate && currentDate <= member.endDate) {
        // Only set to active if payment has been made
        if (member.payments && member.payments.length > 0) {
          if (daysUntilExpiry <= 7) {
            newStatus = 'expiring';
          } else {
            newStatus = 'active';
          }
        } else {
          // If no payment made, keep as pending even if start date has passed
          newStatus = 'pending';
        }
      } else if (currentDate < member.startDate) {
        newStatus = 'pending';
      }

      // Only update if status has changed
      if (newStatus !== member.memberStatus) {
        console.log(`Updating member ${member.memberId} status:`, {
          oldStatus: member.memberStatus,
          newStatus,
          daysUntilExpiry,
          hasPayments: member.payments && member.payments.length > 0
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

// Assign locker to member
const assignLockerToMemberService = async (memberId, lockerData) => {
  try {
    console.log('assignLockerToMemberService called with:', { memberId, lockerData });
    
    const member = await Member.findOne({ memberId });
    if (!member) {
      throw new Error("Member not found");
    }

    console.log('Member found:', member.memberId, member.fullName);

    // Check if locker is already assigned to another member
    if (lockerData.lockerNumber) {
      const existingLockerAssignment = await Member.findOne({
        "lockers.lockerNumber": lockerData.lockerNumber,
        memberId: { $ne: memberId } // Exclude current member
      });

      if (existingLockerAssignment) {
        throw new Error(`Locker ${lockerData.lockerNumber} is already assigned to another member`);
      }
      // Prevent duplicate locker assignment for the same member
      if (member.lockers && member.lockers.some(l => l.lockerNumber === lockerData.lockerNumber)) {
        throw new Error(`Locker ${lockerData.lockerNumber} is already assigned to this member`);
      }
    }

    console.log('No existing locker assignment found, proceeding with assignment');

    // Add new locker assignment to the lockers array
    member.lockers = member.lockers || [];
    const newLocker = {
      lockerNumber: lockerData.lockerNumber,
      assignedDate: new Date()
    };
    member.lockers.push(newLocker);

    // Also add to lockerHistory
    member.lockerHistory = member.lockerHistory || [];
    member.lockerHistory.push({
      lockerNumber: newLocker.lockerNumber,
      assignedDate: newLocker.assignedDate,
      removedDate: null
    });

    console.log('Updated member lockers data:', member.lockers);
    console.log('Updated member lockerHistory data:', member.lockerHistory);

    await member.save();
    console.log('Member saved successfully');
    
    return member;
  } catch (error) {
    console.error("Error in assignLockerToMemberService:", error);
    throw new Error(`Failed to assign locker: ${error.message}`);
  }
};

// Remove locker assignment from member
const removeLockerFromMemberService = async (memberId) => {
  try {
    console.log('removeLockerFromMemberService called with memberId:', memberId);
    
    const member = await Member.findOne({ memberId });
    if (!member) {
      throw new Error("Member not found");
    }

    console.log('Member found:', member.memberId, 'Current lockers:', member.lockers);

    // Move all current lockers to lockerHistory with removedDate
    if (Array.isArray(member.lockers)) {
      member.lockerHistory = member.lockerHistory || [];
      const now = new Date();
      member.lockers.forEach(locker => {
        // Find the corresponding history entry and set removedDate
        const historyEntry = member.lockerHistory.find(h => h.lockerNumber === locker.lockerNumber && !h.removedDate);
        if (historyEntry) {
          historyEntry.removedDate = now;
        } else {
          // If not found, add a new history entry
          member.lockerHistory.push({
            lockerNumber: locker.lockerNumber,
            assignedDate: locker.assignedDate || now,
            removedDate: now
          });
        }
      });
    }

    // Remove all lockers
    member.lockers = [];

    await member.save();
    console.log('Locker(s) removed and history updated successfully');
    
    return member;
  } catch (error) {
    console.error("Error in removeLockerFromMemberService:", error);
    throw new Error(`Failed to remove locker: ${error.message}`);
  }
};

// Assign personal trainer to member (multiple allowed)
const assignPersonalTrainerToMemberService = async (memberId, trainerData) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // Find the member
    const member = await Member.findOne({ memberId });
    if (!member) {
      throw new Error("Member not found");
    }

    // Find the trainer and get their details
    const trainer = await Trainer.findOne({ trainerId: trainerData.trainerId });
    if (!trainer) {
      throw new Error("Trainer not found");
    }

    // Prevent duplicate assignment
    if (member.personalTrainers && member.personalTrainers.some(pt => pt.trainerId === trainerData.trainerId && !pt.removedDate)) {
      throw new Error("This trainer is already assigned to the member");
    }

    // Add to personalTrainers
    const newAssignment = {
      trainerId: trainer.trainerId,
      trainerFullName: trainer.fullName,
      assignedDate: new Date(),
      removedDate: null
    };
    member.personalTrainers = member.personalTrainers || [];
    member.personalTrainers.push(newAssignment);

    // Add to assignedPersonalTrainerHistory
    member.assignedPersonalTrainerHistory = member.assignedPersonalTrainerHistory || [];
    member.assignedPersonalTrainerHistory.push({
      trainerId: trainer.trainerId,
      trainerFullName: trainer.fullName,
      assignedDate: newAssignment.assignedDate,
      removedDate: null
    });

    // Also update trainer's assignedMembers and history
    if (!trainer.assignedMembers) trainer.assignedMembers = [];
    if (!trainer.assignedMembers.some(m => m.memberId === memberId && !m.removedDate)) {
      const memberAssignment = {
        memberId: member.memberId,
        fullName: member.fullName,
        assignedDate: newAssignment.assignedDate,
        status: "active",
        removedDate: null
      };
      trainer.assignedMembers.push(memberAssignment);
      trainer.assignedMemberHistory = trainer.assignedMemberHistory || [];
      trainer.assignedMemberHistory.push({
        memberId: member.memberId,
        fullName: member.fullName,
        assignedDate: newAssignment.assignedDate,
        removedDate: null
      });
    }

    await member.save({ session });
    await trainer.save({ session });
    await session.commitTransaction();
    return member;
  } catch (error) {
    await session.abortTransaction();
    console.error("Error in assignPersonalTrainerToMemberService:", error);
    throw new Error(`Failed to assign personal trainer: ${error.message}`);
  } finally {
    session.endSession();
  }
};

// Remove personal trainer assignment from member (by trainerId)
const removePersonalTrainerFromMemberService = async (memberId, trainerId) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // Find the member
    const member = await Member.findOne({ memberId });
    if (!member) {
      throw new Error("Member not found");
    }

    // Remove from personalTrainers (set removedDate)
    let found = false;
    if (Array.isArray(member.personalTrainers)) {
      member.personalTrainers.forEach(pt => {
        if (pt.trainerId === trainerId && !pt.removedDate) {
          pt.removedDate = new Date();
          found = true;
        }
      });
      // Remove from active personalTrainers
      member.personalTrainers = member.personalTrainers.filter(pt => !pt.removedDate);
    }

    // Update assignedPersonalTrainerHistory (set removedDate)
    if (Array.isArray(member.assignedPersonalTrainerHistory)) {
      member.assignedPersonalTrainerHistory.forEach(hist => {
        if (hist.trainerId === trainerId && !hist.removedDate) {
          hist.removedDate = new Date();
        }
      });
    }

    // Also update trainer's assignedMembers and assignedMemberHistory
    const trainer = await Trainer.findOne({ trainerId });
    if (trainer) {
      if (Array.isArray(trainer.assignedMembers)) {
        trainer.assignedMembers.forEach(m => {
          if (m.memberId === memberId && !m.removedDate) {
            m.removedDate = new Date();
          }
        });
        // Remove from active assignedMembers
        trainer.assignedMembers = trainer.assignedMembers.filter(m => !m.removedDate);
      }
      if (Array.isArray(trainer.assignedMemberHistory)) {
        trainer.assignedMemberHistory.forEach(hist => {
          if (hist.memberId === memberId && !hist.removedDate) {
            hist.removedDate = new Date();
          }
        });
      }
      await trainer.save({ session });
    }

    if (!found) {
      throw new Error("Trainer assignment not found for this member");
    }

    await member.save({ session });
    await session.commitTransaction();
    return member;
  } catch (error) {
    await session.abortTransaction();
    console.error("Error in removePersonalTrainerFromMemberService:", error);
    throw new Error(`Failed to remove personal trainer: ${error.message}`);
  } finally {
    session.endSession();
  }
};

// Get all members with locker assignments
const getMembersWithLockersService = async () => {
  try {
    console.log('getMembersWithLockersService called');
    
    // Find members with at least one locker in the lockers array
    const members = await Member.find({
      "lockers.0": { $exists: true }
    }).select("memberId fullName email lockers");

    console.log('Found members with lockers:', members.length);
    console.log('Members with lockers:', members.map(m => ({ 
      memberId: m.memberId, 
      fullName: m.fullName, 
      lockers: m.lockers 
    })));
    
    return members;
  } catch (error) {
    console.error("Error in getMembersWithLockersService:", error);
    throw new Error(`Failed to get members with lockers: ${error.message}`);
  }
};

// Get all members with personal trainer assignments
const getMembersWithPersonalTrainersService = async () => {
  try {
    const members = await Member.find({
      "personalTrainer.trainerId": { $ne: null }
    }).select("memberId fullName personalTrainer");

    return members;
  } catch (error) {
    console.error("Error in getMembersWithPersonalTrainersService:", error);
    throw new Error(`Failed to get members with personal trainers: ${error.message}`);
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
  updateMemberStatusesService,
  assignLockerToMemberService,
  removeLockerFromMemberService,
  assignPersonalTrainerToMemberService,
  removePersonalTrainerFromMemberService,
  getMembersWithLockersService,
  getMembersWithPersonalTrainersService
};
