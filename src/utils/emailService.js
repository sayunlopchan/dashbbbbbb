import nodemailer from 'nodemailer';
import { applicationSubmissionTemplate } from './emailTemplates/applicationSubmission.js';
import { membershipAcceptanceTemplate } from './emailTemplates/membershipAcceptance.js';
import { pendingMembershipPaymentTemplate } from './emailTemplates/pendingMembershipPayment.js';
import { membershipExpiryReminderTemplate } from './emailTemplates/membershipExpiryReminder.js';
import { membershipExpiryTemplate } from './emailTemplates/membershipExpiry.js';
import { membershipCancellationTemplate } from './emailTemplates/membershipCancellation.js';
import dayjs from 'dayjs';

// Create a transporter using the default SMTP transport
const createTransporter = () => {
  // Validate email configuration
  const requiredEnvVars = ['EMAIL_HOST', 'EMAIL_USER', 'EMAIL_PASS'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required email configuration: ${missingVars.join(', ')}`);
  }

  // For Gmail SMTP with SSL (port 465)
  const config = {
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '465'),
    secure: true, // true for port 465
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false // Only use this in development
    }
  };

  console.log('📧 Email Configuration:', {
    host: config.host,
    port: config.port,
    secure: config.secure,
    user: config.auth.user
  });

  return nodemailer.createTransport(config);
};

/**
 * Validate email parameters
 * @param {string} email - Email address to validate
 * @param {string} name - Name to validate
 * @param {Object} options - Additional options to validate
 * @throws {Error} If validation fails
 */
const validateEmailParams = (email, name, options = {}) => {
  if (!email || typeof email !== 'string') {
    throw new Error('Invalid email address');
  }

  if (!name || typeof name !== 'string') {
    throw new Error('Invalid recipient name');
  }

  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error('Invalid email format');
  }

  // Validate required options if present
  if (options.subject && typeof options.subject !== 'string') {
    throw new Error('Invalid email subject');
  }

  if (options.html && typeof options.html !== 'string') {
    throw new Error('Invalid email HTML content');
  }
};

/**
 * Send a generic email with flexible options
 * @param {string} to - Recipient's email address
 * @param {string} name - Recipient's name
 * @param {Object} options - Email configuration options
 * @returns {Promise<void>}
 */
export const sendEmail = async (to, name, options = {}) => {
  console.log(`🔔 Attempting to send email to: ${to}`);
  console.log(`📧 Email Details:`, {
    to,
    name,
    subject: options.subject || 'Notification',
  });

  try {
    // Validate parameters
    validateEmailParams(to, name, options);

    const transporter = createTransporter();

    const defaultOptions = {
      subject: 'Notification from Our Platform',
      html: options.html || `
        <h1>Hello, ${name}!</h1>
        <p>${options.message || 'You have a new notification.'}</p>
        <br/>
        <p>Best regards,<br/>Your Organization</p>
      `,
      from: process.env.EMAIL_USER,
    };

    const mailOptions = { 
      ...defaultOptions, 
      ...options,
      to,
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    
    console.log(`✅ Email sent successfully to ${to}`);
    console.log(`📬 Message ID: ${info.messageId}`);
    console.log(`🌐 Response: ${info.response}`);

    return info;
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}`);
    console.error(`🚨 Error Details:`, {
      message: error.message,
      stack: error.stack,
    });
    throw error;
  }
};

/**
 * Send a welcome email for application submission
 * @param {string} email - Recipient's email address
 * @param {string} name - Applicant's name
 * @param {Object} additionalInfo - Additional email information
 * @returns {Promise<void>}
 */
export const sendWelcomeEmail = async (email, name, additionalInfo = {}) => {
  console.log(`📝 Preparing welcome email for: ${email}`);
  
  const { applicationId, message } = additionalInfo;

  return sendEmail(email, name, {
    subject: 'Application Submission Confirmation',
    html: applicationSubmissionTemplate({ 
      name, 
      applicationId, 
      message 
    })
  });
};

/**
 * Send membership acceptance email
 * @param {Object} memberDetails - Member's details
 * @returns {Promise<void>}
 */
