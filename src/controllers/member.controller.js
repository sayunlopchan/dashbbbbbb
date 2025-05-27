import * as memberService from "../services/member.service.js";
import { generateMemberId } from "../utils/idgenerator/generateMemberId.js";
import Member from "../models/member.model.js";

// Create Member
export const createMember = async (req, res) => {
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
export const getAllMembers = async (req, res) => {
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
export const getMemberById = async (req, res) => {
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
export const updateMember = async (req, res) => {
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
export const deleteMember = async (req, res) => {
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
export const processMemberPayment = async (req, res) => {
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
export const renewMembership = async (req, res) => {
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
export const getMemberPaymentHistory = async (req, res) => {
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
export const checkMembershipStatus = async (req, res) => {
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

// Update All Membership Statuses
export const updateAllMembershipStatuses = async (req, res) => {
  try {
    const expiredMembers =
      await memberService.updateAllMembershipStatusesService();

    res.status(200).json({
      success: true,
      message: "Membership statuses updated",
      data: {
        expiredMembersCount: expiredMembers.length,
        expiredMembers,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update membership statuses",
    });
  }
};

// Cancel Membership
export const cancelMembership = async (req, res) => {
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
export const searchMembers = async (req, res) => {
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
