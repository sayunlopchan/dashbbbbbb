const express = require("express");
const {
  createEmployee,
  getAllEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
} = require("../controllers/employee.controller");
const { authenticate } = require("../middlewares/auth.middleware");

const router = express.Router();

// Create new employee
router.post("/", authenticate, createEmployee);

// Get all employees
router.get("/", authenticate, getAllEmployees);

// Get employee by ID
router.get("/:employeeId", authenticate, getEmployeeById);

// Update employee
router.put("/:employeeId", authenticate, updateEmployee);

// Delete employee
router.delete("/:employeeId", authenticate, deleteEmployee);

module.exports = router;
