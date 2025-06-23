/**
 * Gym membership acceptance email template
 * @param {Object} params - Template parameters
 * @param {string} params.fullName - Member's full name
 * @param {string} params.memberId - Unique member ID
 * @param {string} params.membershipType - Type of membership
 * @param {Date} params.startDate - Membership start date
 * @param {Date} params.endDate - Membership end date
 * @returns {string} HTML email template
 */
const gymMembershipAcceptanceTemplate = (params) => {
  const { 
    fullName = 'Member', 
    memberId = 'N/A', 
    membershipType = 'Standard', 
    startDate, 
    endDate 
  } = params;

  return `
    <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
      <!-- Header with gym background -->
      <div style="background: linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('https://images.unsplash.com/photo-1571902943202-507ec2618e8f?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80'); background-size: cover; color: white; padding: 40px 20px; text-align: center;">
        <h1 style="margin: 0; font-size: 32px; font-weight: 700;">WELCOME TO KNOX BARBELL!</h1>
        <p style="font-size: 18px; margin: 10px 0 0;">Your fitness journey starts now</p>
      </div>
      
      <!-- Content -->
      <div style="padding: 30px;">
        <h2 style="color: #2c3e50; margin-top: 0;">Congratulations, ${fullName}!</h2>
        
        <p style="font-size: 16px; line-height: 1.6; color: #34495e;">
          We're thrilled to welcome you to Knox Barbell! Your application has been accepted and we can't wait to help you achieve your fitness goals.
        </p>
        
        <!-- Membership Card -->
        <div style="background: linear-gradient(135deg, #e74c3c, #c0392b); border-radius: 8px; padding: 20px; margin: 25px 0; color: white; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
          <h3 style="margin: 0 0 15px 0; font-size: 20px; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 10px;">YOUR MEMBERSHIP CARD</h3>
          
          <div style="display: flex; justify-content: space-between; flex-wrap: wrap;">
            <div style="margin-bottom: 15px;">
              <div style="font-size: 12px; opacity: 0.8;">Member ID</div>
              <div style="font-size: 18px; font-weight: bold;">${memberId}</div>
            </div>
            
            <div style="margin-bottom: 15px;">
              <div style="font-size: 12px; opacity: 0.8;">Membership Type</div>
              <div style="font-size: 18px; font-weight: bold;">${membershipType}</div>
            </div>
            
            <div style="margin-bottom: 15px;">
              <div style="font-size: 12px; opacity: 0.8;">Valid From</div>
              <div style="font-size: 18px; font-weight: bold;">${startDate ? startDate.toLocaleDateString() : 'N/A'}</div>
            </div>
            
            <div style="margin-bottom: 15px;">
              <div style="font-size: 12px; opacity: 0.8;">Expires</div>
              <div style="font-size: 18px; font-weight: bold;">${endDate ? endDate.toLocaleDateString() : 'N/A'}</div>
            </div>
          </div>
        </div>
        
        <!-- Next Steps -->
        <div style="background: #ecf0f1; border-radius: 6px; padding: 15px; margin: 20px 0;">
          <h4 style="margin: 0 0 10px 0; color: #2c3e50;">YOUR NEXT STEPS:</h4>
          <ul style="margin: 0; padding-left: 20px; color: #34495e;">
            <li style="margin-bottom: 8px;">Visit our facility to complete registration</li>
            <li style="margin-bottom: 8px;">Bring a photo ID for verification</li>
            <li style="margin-bottom: 8px;">Schedule your free orientation session</li>
          </ul>
        </div>
        
        <!-- CTA Button -->
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://www.knoxbarbell.com/get-started" style="display: inline-block; background: #e74c3c; color: white; padding: 12px 30px; border-radius: 4px; text-decoration: none; font-weight: bold; font-size: 16px;">GET STARTED TODAY</a>
        </div>
        
        <p style="font-size: 14px; color: #7f8c8d; text-align: center;">
          If you have any questions, contact us at <a href="mailto:support@knoxbarbell.com" style="color: #3498db;">support@knoxbarbell.com</a> or call (555) 123-4567
        </p>
      </div>
      
      <!-- Footer -->
      <div style="background: #2c3e50; color: white; padding: 15px; text-align: center; font-size: 12px;">
        <p style="margin: 0;">© ${new Date().getFullYear()} Knox Barbell. All Rights Reserved.</p>
        <p style="margin: 5px 0 0;">123 Fitness Ave, Gym City, TN 37922</p>
      </div>
    </div>
  `;
};

module.exports = {
  gymMembershipAcceptanceTemplate
};