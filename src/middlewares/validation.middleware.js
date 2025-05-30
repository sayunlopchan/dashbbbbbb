const { validationResult, body, param } = require("express-validator");
const Event = require("../models/event.model");
const mongoose = require("mongoose");

// Middleware to run validation checks
const validate = (validations) => {
  return async (req, res, next) => {
    // Run all validations
    await Promise.all(validations.map((validation) => validation.run(req)));

    // Check for validation errors
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    // If errors exist, return 400 with error details
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  };
};

// Wrapper for express-validator methods to maintain compatibility
const bodyValidator = (field) => {
  return body(field);
};

const paramValidator = (field) => {
  return param(field);
};

// Middleware to validate if an event exists
const validateEventExists = async (req, res, next) => {
  try {
    const eventId = req.params.eventId;
    const event = await Event.findById(eventId);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found"
      });
    }
    
    // Attach the event to the request object for later use
    req.event = event;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error validating event",
      error: error.message
    });
  }
};

// Middleware to validate MongoDB ObjectId
const validateObjectId = (paramName) => {
  return async (req, res, next) => {
    const id = req.params[paramName];
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid ${paramName} format`
      });
    }
    
    next();
  };
};

module.exports = {
  validate,
  body: bodyValidator,
  param: paramValidator,
  validateEventExists,
  validateObjectId
};
