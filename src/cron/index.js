const cron = require("node-cron");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const Member = require("../models/Member.model");
const {
  sendPendingMembershipPaymentReminder,
  sendMembershipExpiryReminder,
} = require("../utils/emailService");
const { createMemberStatusNotificationService, createMembershipNotificationService } = require("../services/notification.service");
const { updateMemberStatusesService } = require("../services/member.service");

// Extend dayjs with UTC plugin
dayjs.extend(utc);

const checkMemberStatusNotifications = async () => {
  try {
    const today = new Date();
    console.log('🔍 Starting member status notification check at:', today.toISOString());

    // Find members with pending status about to start
    const pendingMembers = await Member.find({
      memberStatus: "pending",
      startDate: { $lte: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000) }, // Within next 7 days
    });

    console.log(`📊 Found ${pendingMembers.length} pending members about to start`);

    for (const member of pendingMembers) {
      try {
        // Create notification for pending member
        await createMemberStatusNotificationService(
          member,
          "MEMBER_START_PENDING"
        );
        
        // Send email to pending member
        await sendPendingMembershipPaymentReminder(member, {
          additionalMessage: "Your membership is about to start. Please complete any remaining steps."
        });
        
        console.log(`✅ Created notification and sent email for pending member ${member.fullName}`);
      } catch (error) {
        console.error(`❌ Error creating notification for pending member ${member.fullName}:`, error);
      }
    }

    // Find members whose start date has passed but haven't paid
    const unpaidMembers = await Member.find({
      memberStatus: "pending",
      startDate: { $lt: today },
      payments: { $size: 0 } // No payments made
    });

    console.log(`📊 Found ${unpaidMembers.length} members who haven't paid after start date`);

    for (const member of unpaidMembers) {
      try {
        console.log(`📝 Processing unpaid member: ${member.fullName} (ID: ${member._id})`);
        console.log(`📅 Member's start date: ${member.startDate}`);
        
        // Calculate days since start date
        const daysSinceStart = Math.ceil((today - new Date(member.startDate)) / (1000 * 60 * 60 * 24));
        
        // Only create cancellation notification if more than 5 days have passed
        if (daysSinceStart >= 5) {
          // Create notification for admin about unpaid member
          const notification = await createMembershipNotificationService(
            member,
            "MEMBERSHIP_PAYMENT_PENDING",
            {
              message: `Member ${member.fullName} (${member.memberId}) hasn't made any payments ${daysSinceStart} days after their start date. Would you like to cancel their membership?`,
              daysSinceStart,
              requiresAction: true
            }
          );
          
          console.log(`✅ Created admin notification for unpaid member ${member.fullName}:`, {
            notificationId: notification._id,
            type: notification.type,
            message: notification.message
          });
        }

        // Send reminder email to member regardless of days passed
        await sendPendingMembershipPaymentReminder(member, {
          additionalMessage: `Your membership was supposed to start ${daysSinceStart} days ago. Please complete your payment to activate your membership.`
        });

        console.log(`📧 Payment Reminder Email sent to ${member.fullName}`);
      } catch (error) {
        console.error(`❌ Error processing unpaid member ${member.fullName}:`, error);
      }
    }

    // Find members whose membership is about to expire
    const expiringMembers = await Member.find({
      memberStatus: "active",
      endDate: {
        $lte: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000), // Within next 14 days
        $gt: today,
      },
    });

    console.log(`📊 Found ${expiringMembers.length} members about to expire`);

    for (const member of expiringMembers) {
      try {
        console.log(`📝 Processing expiring member: ${member.fullName} (ID: ${member._id})`);
        console.log(`📅 Member's end date: ${member.endDate}`);
        
        // Calculate days until expiry
        const daysUntilExpiry = Math.ceil((new Date(member.endDate) - today) / (1000 * 60 * 60 * 24));
        
        // Create notification for expiring member
        const notification = await createMemberStatusNotificationService(
          member,
          "MEMBERSHIP_EXPIRING"
        );
        console.log(`✅ Created notification for ${member.fullName}:`, {
          notificationId: notification._id,
          type: notification.type,
          message: notification.message
        });

        // Send expiry reminder email
        await sendMembershipExpiryReminder({
          ...member.toObject(),
          reminderType: "EXPIRING_SOON",
          message: `Your membership is expiring soon. Please renew to maintain uninterrupted access.`,
          expiryDate: member.endDate,
          daysUntilExpiry: daysUntilExpiry
        });

        console.log(`📧 Expiry Reminder Email sent to ${member.fullName}`);
      } catch (error) {
        console.error(`❌ Error processing member ${member.fullName}:`, error);
      }
    }

    console.log("✅ Member status notification and email check completed");
  } catch (error) {
    console.error("❌ Error in checkMemberStatusNotifications:", error);
  }
};

const startAllCronJobs = () => {
  // Explicitly set timezone to UTC
  process.env.TZ = "UTC";

  // Use environment variables for cron schedules with fallback to default
  const DAILY_CRON_SCHEDULE = process.env.CRON_DAILY_SCHEDULE || "0 0 * * *";
  const HOURLY_CRON_SCHEDULE = "0 * * * *"; // Run every hour

  // Log the cron schedules
  console.log(`🕰️ CRON_DAILY_SCHEDULE: ${DAILY_CRON_SCHEDULE}`);
  console.log(`🕰️ HOURLY_CRON_SCHEDULE: ${HOURLY_CRON_SCHEDULE}`);
  console.log(`🌍 Current Timezone: ${process.env.TZ}`);

  // ⏰ Runs every hour to update member statuses
  cron.schedule(HOURLY_CRON_SCHEDULE, async () => {
    try {
      console.log("🕒 Running hourly member status updates...");
      const updates = await updateMemberStatusesService();
      console.log(`✅ Hourly member status updates completed. Updated ${updates.length} members.`);
    } catch (error) {
      console.error("❌ Error in hourly member status updates:", error);
    }
  });

  // ⏰ Runs every day at midnight UTC (configurable via env)
  cron.schedule(DAILY_CRON_SCHEDULE, async () => {
    try {
      console.log("🕒 Running daily cron jobs...");
      
      // Run all daily checks
      await checkMemberStatusNotifications();
      
      console.log("✅ Daily cron jobs completed successfully");
    } catch (error) {
      console.error("❌ Error in daily cron jobs:", error);
    }
  });

  // Run initial status update when server starts
  updateMemberStatusesService()
    .then(updates => console.log(`✅ Initial member status update completed. Updated ${updates.length} members.`))
    .catch(error => console.error("❌ Error in initial member status update:", error));
};

// checkMemberStatusNotifications()

module.exports = {
  checkMemberStatusNotifications,
  startAllCronJobs
};