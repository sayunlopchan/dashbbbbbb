/**
 * Email template for member creation confirmation
 * @param {Object} params - Template parameters
 * @param {string} params.fullName - Member's full name
 * @param {string} params.memberId - Unique member ID
 * @param {string} params.membershipType - Type of membership
 * @param {Date} params.startDate - Membership start date
 * @param {Date} params.endDate - Membership end date
 * @param {string} params.email - Member's email address
 * @param {string} params.contact - Member's contact number
 * @returns {string} HTML email template
 */
const memberCreationTemplate = (params) => {
  const { 
    fullName = 'Member', 
    memberId = 'N/A', 
    membershipType = 'Standard', 
    startDate, 
    endDate,
    email = 'N/A',
    contact = 'N/A'
  } = params;

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #2196F3;">Welcome to Our Community!</h1>
      
      <p>Dear ${fullName},</p>
      
      <p>Thank you for joining our community! Your membership has been successfully created and is now active.</p>
      
      <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #2196F3;">
        <h2 style="margin-top: 0; color: #333;">Your Membership Details</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #555;">Member ID:</td>
            <td style="padding: 8px 0; color: #333;">${memberId}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #555;">Membership Type:</td>
            <td style="padding: 8px 0; color: #333; text-transform: capitalize;">${membershipType}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #555;">Start Date:</td>
            <td style="padding: 8px 0; color: #333;">${startDate ? new Date(startDate).toLocaleDateString() : 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #555;">End Date:</td>
            <td style="padding: 8px 0; color: #333;">${endDate ? new Date(endDate).toLocaleDateString() : 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #555;">Email:</td>
            <td style="padding: 8px 0; color: #333;">${email}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #555;">Contact:</td>
            <td style="padding: 8px 0; color: #333;">${contact}</td>
          </tr>
        </table>
      </div>
      
      <div style="background-color: #e8f5e8; border-radius: 8px; padding: 15px; margin: 20px 0; border-left: 4px solid #4CAF50;">
        <h3 style="margin-top: 0; color: #2e7d32;">What's Next?</h3>
        <ul style="margin: 0; padding-left: 20px; color: #2e7d32;">
          <li>Your membership is now active and ready to use</li>
          <li>You can access all facilities and services included in your ${membershipType} membership</li>
          <li>Keep your Member ID handy for future reference</li>
          <li>We'll send you reminders before your membership expires</li>
        </ul>
      </div>
      
      <div style="margin-top: 20px; padding: 15px; background-color: #fff3cd; border-radius: 8px; border-left: 4px solid #ffc107;">
        <p style="margin: 0; font-size: 0.9em; color: #856404;">
          <strong>Important:</strong> Please save this email for your records. If you have any questions or need assistance, 
          please don't hesitate to contact our support team.
        </p>
      </div>
      
      <p style="margin-top: 20px;">We're excited to have you as part of our community!</p>
      
      <p>Best regards,<br/>
      <strong>Knox Barbell</strong></p>
      
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="font-size: 0.8em; color: #666; text-align: center;">
        This is an automated message. Please do not reply to this email.
      </p>
    </div>
  `;
};

module.exports = {
  memberCreationTemplate
}; 