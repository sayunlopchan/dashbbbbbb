const { contactValidationSchema } = require('../validations/contact.validation');
const { sendContactFormEmail } = require('../utils/emailService');

exports.sendContactForm = async (req, res) => {
  try {
    // Validate input
    const { error, value } = contactValidationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }
    // Send email
    await sendContactFormEmail(value);
    return res.status(200).json({ success: true, message: 'Your message has been sent successfully.' });
  } catch (err) {
    console.error('Contact form error:', err);
    return res.status(500).json({ success: false, message: 'Failed to send your message. Please try again later.' });
  }
}; 