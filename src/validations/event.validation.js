import Joi from "joi";

export const validateEvent = (req, res, next) => {
  const schema = Joi.object({
    eventName: Joi.string().max(100).required(),
    description: Joi.string().optional(),
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).optional(),
    location: Joi.string().required(),
    capacity: Joi.number().positive().optional(),
    registrationDeadline: Joi.date().iso().optional(),
    eventType: Joi.string()
      .valid('workshop', 'seminar', 'conference', 'training', 'social')
      .optional(),
    status: Joi.string()
      .valid('scheduled', 'ongoing', 'completed', 'cancelled')
      .optional()
      .default('scheduled')
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