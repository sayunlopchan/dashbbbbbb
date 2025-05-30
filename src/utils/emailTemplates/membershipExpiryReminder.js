const membershipExpiryReminderTemplate = ({
  fullName = 'Member',
  memberId = 'N/A',
  membershipType = 'Standard',
  expiryDate = 'N/A',
  reminderCount = 1,
  daysUntilExpiry = 0,
  customMessage = 'Your membership is about to expire.'
}) => {
  // Format the expiry date if it's a Date object or string
  const formattedExpiryDate = expiryDate 
    ? new Date(expiryDate).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    : 'N/A';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Membership Expiry Reminder</title>
  <style>
    /* Base styles */
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    
    /* Container */
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    
    /* Header */
    .header {
      background-color: #f4f4f4;
      padding: 20px;
      text-align: center;
      border-radius: 5px 5px 0 0;
    }
    
    /* Content */
    .content {
      background-color: #ffffff;
      padding: 20px;
      border: 1px solid #f4f4f4;
    }
    
    /* Alert box */
    .alert {
      background-color: #f9f9f9;
      border-left: 4px solid #007bff;
      padding: 15px;
      margin: 20px 0;
      border-radius: 0 5px 5px 0;
    }
    
    /* Details box */
    .details {
      background-color: #f4f4f4;
      border-radius: 5px;
      padding: 15px;
      margin: 20px 0;
    }
    
    .details ul {
      list-style-type: none;
      padding: 0;
      margin: 0;
    }
    
    .details li {
      margin-bottom: 10px;
    }
    
    /* Button */
    .button {
      display: inline-block;
      background-color: #007bff;
      color: white;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 5px;
      margin: 20px 0;
      text-align: center;
    }
    
    /* Footer */
    .footer {
      text-align: center;
      font-size: 0.8em;
      color: #666;
      margin-top: 20px;
      padding: 20px;
      background-color: #f4f4f4;
      border-radius: 0 0 5px 5px;
    }
    
    /* Responsive styles */
    @media only screen and (max-width: 600px) {
      .container {
        width: 100% !important;
        padding: 10px !important;
      }
      
      .content {
        padding: 15px !important;
      }
      
      .button {
        display: block;
        width: 100%;
        box-sizing: border-box;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; color: #333;">Membership Expiring Soon!</h1>
    </div>
    
    <div class="content">
      <p>Dear ${fullName},</p>
      
      <div class="alert">
        <p style="margin: 0; color: #333;">${customMessage}</p>
      </div>
      
      <div class="details">
        <h2 style="margin-top: 0; color: #333;">Membership Details</h2>
        <ul>
          <li><strong>Member ID:</strong> ${memberId}</li>
          <li><strong>Membership Type:</strong> ${membershipType}</li>
          <li><strong>Expiry Date:</strong> ${formattedExpiryDate}</li>
          ${daysUntilExpiry > 0 ? `<li><strong>Days Remaining:</strong> ${daysUntilExpiry}</li>` : ''}
        </ul>
      </div>
      
      <div style="text-align: center;">
        <a href="#" class="button">Renew Membership</a>
      </div>
    </div>
    
    <div class="footer">
      <p>© ${new Date().getFullYear()} Your Organization. All rights reserved.</p>
      <p>Reminder ${reminderCount} of 3</p>
    </div>
  </div>
</body>
</html>
`;
};

module.exports = {
  membershipExpiryReminderTemplate
}; 