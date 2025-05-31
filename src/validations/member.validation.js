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

module.exports = {
  validateMember,
  validatePayment,
  validateMembershipRenewal
};
