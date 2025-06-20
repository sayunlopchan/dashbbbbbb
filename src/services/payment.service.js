const Payment = require("../models/Payment.model");
const Member = require("../models/Member.model");
const Product = require("../models/product.model");
const generatePaymentId = require("../utils/idgenerator/generatePaymentId");
const mongoose = require("mongoose");

// Create a new payment
const createPaymentService = async (paymentData) => {
  const session = await mongoose.startSession();

  try {
    console.log('createPaymentService called with:', paymentData);
    
    session.startTransaction();

    // Find the member
    const member = await Member.findOne({ memberId: paymentData.memberId });
    if (!member) {
      throw new Error("Member not found");
    }

    console.log('Member found for payment:', member.memberId, member.fullName);

    // If this is a product payment, validate and update stock
    if (paymentData.paymentType === "product") {
      if (!paymentData.productId || !paymentData.quantity) {
        throw new Error("Product ID and quantity are required for product payments");
      }

      // Find the product and check stock
      const product = await Product.findOne({ productId: paymentData.productId });
      if (!product) {
        throw new Error("Product not found");
      }

      if (product.stock < paymentData.quantity) {
        throw new Error(`Insufficient stock. Only ${product.stock} items available.`);
      }

      // Update product stock
      product.stock -= paymentData.quantity;
      await product.save({ session });

      // Update payment description to include product details
      paymentData.description = paymentData.description || 
        `Purchase of ${paymentData.quantity} ${product.name} (${product.productId}) by ${member.fullName}`;

      // Validate that the payment amount matches the product price * quantity
      const expectedAmount = product.price * paymentData.quantity;
      if (paymentData.amount !== expectedAmount) {
        throw new Error(`Invalid payment amount. Expected ${expectedAmount} for ${paymentData.quantity} items at ${product.price} each.`);
      }
    }

    // Check if payment already exists for this member with same amount and date
    const oneMinuteAgo = new Date(Date.now() - 60000);
    let duplicateQuery = {
      memberId: paymentData.memberId,
      amount: paymentData.amount,
      paymentType: paymentData.paymentType,
      paymentDate: {
        $gte: oneMinuteAgo,
        $lte: new Date()
      }
    };
    // For locker payments, also check locker number
    if (paymentData.paymentType === "locker" && paymentData.locker && paymentData.locker.lockerNumber) {
      duplicateQuery["locker.lockerNumber"] = paymentData.locker.lockerNumber;
    }
    const existingPayment = await Payment.findOne(duplicateQuery);
    if (existingPayment) {
      throw new Error("Duplicate payment detected. Please wait a moment before trying again.");
    }

    // Generate unique payment ID
    const paymentId = await generatePaymentId();
    console.log('Generated payment ID:', paymentId);

    // Get member's full name
    const fullName = member.fullName ? `${member.fullName}` : "Unknown Member";

    // Create new payment with fullName
    const payment = new Payment({
      ...paymentData,
      paymentId,
      fullName,
      paymentDate: paymentData.paymentDate || new Date(),
      description: paymentData.description || 
        `${paymentData.paymentType} payment by ${fullName}`,
    });

    console.log('Payment object created:', {
      paymentId: payment.paymentId,
      memberId: payment.memberId,
      amount: payment.amount,
      paymentType: payment.paymentType,
      locker: payment.locker
    });

    await payment.save({ session });
    console.log('Payment saved successfully');

    // Prepare payment record for member's payment history
    const memberPaymentRecord = {
      amount: paymentData.amount,
      paymentMethod: paymentData.paymentMethod,
      paymentDate: payment.paymentDate,
      status: payment.status,
      type: paymentData.paymentType,
      paymentId: payment.paymentId,
      quantity: paymentData.quantity,
      productId: paymentData.productId,
      remark: paymentData.remark
    };

    // Add payment to member's payment history
    member.payments.push(memberPaymentRecord);

    // Update last payment date
    member.lastPaymentDate = payment.paymentDate;

    // Update member status based on start date and payment
    // Only activate if this is a 'membership' payment and the first for the current period
    if (
      paymentData.paymentType === "membership" &&
      member.memberStatus === "pending"
    ) {
      // Determine the start of the new period
      let periodStart = new Date(member.startDate);
      if (member.cancellationDate && member.cancellationDate > periodStart) {
        periodStart = new Date(member.cancellationDate);
      }
      // Find all membership payments made after the period start
      const membershipPaymentsThisPeriod = member.payments.filter(
        (p) =>
          (p.type === "membership" || p.paymentType === "membership") &&
          p.paymentDate >= periodStart
      );
      // If this is the first membership payment after the period start, activate
      if (membershipPaymentsThisPeriod.length === 1) { // this payment just pushed
        member.memberStatus = "active";
      }
      // If not first payment, keep status as "pending"
    }

    // Save the member with new payment
    await member.save({ session });
    console.log('Member updated with payment history');

    await session.commitTransaction();
    console.log('Transaction committed successfully');

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
const getMemberPaymentsService = async (memberId) => {
  try {
    const payments = await Payment.find({ memberId }).sort({ paymentDate: -1 });

    return payments;
  } catch (error) {
    console.error("Error in getMemberPaymentsService:", error);
    throw new Error(`Failed to get member payments: ${error.message}`);
  }
};

// Get revenue statistics
const getRevenueStatsService = async () => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    
    // Calculate last month's date range
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Calculate today's and yesterday's date range
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const endOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);

    // Get total revenue
    const totalRevenue = await Payment.aggregate([
      { $match: { status: "completed" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    // Get today's revenue
    const dailyRevenue = await Payment.aggregate([
      {
        $match: {
          status: "completed",
          paymentDate: {
            $gte: startOfToday,
            $lte: endOfToday,
          },
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    // Get yesterday's revenue
    const yesterdayRevenue = await Payment.aggregate([
      {
        $match: {
          status: "completed",
          paymentDate: {
            $gte: startOfYesterday,
            $lte: endOfYesterday,
          },
        },
      },
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

    // Get last month's revenue
    const lastMonthRevenue = await Payment.aggregate([
      {
        $match: {
          status: "completed",
          paymentDate: {
            $gte: lastMonth,
            $lte: endOfLastMonth,
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

    // Get today's membership revenue
    const dailyMembershipRevenue = await Payment.aggregate([
      {
        $match: {
          status: "completed",
          paymentType: "membership",
          paymentDate: {
            $gte: startOfToday,
            $lte: endOfToday,
          },
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    // Get yesterday's membership revenue
    const yesterdayMembershipRevenue = await Payment.aggregate([
      {
        $match: {
          status: "completed",
          paymentType: "membership",
          paymentDate: {
            $gte: startOfYesterday,
            $lte: endOfYesterday,
          },
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

    // Get last month's membership revenue
    const lastMonthMembershipRevenue = await Payment.aggregate([
      {
        $match: {
          status: "completed",
          paymentType: "membership",
          paymentDate: {
            $gte: lastMonth,
            $lte: endOfLastMonth,
          },
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    // Get today's product revenue
    const dailyProductRevenue = await Payment.aggregate([
      {
        $match: {
          status: "completed",
          paymentType: "product",
          paymentDate: {
            $gte: startOfToday,
            $lte: endOfToday,
          },
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    // Get yesterday's product revenue
    const yesterdayProductRevenue = await Payment.aggregate([
      {
        $match: {
          status: "completed",
          paymentType: "product",
          paymentDate: {
            $gte: startOfYesterday,
            $lte: endOfYesterday,
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

    // Get last month's product revenue
    const lastMonthProductRevenue = await Payment.aggregate([
      {
        $match: {
          status: "completed",
          paymentType: "product",
          paymentDate: {
            $gte: lastMonth,
            $lte: endOfLastMonth,
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

    // Get daily revenue trend (last 30 days)
    const dailyTrend = await Payment.aggregate([
      {
        $match: {
          status: "completed",
          paymentDate: {
            $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
            $lte: now,
          },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$paymentDate" },
            month: { $month: "$paymentDate" },
            day: { $dayOfMonth: "$paymentDate" },
          },
          total: { $sum: "$amount" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
    ]);

    return {
      totalRevenue: totalRevenue[0]?.total || 0,
      dailyRevenue: dailyRevenue[0]?.total || 0,
      yesterdayRevenue: yesterdayRevenue[0]?.total || 0,
      monthlyRevenue: monthlyRevenue[0]?.total || 0,
      lastMonthRevenue: lastMonthRevenue[0]?.total || 0,
      membershipRevenue: membershipRevenue[0]?.total || 0,
      dailyMembershipRevenue: dailyMembershipRevenue[0]?.total || 0,
      yesterdayMembershipRevenue: yesterdayMembershipRevenue[0]?.total || 0,
      monthlyMembershipRevenue: monthlyMembershipRevenue[0]?.total || 0,
      lastMonthMembershipRevenue: lastMonthMembershipRevenue[0]?.total || 0,
      dailyProductRevenue: dailyProductRevenue[0]?.total || 0,
      yesterdayProductRevenue: yesterdayProductRevenue[0]?.total || 0,
      monthlyProductRevenue: monthlyProductRevenue[0]?.total || 0,
      lastMonthProductRevenue: lastMonthProductRevenue[0]?.total || 0,
      revenueByType: revenueByType.reduce((acc, curr) => {
        acc[curr._id] = curr.total;
        return acc;
      }, {}),
      monthlyTrend: monthlyTrend.map((item) => ({
        month: `${item._id.year}-${item._id.month.toString().padStart(2, "0")}`,
        total: item.total,
      })),
      dailyTrend: dailyTrend.map((item) => ({
        date: `${item._id.year}-${item._id.month.toString().padStart(2, "0")}-${item._id.day.toString().padStart(2, "0")}`,
        total: item.total,
      })),
    };
  } catch (error) {
    console.error("Error in getRevenueStatsService:", error);
    throw new Error(`Failed to get revenue statistics: ${error.message}`);
  }
};

// Get payment by ID
const getPaymentByIdService = async (paymentId) => {
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
const updatePaymentStatusService = async (paymentId, status) => {
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

// Get all payments with filtering and pagination
const getAllPaymentsService = async ({
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
    const query = {};
    const sort = {};

    // Add search filter
    if (search) {
      query.$or = [
        { paymentId: { $regex: search, $options: "i" } },
        { fullName: { $regex: search, $options: "i" } },
        { memberId: { $regex: search, $options: "i" } },
      ];
    }

    // Add date range filter
    if (startDate || endDate) {
      query.paymentDate = {};
      if (startDate) {
        query.paymentDate.$gte = new Date(startDate);
      }
      if (endDate) {
        query.paymentDate.$lte = new Date(endDate);
      }
    }

    // Add payment method filter
    if (method) {
      query.paymentMethod = method;
    }

    // Add payment type filter
    if (type) {
      query.paymentType = type;
    }

    // Set sort order
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Get total count
    const total = await Payment.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    // Get paginated results
    const docs = await Payment.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit);

    return {
      docs,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  } catch (error) {
    console.error("Error in getAllPaymentsService:", error);
    throw new Error(`Failed to get payments: ${error.message}`);
  }
};

// Delete payment
const deletePaymentService = async (paymentId) => {
  try {
    const payment = await Payment.findOneAndDelete({ paymentId });
    if (!payment) {
      throw new Error("Payment not found");
    }
    return payment;
  } catch (error) {
    console.error("Error in deletePaymentService:", error);
    throw new Error(`Failed to delete payment: ${error.message}`);
  }
};

module.exports = {
  createPaymentService,
  getMemberPaymentsService,
  getRevenueStatsService,
  getPaymentByIdService,
  updatePaymentStatusService,
  getAllPaymentsService,
  deletePaymentService
};
