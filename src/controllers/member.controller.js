const memberService = require("../services/member.service");
const paymentService = require("../services/payment.service");
const generateMemberId = require("../utils/idgenerator/generateMemberId");
const Member = require("../models/Member.model");
const asyncHandler = require("../utils/asyncHandler");

// Create Member
const createMember = async (req, res) => {
  try {
    // If memberId is not provided (e.g., normal form submission), generate it
    const memberId = req.body.memberId || (await generateMemberId());
    const memberData = { ...req.body, memberId };

    // Validate address length
    if (memberData.address && memberData.address.length > 200) {
      return res.status(400).json({
        success: false,
        message: "Address cannot exceed 200 characters",
      });
    }

    // Validate membership type
    const validMembershipTypes = ["silver", "gold", "diamond", "platinum"];
    if (
      !memberData.membershipType ||
      !validMembershipTypes.includes(memberData.membershipType)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid or missing membership type. Must be one of: " +
          validMembershipTypes.join(", "),
      });
    }

    const member = await memberService.createMemberService(memberData);

    res.status(201).json({
      success: true,
      message: "Member created successfully",
      data: member,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to create member",
    });
  }
};

// Get All Members
const getAllMembers = async (req, res) => {
  try {
    const result = await memberService.getAllMembersService(req.query);
    res.status(200).json({
      success: true,
      count: result.totalDocs,
      data: result.docs,
      pages: result.totalPages,
      currentPage: result.page,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch members",
    });
  }
};

// Get Single Member by memberId
const getMemberById = async (req, res) => {
  try {
    const member = await memberService.getMemberByMemberIdService(
      req.params.memberId
    );
    res.status(200).json({
      success: true,
      data: member,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message || "Member not found",
    });
  }
};

// Update Member by memberId
const updateMember = async (req, res) => {
  try {
    // Validate address length if provided
    if (req.body.address && req.body.address.length > 200) {
      return res.status(400).json({
        success: false,
        message: "Address cannot exceed 200 characters",
      });
    }

    // Validate membership type if provided
    const validMembershipTypes = ["silver", "gold", "diamond", "platinum"];
    if (
      req.body.membershipType &&
      !validMembershipTypes.includes(req.body.membershipType)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid membership type. Must be one of: " +
          validMembershipTypes.join(", "),
      });
    }

    const member = await memberService.updateMemberService(
      req.params.memberId,
      req.body
    );
    res.status(200).json({
      success: true,
      message: "Member updated successfully",
      data: member,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to update member",
    });
  }
};

// Delete Member by memberId
const deleteMember = async (req, res) => {
  try {
    const member = await memberService.deleteMemberService(req.params.memberId);
    res.status(200).json({
      success: true,
      message: "Member deleted successfully",
      data: member,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to delete member",
    });
  }
};

// Process Member Payment
const processMemberPayment = async (req, res) => {
  try {
    const { memberId } = req.params;
    const paymentData = {
      paymentAmount: req.body.paymentAmount,
      paymentMethod: req.body.paymentMethod,
      membershipType: req.body.membershipType,
    };

    const payment = await memberService.processMemberPaymentService(
      memberId,
      paymentData
    );

    res.status(201).json({
      success: true,
      message: "Payment processed successfully",
      data: payment,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to process payment",
    });
  }
};

// Renew Membership
const renewMembership = async (req, res) => {
  try {
    const { memberId } = req.params;
    const renewalData = {
      ...req.body,
      memberId,
    };

    const result = await memberService.renewMembershipService(
      memberId,
      renewalData
    );

    res.status(200).json({
      success: true,
      message:
        result.paymentType === "first_payment"
          ? "First membership payment processed successfully"
          : "Membership renewed successfully",
      data: {
        member: result.member,
        renewalRecord: result.renewalRecord,
        paymentRecord: result.paymentRecord,
        paymentType: result.paymentType,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to renew membership",
    });
  }
};

// Get Payment History
const getMemberPaymentHistory = async (req, res) => {
  try {
    const { memberId } = req.params;

    const paymentHistory = await memberService.getMemberPaymentHistoryService(
      memberId
    );

    res.status(200).json({
      success: true,
      data: paymentHistory,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message || "Failed to retrieve payment history",
    });
  }
};

// Check Membership Status
const checkMembershipStatus = async (req, res) => {
  try {
    const { memberId } = req.params;

    const member = await memberService.checkMembershipStatusService(memberId);

    res.status(200).json({
      success: true,
      data: member,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message || "Failed to check membership status",
    });
  }
};

// Cancel Membership
const cancelMembership = async (req, res) => {
  try {
    const { memberId } = req.params;
    const { reason } = req.body;

    const member = await memberService.cancelMembershipService(
      memberId,
      reason || "Manual Cancellation"
    );

    // Create notification separately to avoid circular dependency
    try {
      const { createMembershipNotificationService } = await import(
        "../services/notification.service.js"
      );
      await createMembershipNotificationService(member, "MEMBERSHIP_CANCELLED");
    } catch (notificationError) {
      console.error(
        "Failed to create cancellation notification:",
        notificationError
      );
      // Non-critical error, so we don't throw it
    }

    // Send cancellation email to member
    try {
      const { sendMembershipCancellationEmail } = await import(
        "../utils/emailService.js"
      );
      await sendMembershipCancellationEmail(member);
      console.log(`✅ Cancellation email sent to member: ${member.email}`);
    } catch (emailError) {
      console.error(
        "Failed to send cancellation email:",
        emailError
      );
      // Non-critical error, so we don't throw it
    }

    res.status(200).json({
      success: true,
      message: "Membership cancelled successfully",
      data: member,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to cancel membership",
    });
  }
};

// Search Members
const searchMembers = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    const searchRegex = new RegExp(q, "i");
    const members = await Member.find({
      $or: [
        { fullName: searchRegex },
        { memberId: searchRegex },
        { email: searchRegex },
        { contact: searchRegex },
      ],
    }).select("memberId fullName email contact membershipType memberStatus");

    res.status(200).json({
      success: true,
      data: members,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to search members",
    });
  }
};

