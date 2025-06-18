const Joi = require("joi");

// Color data validation schema
const colorDataSchema = Joi.object({
  type: Joi.string().valid('simple', 'gradient').required(),
  color: Joi.when('type', {
    is: 'simple',
    then: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).required().messages({
      'string.pattern.base': 'Color must be a valid hex color code (e.g., #3498db)'
    }),
    otherwise: Joi.forbidden()
  }),
  color1: Joi.when('type', {
    is: 'gradient',
    then: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).required().messages({
      'string.pattern.base': 'Color1 must be a valid hex color code (e.g., #3498db)'
    }),
    otherwise: Joi.forbidden()
  }),
  color2: Joi.when('type', {
    is: 'gradient',
    then: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).required().messages({
      'string.pattern.base': 'Color2 must be a valid hex color code (e.g., #2980b9)'
    }),
    otherwise: Joi.forbidden()
  }),
  direction: Joi.when('type', {
    is: 'gradient',
    then: Joi.string().valid('to right', 'to bottom', '135deg', '45deg').required(),
    otherwise: Joi.forbidden()
  })
});

// Create membership validation schema
const createMembershipSchema = Joi.object({
  title: Joi.string().trim().required().messages({
    "string.empty": "Membership title is required",
    "any.required": "Membership title is required",
  }),
  price: Joi.number().min(0).required().messages({
    "number.base": "Price must be a number",
    "number.min": "Price cannot be negative",
    "any.required": "Membership price is required",
  }),
  duration: Joi.string().trim().required().messages({
    "string.empty": "Membership duration is required",
    "any.required": "Membership duration is required",
  }),
  colorData: colorDataSchema.optional()
});

// Update membership validation schema
const updateMembershipSchema = Joi.object({
  title: Joi.string().trim().optional().messages({
    "string.empty": "Membership title cannot be empty",
  }),
  price: Joi.number().min(0).optional().messages({
    "number.base": "Price must be a number",
    "number.min": "Price cannot be negative",
  }),
  duration: Joi.string().trim().optional().messages({
    "string.empty": "Membership duration cannot be empty",
  }),
  colorData: colorDataSchema.optional()
});

// Validate create membership
const validateCreateMembership = (data) => {
  return createMembershipSchema.validate(data, { abortEarly: false });
};

// Validate update membership
const validateUpdateMembership = (data) => {
  return updateMembershipSchema.validate(data, { abortEarly: false });
};

module.exports = {
  validateCreateMembership,
  validateUpdateMembership,
}; 