export const sendMembershipAcceptanceEmail = async (memberDetails) => {
  console.log(`🎉 Preparing membership acceptance email for: ${memberDetails.email}`);

  return sendEmail(memberDetails.email, memberDetails.fullName, {
    subject: 'Membership Accepted - Welcome Aboard!',
    html: membershipAcceptanceTemplate({
      fullName: memberDetails.fullName,
      memberId: memberDetails.memberId,
      membershipType: memberDetails.membershipType,
      startDate: memberDetails.startDate,
      endDate: memberDetails.endDate
    })
  });
};

/**
 * Send membership expiry email
 * @param {string} email - Recipient's email address
 * @param {string} name - Member's name
 * @param {Object} memberDetails - Member's details including expiry date
 * @returns {Promise<void>}
 */
export const sendExpiryEmail = async (email, name, memberDetails = {}) => {
  console.log(`⏰ Preparing expiry email for: ${email}`);
  
  return sendEmail(email, name, {
    subject: 'Membership Expiry Notice',
    html: membershipExpiryTemplate({ 
      name,
      expiryDate: memberDetails.endDate || memberDetails.expiryDate
    })
  });
};

// Add a new function for sending pending membership payment reminder
export const sendPendingMembershipPaymentReminder = async (memberDetails) => {
  console.log(`💳 Preparing pending payment reminder email for: ${memberDetails.email}`);

  return sendEmail(memberDetails.email, memberDetails.fullName, {
    subject: 'Pending Membership Payment Reminder',
    html: pendingMembershipPaymentTemplate({
      fullName: memberDetails.fullName,
      memberId: memberDetails.memberId,
      membershipType: memberDetails.membershipType,
      startDate: memberDetails.startDate
    })
  });
};

/**
 * Send membership expiry reminder
 * @param {Object} memberDetails - Member's details
 * @returns {Promise<void>}
 */
export const sendMembershipExpiryReminder = async (memberDetails) => {
  console.log(`⏳ Preparing membership expiry reminder email for: ${memberDetails.email}`);

  // Validate required member details
  if (!memberDetails || typeof memberDetails !== 'object') {
    throw new Error('Invalid member details');
  }

  if (!memberDetails.email || !memberDetails.fullName) {
    throw new Error('Missing required member details: email and fullName are required');
  }

  // Ensure daysUntilExpiry is a number, default to 0 if not provided
  const daysUntilExpiry = Number.isInteger(memberDetails.daysUntilExpiry) 
    ? memberDetails.daysUntilExpiry 
    : 0;

  // Default message if not provided
  const customMessage = memberDetails.message || 
    `Your membership will expire in ${daysUntilExpiry} days. Please take action.`;

  // Determine subject based on reminder type
  let subject = 'Membership Expiry Reminder';
  switch (memberDetails.reminderType) {
    case 'FIRST_REMINDER':
      subject = 'Membership Expiring Soon - First Reminder';
      break;
    case 'SECOND_REMINDER':
      subject = 'Urgent: Membership Expiring Soon';
      break;
    case 'FINAL_REMINDER':
      subject = 'Membership Expired - Account Inactivated';
      break;
  }

  return sendEmail(memberDetails.email, memberDetails.fullName, {
    subject: subject,
    html: membershipExpiryReminderTemplate({
      fullName: memberDetails.fullName,
      memberId: memberDetails.memberId,
      membershipType: memberDetails.membershipType,
      expiryDate: memberDetails.expiryDate || memberDetails.endDate,
      reminderCount: memberDetails.expiryReminderCount || 1,
      daysUntilExpiry: daysUntilExpiry,
      customMessage: customMessage
    })
  });
};

// Add this after the existing email service functions
export const sendMembershipCancellationEmail = async (memberDetails) => {
  console.log(`❌ Preparing membership cancellation email for: ${memberDetails.email}`);

  return sendEmail(memberDetails.email, memberDetails.fullName, {
    subject: 'Membership Cancellation Notice',
    html: membershipCancellationTemplate({
      fullName: memberDetails.fullName,
      memberId: memberDetails.memberId,
      membershipType: memberDetails.membershipType,
      cancellationReason: memberDetails.cancellationReason || 'non-payment'
    })
  });
};
