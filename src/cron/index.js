import cron from "node-cron";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import Member from "../models/Member.model.js";
import {
  sendExpiryEmail,
  sendPendingMembershipPaymentReminder,
  sendMembershipExpiryReminder,
  sendMembershipCancellationEmail,
} from "../utils/emailService.js";
import { createMemberStatusNotificationService, createMembershipNotificationService } from "../services/notification.service.js";

// Extend dayjs with UTC plugin
dayjs.extend(utc);

// Utility function to track and send reminder emails
const sendReminderSequence = async (member) => {
  try {
    // Increment reminder count
    member.paymentReminderCount = (member.paymentReminderCount || 0) + 1;

    // Determine reminder message based on count
    let reminderMessage = "";
    switch (member.paymentReminderCount) {
      case 1:
        reminderMessage = "First reminder: Your membership payment is pending.";
        break;
      case 2:
        reminderMessage =
          "Second reminder: Urgent - Complete your payment to activate membership.";
        break;
      case 3:
        reminderMessage =
          "Final reminder: Your membership activation is at risk.";
        break;
      default:
        reminderMessage = "Urgent payment required to maintain membership.";
    }

    // Send reminder email
    await sendPendingMembershipPaymentReminder(member, {
      additionalMessage: reminderMessage,
    });

    // Save updated member with reminder count
    await member.save();

    console.log(
      `📧 Reminder #${member.paymentReminderCount} sent to ${member.fullName}`
    );
    return member.paymentReminderCount;
  } catch (error) {
    console.error(`❌ Failed to send reminder to ${member.fullName}:`, error);
    throw error;
  }
};

