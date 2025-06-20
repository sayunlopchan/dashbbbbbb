const Joi = require("joi");

const validateMember = (req, res, next) => {
  const schema = Joi.object({
    fullName: Joi.string().max(100).required(),
    email: Joi.string().email().required(),
    contact: Joi.string()
      .pattern(/^[0-9]{10,15}$/)
      .required(),
    emergencyNumber: Joi.string()
      .pattern(/^[0-9]{10,15}$/)
      .allow(""),
    membershipDuration: Joi.number()
      .valid(1, 3, 6, 12)
      .optional(),
    startDate: Joi.date().required(),
    dateOfBirth: Joi.date().iso().max('now').required(),
    gender: Joi.string()
      .valid('male', 'female', 'other')
      .required(),
    membershipType: Joi.string()
      .valid("silver", "gold", "diamond", "platinum")
      .optional(),
    memberStatus: Joi.string()
      .valid("active", "inactive", "pending", "cancelled", "expiring", "expired")
      .optional()
      .default("pending"),
  }).unknown(true); // Allow additional fields

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }

  next();
};

// Payment validation
const validatePayment = (req, res, next) => {
  const schema = Joi.object({
    paymentAmount: Joi.number().positive().required(),
    paymentMethod: Joi.string()
      .valid('cash', 'card', 'bank', 'online_payment')
      .required(),
    membershipType: Joi.string()
      .valid('silver', 'gold', 'diamond', 'platinum')
      .required()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }

  next();
};

// Membership Renewal Validation
const validateMembershipRenewal = (req, res, next) => {
  const schema = Joi.object({
    paymentAmount: Joi.number().positive().required(),
    paymentMethod: Joi.string()
      .valid('cash', 'card', 'bank', 'online_payment')
      .required(),
    membershipType: Joi.string()
      .valid('silver', 'gold', 'diamond', 'platinum')
      .required()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }

  next();
};

// Locker assignment validation
const validateLockerAssignment = (req, res, next) => {
  console.log('=== LOCKER ASSIGNMENT VALIDATION ===');
  console.log('Request body:', req.body);
  console.log('Request params:', req.params);
  
  const schema = Joi.object({
    lockerNumber: Joi.string().trim().required(),
    paymentAmount: Joi.alternatives().try(
      Joi.number().positive(),
      Joi.string().pattern(/^\d+(\.\d{1,2})?$/).min(1)
    ).required(),
    paymentMethod: Joi.string()
      .valid('cash', 'card', 'bank', 'online_payment')
      .default('cash')
  });

  const { error } = schema.validate(req.body);
  if (error) {
    console.log('Validation failed:', error.details[0].message);
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }

  console.log('Validation passed');

  // Convert paymentAmount to number if it's a string
  if (typeof req.body.paymentAmount === 'string') {
    req.body.paymentAmount = parseFloat(req.body.paymentAmount);
    console.log('Converted paymentAmount to number:', req.body.paymentAmount);
  }

  next();
};

// Personal trainer assignment validation
const validateTrainerAssignment = (req, res, next) => {
  const schema = Joi.object({
    trainerId: Joi.string().trim().required()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }

  next();
};

module.exports = {
  validateMember,
  validatePayment,
  validateMembershipRenewal,
  validateLockerAssignment,
  validateTrainerAssignment
};
