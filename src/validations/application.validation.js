import Joi from "joi";

export const validateApplication = (req, res, next) => {
  const schema = Joi.object({
    fullName: Joi.string().max(100).required(),
    email: Joi.string().email().required(),
    contact: Joi.string()
      .pattern(/^[0-9]{10,15}$/)
      .required(),
    emergencyNumber: Joi.string()
      .pattern(/^[0-9]{10,15}$/)
      .allow(""),
    dateOfBirth: Joi.date()
      .max('now')
      .required(),
    gender: Joi.string()
      .valid('male', 'female', 'other')
      .required(),
    address: Joi.string()
      .max(200)
      .required(),
    emergencyContactName: Joi.string()
      .max(100)
      .required(),
    emergencyContactRelationship: Joi.string()
      .required(),
    membershipDuration: Joi.number()
      .valid(1, 3, 6, 12)
      .required(),
    startDate: Joi.date().optional(),
    applicationStatus: Joi.string()
      .valid("pending", "rejected", "accepted")
      .optional()
      .default("pending"),
    membershipType: Joi.string()
      .valid("silver", "gold", "diamond", "platinum")
      .optional(),
  }).unknown(true);

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }

  next();
}; 