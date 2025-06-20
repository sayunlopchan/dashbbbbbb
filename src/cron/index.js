const cron = require("node-cron");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const Member = require("../models/Member.model");
const {
  sendPendingMembershipPaymentReminder,
} = require("../utils/emailService");
const { createMemberStatusNotificationService, createMembershipNotificationService } = require("../services/notification.service");
const { updateMemberStatusesService } = require("../services/member.service");

// Extend dayjs with UTC plugin
dayjs.extend(utc);

const checkMemberStatusNotifications = async () => {
  try {
    const today = new Date();
    console.log('🔍 Starting member status notification check at:', today.toISOString());

    // Safely parse dates and handle invalid ones
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Find members with pending status about to start
    const pendingMembers = await Member.find({
      memberStatus: "pending",
      startDate: { 
        $lte: tomorrow,
        $ne: null, // Ensure startDate is not null
        $exists: true // Ensure startDate exists
      }
    }).lean(); // Use lean() for better performance

    console.log(`📊 Found ${pendingMembers.length} pending members about to start`);
    
    for (const member of pendingMembers) {
      try {
           if (!member.startDate || isNaN(new Date(member.startDate).getTime())) {
          console.error(`⛔ Invalid startDate for member ${member._id}`);
          continue;
        }
          
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

    console.log("✅ Member status notification and email check completed");
  } catch (error) {
    console.error("❌ Error in checkMemberStatusNotifications:", error);
  }
};

const startAllCronJobs = () => {
    try {
    const DAILY_CRON_SCHEDULE = process.env.CRON_DAILY_SCHEDULE || "0 0 * * *";
    const HOURLY_CRON_SCHEDULE = "0 * * * *";

    console.log(`🕰 CRON_DAILY_SCHEDULE: ${DAILY_CRON_SCHEDULE}`);
    console.log(`🕰 HOURLY_CRON_SCHEDULE: ${HOURLY_CRON_SCHEDULE}`);

    // ⏰ Hourly job with better error handling
    const hourlyJob = cron.schedule(HOURLY_CRON_SCHEDULE, async () => {
      try {
        console.log("🕒 Running hourly member status updates...");
        const updates = await updateMemberStatusesService();
        console.log(`✅ Hourly member status updates completed. Updated ${updates.length} members.`);
      } catch (error) {
        console.error("❌ Error in hourly member status updates:", error);
      }
    }, {
      scheduled: true,
      timezone: "UTC" // Explicitly set timezone
    });

    // ⏰ Daily job with better error handling
    const dailyJob = cron.schedule(DAILY_CRON_SCHEDULE, async () => {
      try {
        console.log("🕒 Running daily cron jobs...");
        await checkMemberStatusNotifications();
        console.log("✅ Daily cron jobs completed successfully");
      } catch (error) {
        console.error("❌ Error in daily cron jobs:", error);
      }
    }, {
      scheduled: true,
      timezone: "UTC" // Explicitly set timezone
    });

    // Handle process exit
    process.on('SIGINT', () => {
      hourlyJob.stop();
      dailyJob.stop();
      process.exit();
    });

  } catch (schedulerError) {
    console.error("❌ Failed to schedule cron jobs:", schedulerError);
  }


  // Initial update with delay to prevent server overload on startup
  setTimeout(async () => {
    try {
      const updates = await updateMemberStatusesService();
      console.log(`✅ Initial member status update completed. Updated ${updates.length} members.`);
    } catch (error) {
      console.error("❌ Error in initial member status update:", error);
    }
  }, 10000); // 10-second delay
  
};

// checkMemberStatusNotifications()

module.exports = {
  checkMemberStatusNotifications,
  startAllCronJobs
};