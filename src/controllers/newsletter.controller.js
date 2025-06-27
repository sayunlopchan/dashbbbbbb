const NewsletterSubscriber = require("../models/NewsletterSubscriber.model");

// POST /subscribe
exports.subscribe = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !/^[^@]+@[^@]+\.[^@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Valid email required"
      });
    }

    // Check for duplicate
    const existing = await NewsletterSubscriber.findOne({ email });
    if (existing) {
      return res.status(200).json({
        success: true,
        message: "Already subscribed"
      });
    }

    await NewsletterSubscriber.create({ email });

    res.status(201).json({
      success: true,
      message: "Subscribed successfully"
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// GET /subscribers
exports.getSubscribers = async (req, res) => {
  try {
    const subscribers = await NewsletterSubscriber.find().sort({ subscribedAt: -1 });
    res.status(200).json({
      success: true,
      data: subscribers
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};
