const Attendance = require("../models/Attendance.model");
const Member = require("../models/Member.model");

/**
 * Check-in a member
 */
const checkIn = async (memberId, checkInData = {}) => {
  try {
    // Verify member exists
    const member = await Member.findOne({ memberId });
    if (!member) {
      throw new Error("Member not found");
    }

    // Get today's date (without time)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if attendance record already exists for today
    let attendance = await Attendance.findOne({
      "member.memberId": memberId,
      date: today,
    });

    if (attendance) {
      throw new Error("Member already checked in for today");
    }

    // Create new attendance record
    const checkInTime = checkInData.time
      ? new Date(checkInData.time)
      : new Date();
    attendance = new Attendance({
      member: {
        fullName: member.fullName,
        email: member.email,
        memberId: member.memberId,
      },
      date: today,
      checkIn: {
        time: checkInTime,
        isAutoSet: !checkInData.time,
      },
    });

    await attendance.save();
    return attendance;
  } catch (error) {
    console.error("Error in checkIn service:", error);
    throw error;
  }
};

/**
 * Check-out a member
 */
const checkOut = async (memberId, checkOutData = {}) => {
  try {
    // Verify member exists
    const member = await Member.findOne({ memberId });
    if (!member) {
      throw new Error("Member not found");
    }

    // Get today's date (without time)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find today's attendance record
    const attendance = await Attendance.findOne({
      "member.memberId": memberId,
      date: today,
    });

    if (!attendance) {
      throw new Error("No check-in record found for today");
    }

    if (attendance.checkOut.time) {
      throw new Error("Member already checked out for today");
    }

    // Update check-out time
    const checkOutTime = checkOutData.time
      ? new Date(checkOutData.time)
      : new Date();
    attendance.checkOut = {
      time: checkOutTime,
      isAutoSet: !checkOutData.time,
    };

    await attendance.save();
    return attendance;
  } catch (error) {
    console.error("Error in checkOut service:", error);
    throw error;
  }
};

/**
 * Get member's attendance history
 */
const getMemberAttendance = async (memberId, query = {}) => {
  try {
    const { page = 1, limit = 10, startDate, endDate } = query;

    // Verify member exists
    const member = await Member.findOne({ memberId });
    if (!member) {
      throw new Error("Member not found");
    }

    // Build filter
    const filter = { "member.memberId": memberId };

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const attendance = await Attendance.find(filter)
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Attendance.countDocuments(filter);

    return {
      attendance,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error("Error in getMemberAttendance service:", error);
    throw error;
  }
};

/**
 * Get attendance records for all members
 */
const getAllAttendance = async (query = {}) => {
  try {
    const { page = 1, limit = 10, date, search, startDate, endDate } = query;

    const filter = {};

    if (date) {
      const queryDate = new Date(date);
      queryDate.setHours(0, 0, 0, 0);
      filter.date = queryDate;
    }

    if (startDate) {
      const startDateObj = new Date(startDate);
      startDateObj.setHours(0, 0, 0, 0);

      const endDateObj = endDate ? new Date(endDate) : new Date();
      endDateObj.setHours(23, 59, 59, 999);

      filter.date = {
        $gte: startDateObj,
        $lte: endDateObj,
      };
    }

    if (search) {
      filter.$or = [
        { "member.memberId": { $regex: search, $options: "i" } },
        { "member.fullName": { $regex: search, $options: "i" } },
        { "member.email": { $regex: search, $options: "i" } },
      ];
    }

    const attendance = await Attendance.find(filter)
      .sort({ date: -1, "checkIn.time": -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Attendance.countDocuments(filter);

    return {
      attendance,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error("Error in getAllAttendance service:", error);
    throw error;
  }
};

/**
 * Delete attendance records for a member
 */
const deleteAttendance = async (memberId, query = {}) => {
  try {
    // Verify member exists
    const member = await Member.findOne({ memberId });
    if (!member) {
      throw new Error("Member not found");
    }

    // Build filter for deletion
    const filter = { "member.memberId": memberId };

    // If specific date range is provided, add date filter
    if (query.startDate || query.endDate) {
      filter.date = {};
      if (query.startDate) filter.date.$gte = new Date(query.startDate);
      if (query.endDate) filter.date.$lte = new Date(query.endDate);
    }

    // Perform deletion
    const result = await Attendance.deleteMany(filter);

    return {
      deletedCount: result.deletedCount,
    };
  } catch (error) {
    console.error("Error in deleteAttendance service:", error);
    throw error;
  }
};

module.exports = {
  checkIn,
  checkOut,
  getMemberAttendance,
  getAllAttendance,
  deleteAttendance
};
