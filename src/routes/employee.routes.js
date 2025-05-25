import express from "express";
import {
  createEmployee,
  getAllEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
} from "../controllers/employee.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

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

export default router;
