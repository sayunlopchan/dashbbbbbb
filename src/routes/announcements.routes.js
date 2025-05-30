const express = require("express");
const announcementController = require("../controllers/announcement.controller");
const { authenticate } = require("../middlewares/auth.middleware");

const router = express.Router();

// GET all announcements - authenticated
router.get("/", authenticate, announcementController.getAllAnnouncements);

// GET a single announcement by ID - authenticated
router.get(
  "/:announcementId",
  authenticate,
  announcementController.getAnnouncementById
);

// CREATE a new announcement - authenticated
router.post("/", authenticate, announcementController.createAnnouncement);

// UPDATE an announcement - authenticated
router.put(
  "/:announcementId",
  authenticate,
  announcementController.updateAnnouncement
);

// DELETE an announcement - authenticated
router.delete(
  "/:announcementId",
  authenticate,
  announcementController.deleteAnnouncement
);

module.exports = router;
