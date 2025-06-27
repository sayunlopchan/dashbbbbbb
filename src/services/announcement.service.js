const Announcement = require("../models/Announcement.model");
const Member = require("../models/Member.model");
const NewsletterSubscriber = require("../models/NewsletterSubscriber.model");
const mongoose = require("mongoose");
const { sendAnnouncementNotificationToAllMembers } = require("../utils/emailService");

// Get all announcements
const getAllAnnouncementsService = async () => {
  // Get all announcements without pagination
  const docs = await Announcement.find({}).sort({ createdAt: -1 });

  return {
    docs,
    pagination: {
      total: docs.length,
      page: 1,
      limit: docs.length,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false,
    },
  };
};

// Get announcement by announcementId
const getAnnouncementByIdService = async (announcementId) => {
  const announcement = await Announcement.findOne({ announcementId });
  if (!announcement) {
    throw new Error("Announcement not found");
  }
  return announcement;
};

// Create a new announcement
const createAnnouncementService = async (announcementData) => {
  const session = await mongoose.startSession();

  try {
    // Start transaction
    session.startTransaction();

    // Get the last announcement to determine the next ID
    const lastAnnouncement = await Announcement.findOne({}, {}, { sort: { 'announcementId': -1 } });
    
    let announcementId;
    if (lastAnnouncement) {
      // Extract the number from the last announcement ID
      const lastNumber = parseInt(lastAnnouncement.announcementId.replace('KB-ANN', ''));
      const nextNumber = lastNumber + 1;
      announcementId = `KB-ANN${nextNumber.toString().padStart(2, '0')}`;
    } else {
      // If no announcements exist, start with KB-ANN01
      announcementId = 'KB-ANN01';
    }

    // Create new announcement
    const announcement = new Announcement({
      ...announcementData,
      announcementId,
      postDate: announcementData.postDate || new Date(),
    });

    await announcement.save({ session });

    // Update the counter to match the last used number
    if (lastAnnouncement) {
      const lastNumber = parseInt(lastAnnouncement.announcementId.replace('KB-ANN', ''));
      await mongoose.model('Counter').findOneAndUpdate(
        { name: 'announcement_counter' },
        { sequence_value: lastNumber },
        { upsert: true }
      );
    }

    // Commit transaction
    await session.commitTransaction();

    console.log('✅ Announcement created successfully:', {
      announcementId: announcement.announcementId,
      title: announcement.title,
      _id: announcement._id
    });

    // Send announcement notification to all members and newsletter subscribers
    try {
      // Fetch all members regardless of status
      const allMembers = await Member.find({}).select('fullName email memberStatus');
      // Fetch all newsletter subscribers
      const allSubscribers = await NewsletterSubscriber.find({}).select('email');

      console.log(`🔍 Found ${allMembers.length} total members`);
      console.log(`🔍 Found ${allSubscribers.length} newsletter subscribers`);

      // Prepare a combined list for email sending
      const memberEmails = allMembers.map(m => ({
        fullName: m.fullName,
        email: m.email,
        memberStatus: m.memberStatus
      }));
      // Subscribers may not have fullName/memberStatus, so use email only
      const subscriberEmails = allSubscribers.map(s => ({
        fullName: s.email, // fallback to email as name
        email: s.email,
        memberStatus: 'subscriber'
      }));
      // Merge and deduplicate by email
      const allRecipientsMap = new Map();
      [...memberEmails, ...subscriberEmails].forEach(rec => {
        allRecipientsMap.set(rec.email, rec);
      });
      const allRecipients = Array.from(allRecipientsMap.values());

      if (allRecipients.length > 0) {
        console.log(`📧 Sending announcement notification to ${allRecipients.length} recipients (members + subscribers)`);
        console.log('📧 Recipients to notify:', allRecipients.map(m => `${m.fullName} (${m.email}) - Status: ${m.memberStatus}`));
        
        const emailResults = await sendAnnouncementNotificationToAllMembers(announcement, allRecipients);
        
        console.log(`📊 Announcement notification email results:`, {
          total: emailResults.total,
          successful: emailResults.successful,
          failed: emailResults.failed
        });
        
        if (emailResults.failed > 0) {
          console.warn(`⚠️ ${emailResults.failed} announcement notification emails failed to send`);
          console.warn('❌ Failed emails:', emailResults.errors);
        }
      } else {
        console.log('📧 No recipients found to send announcement notifications to');
      }
    } catch (emailError) {
      console.error('❌ Error sending announcement notification emails:', emailError.message);
      console.error('❌ Email error stack:', emailError.stack);
      // Don't throw the error - announcement creation was successful, email failure is non-critical
    }

    return announcement;
  } catch (error) {
    // Abort transaction on error
    await session.abortTransaction();

    console.error("Error in createAnnouncementService:", error);
    throw new Error(`Failed to create announcement: ${error.message}`);
  } finally {
    // End session
    session.endSession();
  }
};

// Update an announcement
const updateAnnouncementService = async (announcementId, updateData) => {
  try {
    const announcement = await Announcement.findOneAndUpdate(
      { announcementId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!announcement) {
      throw new Error("Announcement not found");
    }

    return announcement;
  } catch (error) {
    console.error("Error in updateAnnouncementService:", error);
    throw new Error(`Failed to update announcement: ${error.message}`);
  }
};

// Delete an announcement
const deleteAnnouncementService = async (announcementId) => {
  try {
    const announcement = await Announcement.findOneAndDelete({
      announcementId,
    });

    if (!announcement) {
      throw new Error("Announcement not found");
    }

    return announcement;
  } catch (error) {
    console.error("Error in deleteAnnouncementService:", error);
    throw new Error(`Failed to delete announcement: ${error.message}`);
  }
};

module.exports = {
  getAllAnnouncementsService,
  getAnnouncementByIdService,
  createAnnouncementService,
  updateAnnouncementService,
  deleteAnnouncementService
};
