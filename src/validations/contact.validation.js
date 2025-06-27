const Joi = require('joi');

const contactValidationSchema = Joi.object({
  firstName: Joi.string().trim().min(1).max(50).required(),
  lastName: Joi.string().trim().min(1).max(50).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().pattern(/^[+]?\d{7,20}$/).required(),
  subject: Joi.string().trim().min(1).max(100).required(),
  message: Joi.string().trim().min(1).max(2000).required()
});

module.exports = { contactValidationSchema }; 