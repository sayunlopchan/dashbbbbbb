import Joi from "joi";

export const validateParticipant = (req, res, next) => {
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
    eventId: Joi.string().required(),
    registrationDate: Joi.date().iso().optional().default(new Date()),
    status: Joi.string()
      .valid('registered', 'confirmed', 'attended', 'cancelled')
      .optional()
      .default('registered')
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