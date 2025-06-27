const { Router } = require("express");
const {
  subscribe,
  getSubscribers
} = require("../controllers/newsletter.controller");

const router = Router();

router.post("/subscribe", subscribe);
router.get("/subscribers", getSubscribers);

module.exports = router;
