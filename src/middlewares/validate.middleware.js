const { validationResult, body, param } = require("express-validator");

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

module.exports = {
  validate,
  body: bodyValidator,
  param: paramValidator
};
