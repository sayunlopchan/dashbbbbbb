/**
 * Email template for event notifications
 * @param {Object} params - Template parameters
 * @param {string} params.memberName - Member's name
 * @param {string} params.eventTitle - Event title
 * @param {string} params.eventOrganizer - Event organizer
 * @param {string} params.eventCategory - Event category
 * @param {string} params.eventLocation - Event location
 * @param {Date} params.eventStartTime - Event start time
 * @param {Date} params.eventEndTime - Event end time
 * @param {Array} params.eventDescription - Event description array
 * @param {Array} params.eventTags - Event tags
 * @param {string} params.eventId - Event ID
 * @returns {string} HTML email template
 */
const eventNotificationTemplate = (params) => {
  const { 
    memberName = 'Member',
    eventTitle = 'New Event',
    eventOrganizer = 'Organizer',
    eventCategory = 'Event',
    eventLocation = 'Location',
    eventStartTime,
    eventEndTime,
    eventDescription = [],
    eventTags = [],
    eventId = 'N/A'
  } = params;

  // Format dates
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format description
  const formatDescription = (descArray) => {
    if (!Array.isArray(descArray) || descArray.length === 0) {
      return 'No description available.';
    }
    return descArray.map(item => `<p>${item}</p>`).join('');
  };

  // Format tags
  const formatTags = (tagsArray) => {
    if (!Array.isArray(tagsArray) || tagsArray.length === 0) {
      return 'No tags';
    }
    return tagsArray.map(tag => `<span style="background-color: #e3f2fd; padding: 4px 8px; border-radius: 12px; margin: 2px; display: inline-block; font-size: 0.8em;">${tag}</span>`).join(' ');
  };

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #2196F3; text-align: center;">🎉 New Event Alert!</h1>
      
      <p>Dear ${memberName},</p>
      
      <p>We're excited to announce a new event that you might be interested in!</p>
      
      <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #2196F3;">
        <h2 style="margin-top: 0; color: #333; text-align: center;">${eventTitle}</h2>
        
        <div style="background-color: white; border-radius: 6px; padding: 15px; margin: 15px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #555; width: 30%;">Event ID:</td>
              <td style="padding: 8px 0; color: #333;">${eventId}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #555;">Organizer:</td>
              <td style="padding: 8px 0; color: #333;">${eventOrganizer}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #555;">Category:</td>
              <td style="padding: 8px 0; color: #333; text-transform: capitalize;">${eventCategory}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #555;">Location:</td>
              <td style="padding: 8px 0; color: #333;">${eventLocation}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #555;">Start Time:</td>
              <td style="padding: 8px 0; color: #333;">${formatDate(eventStartTime)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #555;">End Time:</td>
              <td style="padding: 8px 0; color: #333;">${formatDate(eventEndTime)}</td>
            </tr>
          </table>
        </div>
        
        <div style="margin-top: 15px;">
          <h3 style="margin-top: 0; color: #333;">Description:</h3>
          <div style="background-color: white; border-radius: 6px; padding: 15px;">
            ${formatDescription(eventDescription)}
          </div>
        </div>
        
        <div style="margin-top: 15px;">
          <h3 style="margin-top: 0; color: #333;">Tags:</h3>
          <div style="background-color: white; border-radius: 6px; padding: 15px;">
            ${formatTags(eventTags)}
          </div>
        </div>
      </div>
      
      <div style="background-color: #e8f5e8; border-radius: 8px; padding: 15px; margin: 20px 0; border-left: 4px solid #4CAF50;">
        <h3 style="margin-top: 0; color: #2e7d32;">What's Next?</h3>
        <ul style="margin: 0; padding-left: 20px; color: #2e7d32;">
          <li>Check your dashboard for more event details</li>
          <li>Register for the event if you're interested</li>
          <li>Share this event with other members</li>
          <li>Contact the organizer for any questions</li>
        </ul>
      </div>
      
      <div style="text-align: center; margin: 20px 0;">
        <a href="#" style="background-color: #2196F3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
          View Event Details
        </a>
      </div>
      
      <div style="margin-top: 20px; padding: 15px; background-color: #fff3cd; border-radius: 8px; border-left: 4px solid #ffc107;">
        <p style="margin: 0; font-size: 0.9em; color: #856404;">
          <strong>Note:</strong> This is an automated notification. You can manage your email preferences in your account settings.
        </p>
      </div>
      
      <p style="margin-top: 20px;">We hope to see you at the event!</p>
      
      <p>Best regards,<br/>
      <strong>Your Organization Team</strong></p>
      
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="font-size: 0.8em; color: #666; text-align: center;">
        This is an automated message. Please do not reply to this email.
      </p>
    </div>
  `;
};

module.exports = {
  eventNotificationTemplate
}; 