/**
 * Email template for application submission
 * @param {Object} params - Template parameters
 * @param {string} params.name - Applicant's name
 * @param {string} params.applicationId - Application ID
 * @param {string} params.message - Custom message
 * @returns {string} HTML email template
 */
const applicationSubmissionTemplate = (params) => {
  const { 
    name = 'Applicant', 
    applicationId = 'N/A', 
    message = 'Your application has been successfully submitted.' 
  } = params;

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #333;">Application Received</h1>
      <p>Dear ${name},</p>
      <p>${message}</p>
      
      ${applicationId ? `<p><strong>Application ID:</strong> ${applicationId}</p>` : ''}
      
      <p>We will review your application and get back to you soon.</p>
      
      <div style="margin-top: 20px; padding: 10px; background-color: #f4f4f4; border-radius: 5px;">
        <p style="margin: 0; font-size: 0.9em; color: #666;">
          If you have any questions, please contact our support team.
        </p>
      </div>
      
      <p>Best regards,<br/>Knox Barbell</p>
    </div>
  `;
};

module.exports = {
  applicationSubmissionTemplate
}; 