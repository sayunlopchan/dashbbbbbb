/**
 * Email template for membership acceptance
 * @param {Object} params - Template parameters
 * @param {string} params.fullName - Member's full name
 * @param {string} params.memberId - Unique member ID
 * @param {string} params.membershipType - Type of membership
 * @param {Date} params.startDate - Membership start date
 * @param {Date} params.endDate - Membership end date
 * @returns {string} HTML email template
 */
const membershipAcceptanceTemplate = (params) => {
  const { 
    fullName = 'Member', 
    memberId = 'N/A', 
    membershipType = 'Standard', 
    startDate, 
    endDate 
  } = params;

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #4CAF50;">Congratulations!</h1>
      
      <p>Dear ${fullName},</p>
      
      <p>We are excited to inform you that your application has been accepted, and you are now a member of our community!</p>
      
      <div style="background-color: #f4f4f4; border-radius: 5px; padding: 15px; margin: 20px 0;">
        <h2 style="margin-top: 0; color: #333;">Membership Details</h2>
        <ul style="list-style-type: none; padding: 0;">
          <li><strong>Member ID:</strong> ${memberId}</li>
          <li><strong>Membership Type:</strong> ${membershipType}</li>
          <li><strong>Start Date:</strong> ${startDate ? startDate.toLocaleDateString() : 'N/A'}</li>
          <li><strong>End Date:</strong> ${endDate ? endDate.toLocaleDateString() : 'N/A'}</li>
        </ul>
      </div>
      
      <p>Welcome to our community! We look forward to providing you with an exceptional experience.</p>
      
      <div style="margin-top: 20px; padding: 10px; background-color: #e6f2ff; border-radius: 5px;">
        <p style="margin: 0; font-size: 0.9em; color: #666;">
          If you have any questions or need assistance, please don't hesitate to contact our support team.
        </p>
      </div>
      
      <p>Best regards,<br/>Knox Barbell</p>
    </div>
  `;
};

module.exports = {
  membershipAcceptanceTemplate
}; 