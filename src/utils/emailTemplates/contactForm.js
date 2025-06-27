const contactFormTemplate = ({ firstName, lastName, email, phone, subject, message }) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #2196F3;">New Contact Form Submission</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="font-weight: bold; color: #555; width: 30%;">First Name:</td>
          <td>${firstName}</td>
        </tr>
        <tr>
          <td style="font-weight: bold; color: #555;">Last Name:</td>
          <td>${lastName}</td>
        </tr>
        <tr>
          <td style="font-weight: bold; color: #555;">Email:</td>
          <td>${email}</td>
        </tr>
        <tr>
          <td style="font-weight: bold; color: #555;">Phone:</td>
          <td>${phone}</td>
        </tr>
        <tr>
          <td style="font-weight: bold; color: #555;">Subject:</td>
          <td>${subject}</td>
        </tr>
      </table>
      <div style="margin-top: 20px;">
        <h3 style="color: #333;">Message:</h3>
        <div style="background-color: #f8f9fa; border-radius: 6px; padding: 15px;">
          <p style="white-space: pre-line;">${message}</p>
        </div>
      </div>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="font-size: 0.8em; color: #666; text-align: center;">
        This is an automated message from the website contact form.
      </p>
    </div>
  `;
};

module.exports = { contactFormTemplate }; 