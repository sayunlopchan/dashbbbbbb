const Joi = require("joi");

const validateTrainer = (req, res, next) => {
  const schema = Joi.object({
    fullName: Joi.string().max(100).required(),
    email: Joi.string().email().required(),
    contact: Joi.string()
      .pattern(/^[0-9]{10,15}$/)
      .required(),
    gender: Joi.string()
      .valid('male', 'female', 'other')
      .required(),
    joinDate: Joi.date().iso().required(),
    status: Joi.string()
      .valid('active', 'inactive')
      .optional()
      .default('active')
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

// Validate member assignment to trainer
const validateMemberAssignment = (req, res, next) => {
  const schema = Joi.object({
    memberId: Joi.string().trim().required()
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

// Validate member status update
const validateMemberStatusUpdate = (req, res, next) => {
  const schema = Joi.object({
    status: Joi.string().valid('active', 'inactive').required()
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
  validateTrainer,
  validateMemberAssignment,
  validateMemberStatusUpdate
}; 