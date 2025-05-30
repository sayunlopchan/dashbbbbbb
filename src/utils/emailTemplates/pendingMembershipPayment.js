/**
 * Email template for pending membership payment reminder
 * @param {Object} params - Template parameters
 * @param {string} params.fullName - Member's full name
 * @param {string} params.memberId - Unique member ID
 * @param {string} params.membershipType - Type of membership
 * @param {Date} params.startDate - Membership start date
 * @returns {string} HTML email template
 */
const pendingMembershipPaymentTemplate = (params) => {
  const { 
    fullName = 'Member', 
    memberId = 'N/A', 
    membershipType = 'Standard', 
    startDate 
  } = params;

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #FF6B6B;">Payment Pending</h1>
      
      <p>Dear ${fullName},</p>
      
      <p>Your membership is scheduled to start on <strong>${startDate ? startDate.toLocaleDateString() : 'N/A'}</strong>, 
      but your payment is still pending.</p>
      
      <div style="background-color: #f4f4f4; border-radius: 5px; padding: 15px; margin: 20px 0;">
        <h2 style="margin-top: 0; color: #333;">Membership Details</h2>
        <ul style="list-style-type: none; padding: 0;">
          <li><strong>Member ID:</strong> ${memberId}</li>
          <li><strong>Membership Type:</strong> ${membershipType}</li>
          <li><strong>Start Date:</strong> ${startDate ? startDate.toLocaleDateString() : 'N/A'}</li>
        </ul>
      </div>
      
      <p>Please complete your payment to activate your membership. 
      If you have any questions, please contact our support team.</p>
      
      <div style="margin-top: 20px; padding: 10px; background-color: #FFE5B4; border-radius: 5px;">
        <p style="margin: 0; font-size: 0.9em; color: #666;">
          Reminder: Your membership activation is pending payment.
        </p>
      </div>
      
      <p>Best regards,<br/>Your Organization</p>
    </div>
  `;
};

module.exports = {
  pendingMembershipPaymentTemplate
}; 