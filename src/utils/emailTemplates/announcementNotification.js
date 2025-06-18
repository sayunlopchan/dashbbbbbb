const announcementNotificationTemplate = ({
  memberName,
  announcementTitle,
  announcementAuthor,
  announcementDescription,
  announcementId,
  postDate
}) => {
  // Helper function to format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Helper function to format description with line breaks
  const formatDescription = (description) => {
    if (Array.isArray(description)) {
      return description.map(desc => `<p style="margin: 8px 0;">${desc}</p>`).join('');
    }
    return `<p style="margin: 8px 0;">${description}</p>`;
  };

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #FF6B35; text-align: center;">📢 New Announcement!</h1>
      
      <p>Dear ${memberName},</p>
      
      <p>We have an important announcement that we'd like to share with you!</p>
      
      <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #FF6B35;">
        <h2 style="margin-top: 0; color: #333; text-align: center;">${announcementTitle}</h2>
        
        <div style="background-color: white; border-radius: 6px; padding: 15px; margin: 15px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #555; width: 30%;">Announcement ID:</td>
              <td style="padding: 8px 0; color: #333;">${announcementId}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #555;">Posted By:</td>
              <td style="padding: 8px 0; color: #333;">${announcementAuthor}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #555;">Posted On:</td>
              <td style="padding: 8px 0; color: #333;">${formatDate(postDate)}</td>
            </tr>
          </table>
        </div>
        
        <div style="margin-top: 15px;">
          <h3 style="margin-top: 0; color: #333;">Announcement Details:</h3>
          <div style="background-color: white; border-radius: 6px; padding: 15px;">
            ${formatDescription(announcementDescription)}
          </div>
        </div>
      </div>
      
      <div style="background-color: #e8f5e8; border-radius: 8px; padding: 15px; margin: 20px 0; border-left: 4px solid #4CAF50;">
        <h3 style="margin-top: 0; color: #2e7d32;">What's Next?</h3>
        <ul style="margin: 0; padding-left: 20px; color: #2e7d32;">
          <li>Check our website for more details</li>
          <li>Stay updated with our latest announcements</li>
          <li>Contact us if you have any questions</li>
          <li>Share this information with other members if relevant</li>
        </ul>
      </div>
      
      <div style="text-align: center; margin: 20px 0;">
        <a href="#" style="background-color: #FF6B35; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
          View Full Announcement
        </a>
      </div>
      
      <div style="margin-top: 20px; padding: 15px; background-color: #fff3cd; border-radius: 8px; border-left: 4px solid #ffc107;">
        <p style="margin: 0; font-size: 0.9em; color: #856404;">
          <strong>Note:</strong> This is an automated notification. You can manage your email preferences in your account settings.
        </p>
      </div>
      
      <p style="margin-top: 20px;">Thank you for staying connected with us!</p>
      
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
  announcementNotificationTemplate
}; 