import * as employeeService from "../services/employee.service.js";

/**
 * Create new employee
 */
export const createEmployee = async (req, res) => {
  try {
    // Validate required fields
    const requiredFields = ["fullName", "email", "contact", "position"];
    const missingFields = requiredFields.filter((field) => !req.body[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(req.body.email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    // Validate joining date if provided
    if (req.body.joiningDate) {
      const joiningDate = new Date(req.body.joiningDate);
      if (isNaN(joiningDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid joining date format",
        });
      }
      // Check if joining date is not in the future
      if (joiningDate > new Date()) {
        return res.status(400).json({
          success: false,
          message: "Joining date cannot be in the future",
        });
      }
    }

    // Validate status if provided
    if (req.body.status && !["active", "inactive"].includes(req.body.status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value. Must be one of: active, inactive",
      });
    }

    const employee = await employeeService.createEmployee(req.body);
    res.status(201).json({
      success: true,
      data: employee,
    });
  } catch (error) {
    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }

    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get all employees
 */
export const getAllEmployees = async (req, res) => {
  try {
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

    const result = await employeeService.getAllEmployees(req.query);
    res.status(200).json({
      success: true,
      data: result.employees,
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
 * Get employee by ID
 */
export const getEmployeeById = async (req, res) => {
  try {
    const employee = await employeeService.getEmployeeById(
      req.params.employeeId
    );
    res.status(200).json({
      success: true,
      data: employee,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Update employee
 */
export const updateEmployee = async (req, res) => {
  try {
    // Validate that at least one valid field is being updated
    const validFields = [
      "fullName",
      "email",
      "contact",
      "position",
      "status",
      "joiningDate",
      "emergencyContact",
    ];
    const updateFields = Object.keys(req.body);
    const hasValidField = updateFields.some((field) =>
      validFields.includes(field)
    );

    if (!hasValidField) {
      return res.status(400).json({
        success: false,
        message: "No valid fields to update",
      });
    }

    // Validate email format if being updated
    if (req.body.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(req.body.email)) {
        return res.status(400).json({
          success: false,
          message: "Invalid email format",
        });
      }
    }

    // Validate joining date if being updated
    if (req.body.joiningDate) {
      const joiningDate = new Date(req.body.joiningDate);
      if (isNaN(joiningDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid joining date format",
        });
      }
      // Check if joining date is not in the future
      if (joiningDate > new Date()) {
        return res.status(400).json({
          success: false,
          message: "Joining date cannot be in the future",
        });
      }
    }

    // Validate status if being updated
    if (req.body.status && !["active", "inactive"].includes(req.body.status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value. Must be one of: active, inactive",
      });
    }

    const employee = await employeeService.updateEmployee(
      req.params.employeeId,
      req.body
    );
    res.status(200).json({
      success: true,
      data: employee,
    });
  } catch (error) {
    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }

    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Delete employee
 */
export const deleteEmployee = async (req, res) => {
  try {
    await employeeService.deleteEmployee(req.params.employeeId);
    res.status(200).json({
      success: true,
      message: "Employee deleted successfully",
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};