export const checkMemberStatusNotifications = async () => {
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

// Function to handle expired membership notifications and emails
export const handleExpiredMemberships = async () => {
  try {
    console.log("🔍 Checking for expired memberships...");
    const today = dayjs.utc().startOf("day");

    // Find members whose membership has expired (current date > endDate)
    const expiredMembers = await Member.find({
      memberStatus: "active",
      endDate: { $lt: today.toDate() }  // Changed to $lt to check if endDate is before today
    });

    console.log(`📊 Found ${expiredMembers.length} expired memberships`);

    for (const member of expiredMembers) {
      try {
        console.log(`📝 Processing expired member: ${member.fullName} (ID: ${member._id})`);
        console.log(`📅 Member's end date: ${member.endDate}, Today: ${today.format('YYYY-MM-DD')}`);

        // 1. Send expiry email to member
        await sendExpiryEmail(member.email, member.fullName, member);
        console.log(`📧 Expiry email sent to ${member.fullName}`);

        // 2. Create notification for expired member
        await createMemberStatusNotificationService(
          member,
          "MEMBERSHIP_EXPIRED"
        );
        console.log(`🔔 Created expiry notification for ${member.fullName}`);

        // 3. Update member status
        member.memberStatus = "expired";
        member.expiryDate = today.toDate();
        await member.save();
        console.log(`✅ Updated status to expired for ${member.fullName}`);

      } catch (error) {
        console.error(`❌ Error processing expired member ${member.fullName}:`, error);
      }
    }

    console.log("✅ Expired membership check completed");
  } catch (error) {
    console.error("❌ Error in handleExpiredMemberships:", error);
  }
};

export const startAllCronJobs = () => {
  // Explicitly set timezone to UTC
  process.env.TZ = "UTC";

  // Use environment variables for cron schedules with fallback to default
  const DAILY_CRON_SCHEDULE = process.env.CRON_DAILY_SCHEDULE || "0 0 * * *";

  // Log the cron schedule
  console.log(`🕰️ CRON_DAILY_SCHEDULE: ${DAILY_CRON_SCHEDULE}`);
  console.log(`🌍 Current Timezone: ${process.env.TZ}`);

  // ⏰ Runs every day at midnight UTC (configurable via env)
  cron.schedule(DAILY_CRON_SCHEDULE, async () => {
    console.log("📅 Running daily cron job for membership checks (UTC)");

    try {
      const today = dayjs.utc().startOf("day");

      // 1. Members whose membership expires today
      const expiringToday = await Member.find({
        membershipExpiry: { $lte: today.toDate() },
        status: "active",
      });

      console.log(
        `🔍 Found ${expiringToday.length} members expiring today (UTC)`
      );

      for (const member of expiringToday) {
        try {
          // Send email to member
          await sendExpiryEmail(member.email, member.name);
          
          // Update member status
          member.status = "expired";
          await member.save();

          // Create notification for admin
          await createMembershipNotificationService(member, "MEMBERSHIP_EXPIRED");

          console.log(
            `🔔 Membership expired for ${member.name} (${member.email}) (UTC)`
          );
        } catch (error) {
          console.error(`❌ Error processing expired member ${member.name}:`, error);
        }
      }
    } catch (err) {
      console.error("❌ Membership Expiry Cron Job Error:", err.message);
    }
  });

  // ⏰ Pending Membership Reminder Sequence Job
  cron.schedule(DAILY_CRON_SCHEDULE, async () => {
    console.log(
      "📅 Running daily cron job for pending membership payment reminders (UTC)"
    );

    try {
      const today = dayjs.utc();
      const sevenDaysFromNow = today.add(7, "day");

      // Find members with:
      // 1. Status: pending
      // 2. Start date within next 7 days
      const pendingMembers = await Member.find({
        memberStatus: "pending",
        startDate: {
          $gte: today.toDate(),
          $lte: sevenDaysFromNow.toDate(),
        },
      });

      console.log(
        `🔍 Found ${pendingMembers.length} pending members within 7 days of start (UTC)`
      );

      // Reminder Sequence Logic
      for (const member of pendingMembers) {
        try {
          // Calculate days until membership start
          const daysUntilStart = dayjs.utc(member.startDate).diff(today, "day");

          console.log(
            `📋 Processing member ${member.fullName} (${daysUntilStart} days until start) (UTC)`
          );

          // Reminder sending strategy
          if (daysUntilStart <= 7 && daysUntilStart > 5) {
            // First reminder (7-6 days before start)
            if (
              !member.paymentReminderCount ||
              member.paymentReminderCount < 1
            ) {
              console.log(
                `📧 Sending first reminder to ${member.fullName} (UTC)`
              );
              await sendReminderSequence(member);
            }
          } else if (daysUntilStart <= 5 && daysUntilStart > 3) {
            // Second reminder (5-4 days before start)
            if (
              !member.paymentReminderCount ||
              member.paymentReminderCount < 2
            ) {
              console.log(
                `📧 Sending second reminder to ${member.fullName} (UTC)`
              );
              await sendReminderSequence(member);
            }
          } else if (daysUntilStart <= 3 && daysUntilStart >= 0) {
            // Final reminder (3-0 days before start)
            if (
              !member.paymentReminderCount ||
              member.paymentReminderCount < 3
            ) {
              console.log(
                `📧 Sending final reminder to ${member.fullName} (UTC)`
              );
              await sendReminderSequence(member);
            }
          }

          // Optional: Cancel membership if no payment after final reminder
          if (member.paymentReminderCount >= 3 && daysUntilStart === 0) {
            console.log(
              `❌ Cancelling membership for ${member.fullName} due to non-payment (UTC)`
            );
            member.memberStatus = "cancelled";
            member.cancellationReason = "Non-payment of membership fees";
            await member.save();

            // Send cancellation email
            try {
              await sendMembershipCancellationEmail({
                email: member.email,
                fullName: member.fullName,
                memberId: member.memberId,
                membershipType: member.membershipType,
                cancellationReason: "Non-payment of membership fees",
              });
              console.log(`📧 Cancellation email sent to ${member.fullName}`);
            } catch (emailError) {
              console.error(
                `❌ Failed to send cancellation email to ${member.fullName}:`,
                emailError
              );
            }
          }
        } catch (memberError) {
          console.error(
            `❌ Error processing member ${member.fullName}:`,
            memberError
          );
        }
      }

      console.log(
        `📊 Processed payment reminders for ${pendingMembers.length} members (UTC)`
      );
    } catch (err) {
      console.error(
        "❌ Pending Membership Payment Reminder Cron Job Error:",
        err.message
      );
    }
  });

  // New Cron Job for Membership Expiry Reminders
  cron.schedule(DAILY_CRON_SCHEDULE, async () => {
    console.log(
      "📅 Running daily cron job for membership expiry reminders (UTC)"
    );

    try {
      const today = dayjs.utc();
      const tenDaysFromNow = today.add(10, "day");

      // Find members with:
      // 1. Status: active
      // 2. Expiry date within next 10 days
      const expiringMembers = await Member.find({
        status: "active",
        membershipExpiry: {
          $gte: today.toDate(),
          $lte: tenDaysFromNow.toDate(),
        },
      });

      console.log(
        `🔍 Found ${expiringMembers.length} members expiring within 10 days (UTC)`
      );

      // Expiry Reminder Sequence Logic
      for (const member of expiringMembers) {
        try {
          // Calculate days until membership expiry
          const daysUntilExpiry = dayjs
            .utc(member.membershipExpiry)
            .diff(today, "day");

          console.log(
            `📋 Processing expiring member ${member.fullName} (${daysUntilExpiry} days until expiry) (UTC)`
          );

          // Reminder sending strategy with updated messaging
          if (daysUntilExpiry <= 10 && daysUntilExpiry > 5) {
            // First reminder (10-5 days before expiry)
            if (!member.expiryReminderCount || member.expiryReminderCount < 1) {
              console.log(
                `📧 Sending first expiry reminder to ${member.fullName} (10-5 days) (UTC)`
              );
              await sendMembershipExpiryReminder({
                ...member.toObject(),
                reminderType: "FIRST_REMINDER",
                message: `Your membership will expire in ${daysUntilExpiry} days. Please renew to continue accessing our services.`,
              });
              member.expiryReminderCount = 1;
              await member.save();
            }
          } else if (daysUntilExpiry <= 5 && daysUntilExpiry > 0) {
            // Second reminder (5-1 days before expiry)
            if (!member.expiryReminderCount || member.expiryReminderCount < 2) {
              console.log(
                `📧 Sending second expiry reminder to ${member.fullName} (5-1 days) (UTC)`
              );
              await sendMembershipExpiryReminder({
                ...member.toObject(),
                reminderType: "SECOND_REMINDER",
                message: `Your membership will expire in ${daysUntilExpiry} days. After expiration, your membership will be inactivated until renewal.`,
              });
              member.expiryReminderCount = 2;
              await member.save();
            }
          } else if (daysUntilExpiry === 0) {
            // Final reminder on expiry day
            console.log(
              `📧 Sending final expiry reminder to ${member.fullName} (Expiry Day) (UTC)`
            );
            await sendMembershipExpiryReminder({
              ...member.toObject(),
              reminderType: "FINAL_REMINDER",
              message:
                "Your membership has been inactivated. Your account is now inactive until renewal.",
            });

            // Update member status to inactive
            member.status = "inactive";
            member.expiryReminderCount = 3;
            await member.save();
          } else if (daysUntilExpiry === 1) {
            // Last reminder 1 day before expiry
            console.log(
              `📧 Sending last expiry reminder to ${member.fullName} (1 day before expiry) (UTC)`
            );
            await sendMembershipExpiryReminder({
              ...member.toObject(),
              reminderType: "LAST_REMINDER",
              message:
                "Your membership expires tomorrow. This is your final chance to renew and maintain uninterrupted access.",
            });

            // Optional: Increment expiry reminder count if needed
            member.expiryReminderCount = Math.max(
              member.expiryReminderCount || 0,
              3
            );
            await member.save();
          }
        } catch (memberError) {
          console.error(
            `❌ Error processing expiring member ${member.fullName}:`,
            memberError
          );
        }
      }

      console.log(
        `📊 Processed expiry reminders for ${expiringMembers.length} members (UTC)`
      );
    } catch (err) {
      console.error(
        "❌ Membership Expiry Reminder Cron Job Error:",
        err.message
      );
    }
  });

  // New Cron Job for Member Status Notifications
  cron.schedule(DAILY_CRON_SCHEDULE, checkMemberStatusNotifications);

  // Add expired membership check to daily cron
  cron.schedule(DAILY_CRON_SCHEDULE, async () => {
    console.log("📅 Running daily cron job for expired memberships (UTC)");
    await handleExpiredMemberships();
  });

  console.log("✅ All cron jobs scheduled");
};

export const triggerMembershipExpiryReminders = async () => {
  console.log("🔍 Manually triggering membership expiry reminders");

  try {
    const today = dayjs();
    const tenDaysFromNow = today.add(10, "day");

    const expiringMembers = await Member.find({
      status: "active",
      membershipExpiry: {
        $gte: today.toDate(),
        $lte: tenDaysFromNow.toDate(),
      },
    });

    console.log(
      `🔍 Found ${expiringMembers.length} members expiring within 10 days (UTC)`
    );

    for (const member of expiringMembers) {
      try {
        console.log(`📝 Processing expiring member: ${member.fullName} (ID: ${member._id})`);
        console.log(`📅 Member's end date: ${member.endDate}`);
        
        // Calculate days until expiry
        const daysUntilExpiry = Math.ceil((new Date(member.endDate) - today.toDate()) / (1000 * 60 * 60 * 24));
        
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

    console.log("✅ Expired membership check completed");
  } catch (error) {
    console.error("❌ Error in triggerMembershipExpiryReminders:", error);
  }
};

// For testing
// checkMemberStatusNotifications()
// triggerMembershipExpiryReminders()
// handleExpiredMemberships()