import Employee from "../models/Employee.model.js";
import { generateEmployeeId } from "../utils/idgenerator/generateEmployeeId.js";

/**
 * Create a new employee
 */
export const createEmployee = async (employeeData) => {
  try {
    // First check if email already exists
    const existingEmployee = await Employee.findOne({
      email: employeeData.email,
    });
    if (existingEmployee) {
      throw new Error("Email already exists");
    }

    // Extract only the fields we need
    const {
      fullName,
      email,
      contact,
      position,
      status,
      joiningDate,
      emergencyContact,
    } = employeeData;

    // Only generate ID after email validation
    const employeeId = await generateEmployeeId();

    const employee = new Employee({
      employeeId,
      fullName,
      email,
      contact,
      position,
      status,
      joiningDate: joiningDate || new Date(), // Use provided date or current date
      emergencyContact: emergencyContact
        ? { phone: emergencyContact.phone }
        : undefined,
    });

    await employee.save();
    return employee;
  } catch (error) {
    // If error is from our email check, throw it as is
    if (error.message === "Email already exists") {
      throw error;
    }
    console.error("Error in createEmployee service:", error);
    throw error;
  }
};

/**
 * Get all employees with pagination and filters
 */
export const getAllEmployees = async (query = {}) => {
  try {
    const {
      page = 1,
      limit = 0,
      status,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
      startDate,
      endDate,
    } = query;

    const filter = {};
    if (status) filter.status = status;

    // Add date range filter if provided
    if (startDate || endDate) {
      filter.joiningDate = {};
      if (startDate) filter.joiningDate.$gte = new Date(startDate);
      if (endDate) filter.joiningDate.$lte = new Date(endDate);
    }

    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { employeeId: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { position: { $regex: search, $options: "i" } },
      ];
    }

    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    const employees = await Employee.find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit) || 0);

    const total = await Employee.countDocuments(filter);

    return {
      employees,
      pagination: {
        total,
        page: parseInt(page),
        pages: limit > 0 ? Math.ceil(total / limit) : 1,
      },
    };
  } catch (error) {
    console.error("Error in getAllEmployees service:", error);
    throw error;
  }
};

/**
 * Get employee by ID
 */
export const getEmployeeById = async (employeeId) => {
  try {
    const employee = await Employee.findOne({ employeeId });
    if (!employee) {
      throw new Error("Employee not found");
    }
    return employee;
  } catch (error) {
    console.error("Error in getEmployeeById service:", error);
    throw error;
  }
};

/**
 * Update employee
 */
export const updateEmployee = async (employeeId, updateData) => {
  try {
    // Check if email is being updated and if it already exists
    if (updateData.email) {
      const existingEmployee = await Employee.findOne({
        email: updateData.email,
        employeeId: { $ne: employeeId }, // Exclude current employee
      });
      if (existingEmployee) {
        throw new Error("Email already exists");
      }
    }

    // Extract only valid fields for update
    const {
      fullName,
      email,
      contact,
      position,
      status,
      joiningDate,
      emergencyContact,
    } = updateData;

    const validUpdateData = {
      ...(fullName && { fullName }),
      ...(email && { email }),
      ...(contact && { contact }),
      ...(position && { position }),
      ...(status && { status }),
      ...(joiningDate && { joiningDate: new Date(joiningDate) }),
      ...(emergencyContact && {
        emergencyContact: { phone: emergencyContact.phone },
      }),
    };

    const employee = await Employee.findOneAndUpdate(
      { employeeId },
      { $set: validUpdateData },
      { new: true, runValidators: true }
    );

    if (!employee) {
      throw new Error("Employee not found");
    }
    return employee;
  } catch (error) {
    console.error("Error in updateEmployee service:", error);
    throw error;
  }
};

/**
 * Delete employee
 */
export const deleteEmployee = async (employeeId) => {
  try {
    const employee = await Employee.findOneAndDelete({ employeeId });
    if (!employee) {
      throw new Error("Employee not found");
    }
    return employee;
  } catch (error) {
    console.error("Error in deleteEmployee service:", error);
    throw error;
  }
};
