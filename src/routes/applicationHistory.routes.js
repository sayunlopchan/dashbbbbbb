const { Router } = require("express");
const {
  getAllApplicationHistory,
  getApplicationHistoryById,
  deleteApplicationHistory,
} = require("../controllers/applicationHistory.controller");
const { authenticate } = require("../middlewares/auth.middleware");

const router = Router();

// Get all application history (requires authentication)
router.get("/", authenticate, getAllApplicationHistory);

// Get application history by id (requires authentication)
router.get("/:applicationId", authenticate, getApplicationHistoryById);

// Delete application history (requires authentication)
router.delete("/:applicationId", authenticate, deleteApplicationHistory);

module.exports = router;
