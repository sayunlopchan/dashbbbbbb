const attendanceService = require("../services/attendance.service");

/**
 * Check-in member
 */
const checkIn = async (req, res) => {
  try {
    const { memberId } = req.params;
    // Use optional chaining to safely access time, defaulting to undefined if not present
    const time = req.body?.time;

    // Validate check-in time if provided
    if (time) {
      try {
        const checkInTime = new Date(time);

        // Comprehensive time validation
        if (isNaN(checkInTime.getTime())) {
          return res.status(400).json({
            success: false,
            message: "Invalid time format. Please provide a valid time string.",
            details: {
              receivedTime: time,
              expectedFormat: "ISO 8601 date string or parseable date format",
            },
          });
        }

        // Prevent future times
        const now = new Date();
        if (checkInTime > now) {
          return res.status(400).json({
            success: false,
            message: "Time cannot be in the future",
            details: {
              receivedTime: checkInTime.toISOString(),
              currentTime: now.toISOString(),
            },
          });
        }
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: "Error processing time",
          details: {
            errorMessage: error.message,
            receivedTime: time,
          },
        });
      }
    }

    const attendance = await attendanceService.checkIn(
      memberId,
      time !== undefined ? { time } : {}
    );

    res.status(201).json({
      success: true,
      data: attendance,
      message: `Member checked in successfully${
        attendance.checkIn.isAutoSet ? " (auto-set time)" : ""
      }`,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Check-out member
 */
const checkOut = async (req, res) => {
  try {
    const { memberId } = req.params;
    // Use optional chaining to safely access time, defaulting to undefined if not present
    const time = req.body?.time;

    // Validate check-out time if provided
    if (time) {
      const checkOutTime = new Date(time);
      if (isNaN(checkOutTime.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid check-out time format",
        });
      }

      // Check if time is not in future
      if (checkOutTime > new Date()) {
        return res.status(400).json({
          success: false,
          message: "Check-out time cannot be in the future",
        });
      }
    }

    const attendance = await attendanceService.checkOut(
      memberId,
      time !== undefined ? { time } : {}
    );

    res.status(200).json({
      success: true,
      data: attendance,
      message: `Member checked out successfully${
        attendance.checkOut.isAutoSet ? " (auto-set time)" : ""
      }`,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get member's attendance history
 */
const getMemberAttendance = async (req, res) => {
  try {
    const { memberId } = req.params;

    // Validate date range if provided
    if (req.query.startDate && isNaN(new Date(req.query.startDate).getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid start date format",
      });
    }
    if (req.query.endDate && isNaN(new Date(req.query.endDate).getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid end date format",
      });
    }

    const result = await attendanceService.getMemberAttendance(
      memberId,
      req.query
    );

    res.status(200).json({
      success: true,
      data: result.attendance,
      pagination: result.pagination,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get all attendance records
 */
const getAllAttendance = async (req, res) => {
  try {
    // Validate date if provided
    if (req.query.date && isNaN(new Date(req.query.date).getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format",
      });
    }

    const result = await attendanceService.getAllAttendance(req.query);

    res.status(200).json({
      success: true,
      data: result.attendance,
      pagination: result.pagination,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Delete attendance records for a member
 */
const deleteAttendance = async (req, res) => {
  try {
    const { memberId } = req.params;

    // Validate date range if provided
    if (req.query.startDate && isNaN(new Date(req.query.startDate).getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid start date format",
      });
    }
    if (req.query.endDate && isNaN(new Date(req.query.endDate).getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid end date format",
      });
    }

    const result = await attendanceService.deleteAttendance(
      memberId,
      req.query
    );

    res.status(200).json({
      success: true,
      message: `Deleted ${result.deletedCount} attendance record(s)`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  checkIn,
  checkOut,
  getMemberAttendance,
  getAllAttendance,
  deleteAttendance,
};
