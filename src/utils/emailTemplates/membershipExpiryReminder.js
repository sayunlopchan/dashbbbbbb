export const membershipExpiryReminderTemplate = ({
  fullName,
  memberId,
  membershipType,
  expiryDate,
  reminderCount,
  daysUntilExpiry,
  customMessage
}) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Membership Expiry Reminder</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <header style="background-color: #f4f4f4; padding: 10px; text-align: center;">
    <h1>Membership Status Update</h1>
  </header>
  
  <main>
    <p>Dear ${fullName},</p>
    
    <div style="background-color: #f9f9f9; border-left: 4px solid #007bff; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; color: #333;">${customMessage}</p>
    </div>
    
    <div style="background-color: #f4f4f4; border-radius: 5px; padding: 15px; margin: 20px 0;">
      <h2 style="margin-top: 0; color: #333;">Membership Details</h2>
      <ul style="list-style-type: none; padding: 0;">
        <li><strong>Member ID:</strong> ${memberId}</li>
        <li><strong>Membership Type:</strong> ${membershipType}</li>
        <li><strong>Expiry Date:</strong> ${expiryDate}</li>
        ${daysUntilExpiry > 0 ? `<li><strong>Days Remaining:</strong> ${daysUntilExpiry}</li>` : ''}
      </ul>
    </div>
    
    <div style="text-align: center; margin-top: 20px;">
      <a href="#" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Renew Membership</a>
    </div>
  </main>
  
  <footer style="margin-top: 20px; text-align: center; font-size: 0.8em; color: #666;">
    <p>© ${new Date().getFullYear()} Your Organization. All rights reserved.</p>
    <p>Reminder ${reminderCount} of 3</p>
  </footer>
</body>
</html>
`; 