// Get Member Alerts
const getMemberAlerts = async (req, res) => {
  try {
    const { filter = 'all' } = req.query;
    const alerts = await memberService.getMemberAlertsService(filter);
    res.status(200).json({
      success: true,
      data: alerts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch member alerts"
    });
  }
};

// Assign locker to member
const assignLockerToMember = async (req, res) => {
  try {
    const { memberId } = req.params;
    const { lockerNumber, paymentAmount, paymentMethod = "cash" } = req.body;

    console.log('=== LOCKER ASSIGNMENT REQUEST ===');
    console.log('Request params:', req.params);
    console.log('Request body:', req.body);
    console.log('Parsed data:', { memberId, lockerNumber, paymentAmount, paymentMethod });

    if (!lockerNumber || !paymentAmount) {
      console.log('Validation failed: missing required fields');
      return res.status(400).json({
        success: false,
        message: "Locker number and payment amount are required"
      });
    }

    // Validate payment amount
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      console.log('Validation failed: invalid payment amount');
      return res.status(400).json({
        success: false,
        message: "Payment amount must be a positive number"
      });
    }

    console.log('Validation passed, proceeding with assignment...');

    // First assign the locker to the member
    const member = await memberService.assignLockerToMemberService(memberId, {
      lockerNumber
    });

    console.log('Locker assigned to member:', member.memberId);

    // Then create a payment record for the locker assignment
    const paymentData = {
      memberId: memberId,
      amount: amount,
      paymentType: "locker",
      paymentMethod: paymentMethod,
      description: `Locker assignment payment for locker ${lockerNumber}`,
      locker: {
        lockerNumber: lockerNumber
      }
    };

    console.log('Creating payment record:', paymentData);

    const payment = await paymentService.createPaymentService(paymentData);

    console.log('Payment created:', payment.paymentId);

    res.status(200).json({
      success: true,
      message: "Locker assigned and payment recorded successfully",
      data: {
        member: member,
        payment: payment
      }
    });
  } catch (error) {
    console.error('=== ERROR IN LOCKER ASSIGNMENT ===');
    console.error('Error details:', error);
    console.error('Error stack:', error.stack);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to assign locker"
    });
  }
};

// Remove locker from member
const removeLockerFromMember = async (req, res) => {
  try {
    const { memberId } = req.params;

    const member = await memberService.removeLockerFromMemberService(memberId);

    res.status(200).json({
      success: true,
      message: "Locker removed successfully",
      data: member
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to remove locker"
    });
  }
};

// Assign personal trainer to member
const assignPersonalTrainerToMember = async (req, res) => {
  try {
    const { memberId } = req.params;
    const { trainerId } = req.body;

    if (!trainerId) {
      return res.status(400).json({
        success: false,
        message: "Trainer ID is required"
      });
    }

    const member = await memberService.assignPersonalTrainerToMemberService(memberId, {
      trainerId
    });

    res.status(200).json({
      success: true,
      message: "Personal trainer assigned successfully",
      data: member
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to assign personal trainer"
    });
  }
};

// Remove personal trainer from member
const removePersonalTrainerFromMember = async (req, res) => {
  try {
    const { memberId } = req.params;

    const member = await memberService.removePersonalTrainerFromMemberService(memberId);

    res.status(200).json({
      success: true,
      message: "Personal trainer removed successfully",
      data: member
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to remove personal trainer"
    });
  }
};

// Get members with lockers
const getMembersWithLockers = async (req, res) => {
  try {
    const members = await memberService.getMembersWithLockersService();

    res.status(200).json({
      success: true,
      data: members
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch members with lockers"
    });
  }
};

// Get members with personal trainers
const getMembersWithPersonalTrainers = async (req, res) => {
  try {
    const members = await memberService.getMembersWithPersonalTrainersService();

    res.status(200).json({
      success: true,
      data: members
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch members with personal trainers"
    });
  }
};

module.exports = {
  createMember,
  getAllMembers,
  getMemberById,
  updateMember,
  deleteMember,
  processMemberPayment,
  renewMembership,
  getMemberPaymentHistory,
  checkMembershipStatus,
  cancelMembership,
  searchMembers,
  getMemberAlerts,
  assignLockerToMember,
  removeLockerFromMember,
  assignPersonalTrainerToMember,
  removePersonalTrainerFromMember,
  getMembersWithLockers,
  getMembersWithPersonalTrainers
};
