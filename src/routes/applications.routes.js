const { Router } = require("express");
const {
  createApplication,
  getAllApplications,
  acceptApplication,
  deleteApplication,
  getApplicationById,
} = require("../controllers/application.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const { validateApplication } = require("../validations/application.validation");

const router = Router();

// Get all applications (requires authentication)
router.get("/", authenticate, getAllApplications);

// Get application by id (requires authentication)
router.get("/:applicationId", authenticate, getApplicationById);

// Create a new application (no authentication required)
router.post("/", validateApplication, createApplication);

// Accept an application and create a member (requires authentication)
router.put("/accept/:applicationId", authenticate, acceptApplication);

// Delete an application (requires authentication)
router.delete("/delete/:applicationId", authenticate, deleteApplication);

module.exports = router;
