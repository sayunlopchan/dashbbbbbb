import Payment from "../models/Payment.model.js";
import Member from "../models/Member.model.js";
import generatePaymentId from "../utils/idgenerator/generatePaymentId.js";
import mongoose from "mongoose";

// Create a new payment
export const createPaymentService = async (paymentData) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // Find the member
    const member = await Member.findOne({ memberId: paymentData.memberId });
    if (!member) {
      throw new Error("Member not found");
    }

    // Check if payment already exists for this member with same amount and date
    // Only check for exact duplicates (same amount, date, and type within 1 minute)
    const oneMinuteAgo = new Date(Date.now() - 60000);
    const existingPayment = await Payment.findOne({
      memberId: paymentData.memberId,
      amount: paymentData.amount,
      paymentType: paymentData.paymentType,
      paymentDate: {
        $gte: oneMinuteAgo,
        $lte: new Date()
      }
    });

    if (existingPayment) {
      throw new Error("Duplicate payment detected. Please wait a moment before trying again.");
    }

    // Generate unique payment ID
    const paymentId = await generatePaymentId();

    // Check if this is the member's first payment
    const isFirstPayment = !member.payments || member.payments.length === 0;

    // Get member's full name
    const fullName = member.fullName ? `${member.fullName}` : "Unknown Member";

    // Create new payment with fullName
    const payment = new Payment({
      ...paymentData,
      paymentId,
      fullName,
      paymentDate: paymentData.paymentDate || new Date(),
      description:
        paymentData.description ||
        `${paymentData.paymentType} payment by ${fullName}`,
    });

    await payment.save({ session });

    // Prepare payment record for member's payment history
    const memberPaymentRecord = {
      amount: paymentData.amount,
      paymentMethod: paymentData.paymentMethod,
      paymentDate: payment.paymentDate,
      status: payment.status,
      type: paymentData.paymentType, // Use the actual payment type instead of first_payment/additional
      paymentId: payment.paymentId,
    };

    // Add payment to member's payment history
    member.payments.push(memberPaymentRecord);

    // Update last payment date
    member.lastPaymentDate = payment.paymentDate;

    // Update member status to active if it was pending
    if (member.memberStatus === "pending") {
      member.memberStatus = "active";
    }

    // Save the member with new payment
    await member.save({ session });

    await session.commitTransaction();

    return payment;
  } catch (error) {
    await session.abortTransaction();
    console.error("Error in createPaymentService:", error);
    throw new Error(`Failed to create payment: ${error.message}`);
  } finally {
    session.endSession();
  }
};

// Get all payments for a member
export const getMemberPaymentsService = async (memberId) => {
  try {
    const payments = await Payment.find({ memberId }).sort({ paymentDate: -1 });

    return payments;
  } catch (error) {
    console.error("Error in getMemberPaymentsService:", error);
    throw new Error(`Failed to get member payments: ${error.message}`);
  }
};

