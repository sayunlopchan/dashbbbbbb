import Joi from "joi";

export const validateNotification = (req, res, next) => {
  const schema = Joi.object({
    recipient: Joi.string().required(),
    type: Joi.string()
      .valid('email', 'sms', 'push', 'in-app')
      .required(),
    category: Joi.string()
      .valid('membership', 'payment', 'event', 'application', 'general')
      .required(),
    message: Joi.string().required(),
    status: Joi.string()
      .valid('sent', 'read', 'failed')
      .optional()
      .default('sent'),
    priority: Joi.string()
      .valid('low', 'medium', 'high', 'urgent')
      .optional()
      .default('medium'),
    sentAt: Joi.date().iso().optional().default(new Date()),
    readAt: Joi.date().iso().optional()
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