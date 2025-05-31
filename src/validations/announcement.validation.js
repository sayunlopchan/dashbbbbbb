const Joi = require("joi");

const validateAnnouncement = (req, res, next) => {
  const schema = Joi.object({
    title: Joi.string().max(100).required(),
    content: Joi.string().required(),
    type: Joi.string()
      .valid('general', 'membership', 'event', 'urgent')
      .optional()
      .default('general'),
    publishDate: Joi.date().iso().optional().default(new Date()),
    expiryDate: Joi.date().iso().optional().min(Joi.ref('publishDate')),
    targetAudience: Joi.array()
      .items(Joi.string().valid('all', 'members', 'staff', 'trainers'))
      .optional()
      .default(['all']),
    status: Joi.string()
      .valid('draft', 'published', 'archived')
      .optional()
      .default('draft')
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
  validateAnnouncement
}; 