// Get revenue statistics
export const getRevenueStatsService = async () => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // Get total revenue
    const totalRevenue = await Payment.aggregate([
      { $match: { status: "completed" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    // Get this month's revenue
    const monthlyRevenue = await Payment.aggregate([
      {
        $match: {
          status: "completed",
          paymentDate: {
            $gte: startOfMonth,
            $lte: now,
          },
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    // Get total membership revenue
    const membershipRevenue = await Payment.aggregate([
      {
        $match: {
          status: "completed",
          paymentType: "membership",
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    // Get this month's membership revenue
    const monthlyMembershipRevenue = await Payment.aggregate([
      {
        $match: {
          status: "completed",
          paymentType: "membership",
          paymentDate: {
            $gte: startOfMonth,
            $lte: now,
          },
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    // Get this month's product revenue
    const monthlyProductRevenue = await Payment.aggregate([
      {
        $match: {
          status: "completed",
          paymentType: "product",
          paymentDate: {
            $gte: startOfMonth,
            $lte: now,
          },
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    // Get revenue by payment type
    const revenueByType = await Payment.aggregate([
      { $match: { status: "completed" } },
      {
        $group: {
          _id: "$paymentType",
          total: { $sum: "$amount" },
        },
      },
    ]);

    // Get monthly revenue trend (last 12 months)
    const monthlyTrend = await Payment.aggregate([
      {
        $match: {
          status: "completed",
          paymentDate: {
            $gte: new Date(now.getFullYear(), now.getMonth() - 11, 1),
            $lte: now,
          },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$paymentDate" },
            month: { $month: "$paymentDate" },
          },
          total: { $sum: "$amount" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    return {
      totalRevenue: totalRevenue[0]?.total || 0,
      monthlyRevenue: monthlyRevenue[0]?.total || 0,
      membershipRevenue: membershipRevenue[0]?.total || 0,
      monthlyMembershipRevenue: monthlyMembershipRevenue[0]?.total || 0,
      monthlyProductRevenue: monthlyProductRevenue[0]?.total || 0,
      revenueByType: revenueByType.reduce((acc, curr) => {
        acc[curr._id] = curr.total;
        return acc;
      }, {}),
      monthlyTrend: monthlyTrend.map((item) => ({
        month: `${item._id.year}-${item._id.month.toString().padStart(2, "0")}`,
        total: item.total,
      })),
    };
  } catch (error) {
    console.error("Error in getRevenueStatsService:", error);
    throw new Error(`Failed to get revenue statistics: ${error.message}`);
  }
};

// Get payment by ID
export const getPaymentByIdService = async (paymentId) => {
  try {
    const payment = await Payment.findOne({ paymentId });
    if (!payment) {
      throw new Error("Payment not found");
    }
    return payment;
  } catch (error) {
    console.error("Error in getPaymentByIdService:", error);
    throw error;
  }
};

// Update payment status
export const updatePaymentStatusService = async (paymentId, status) => {
  try {
    const payment = await Payment.findOneAndUpdate(
      { paymentId },
      { status },
      { new: true, runValidators: true }
    );

    if (!payment) {
      throw new Error("Payment not found");
    }

    return payment;
  } catch (error) {
    console.error("Error in updatePaymentStatusService:", error);
    throw new Error(`Failed to update payment status: ${error.message}`);
  }
};

// Get all payments with pagination and sorting
export const getAllPaymentsService = async ({
  page,
  limit,
  sortBy = "paymentDate",
  sortOrder = "desc",
  search,
  startDate,
  endDate,
  method,
  type,
}) => {
  try {
    const skip = (page - 1) * limit;
    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Build match conditions
    const matchConditions = {};

    // Add search condition if provided
    if (search) {
      matchConditions.$or = [
        { memberId: { $regex: search, $options: "i" } },
        { fullName: { $regex: search, $options: "i" } },
      ];
    }

    // Add date range conditions if provided
    if (startDate || endDate) {
      matchConditions.paymentDate = {};
      if (startDate) matchConditions.paymentDate.$gte = new Date(startDate);
      if (endDate) matchConditions.paymentDate.$lte = new Date(endDate);
    }

    // Add payment method filter if provided
    if (method) {
      matchConditions.paymentMethod = method;
    }

    // Add payment type filter if provided
    if (type) {
      matchConditions.paymentType = type;
    }

    // Get total count for pagination with filters
    const total = await Payment.countDocuments(matchConditions);

    // Get payments with pagination, sorting, and filters
    const payments = await Payment.find(matchConditions)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    // Get member details for each payment
    const memberIds = [...new Set(payments.map((payment) => payment.memberId))];
    const members = await Member.find({ memberId: { $in: memberIds } })
      .select("memberId firstName lastName")
      .lean();

    // Create a map of member details
    const memberMap = members.reduce((acc, member) => {
      acc[member.memberId] = member;
      return acc;
    }, {});

    // Combine payment data with member details
    const paymentsWithMembers = payments.map((payment) => ({
      ...payment,
      member: memberMap[payment.memberId] || null,
    }));

    return {
      payments: paymentsWithMembers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error("Error in getAllPaymentsService:", error);
    throw new Error(`Failed to get payments: ${error.message}`);
  }
};

// Delete payment
export const deletePaymentService = async (paymentId) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // Find the payment
    const payment = await Payment.findOne({ paymentId });
    if (!payment) {
      throw new Error("Payment not found");
    }

    // Find the member and remove the payment from their history
    const member = await Member.findOne({ memberId: payment.memberId });
    if (member) {
      // Remove the payment from member's payment history
      member.payments = member.payments.filter(
        (p) => p.paymentId !== paymentId
      );

      // Update last payment date if needed
      if (member.payments.length > 0) {
        member.lastPaymentDate =
          member.payments[member.payments.length - 1].paymentDate;
      } else {
        member.lastPaymentDate = null;
      }

      await member.save({ session });
    }

    // Delete the payment
    await Payment.deleteOne({ paymentId }, { session });

    await session.commitTransaction();
    return { success: true, message: "Payment deleted successfully" };
  } catch (error) {
    await session.abortTransaction();
    console.error("Error in deletePaymentService:", error);
    throw new Error(`Failed to delete payment: ${error.message}`);
  } finally {
    session.endSession();
  }
};
