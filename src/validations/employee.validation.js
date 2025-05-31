const Joi = require("joi");

const validateEmployee = (req, res, next) => {
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
    position: Joi.string().required(),
    department: Joi.string().optional(),
    employmentType: Joi.string()
      .valid('full-time', 'part-time', 'contract', 'temporary')
      .optional(),
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
  validateEmployee
}; 