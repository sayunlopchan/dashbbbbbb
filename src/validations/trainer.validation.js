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
    dateOfBirth: Joi.date().iso().max('now').required(),
    specialization: Joi.string().optional(),
    qualifications: Joi.array().items(Joi.string()).optional(),
    status: Joi.string()
      .valid('active', 'inactive', 'suspended')
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

module.exports = {
  validateTrainer
}; 