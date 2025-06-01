const cron = require('node-cron');
const memberService = require('../services/member.service');

// Schedule member status updates to run every hour
const scheduleMemberStatusUpdates = () => {
  // Run every hour at minute 0
  cron.schedule('0 * * * *', async () => {
    console.log('Running scheduled member status update...');
    try {
      const updates = await memberService.updateMemberStatusesService();
      console.log('Scheduled member status update completed:', updates);
    } catch (error) {
      console.error('Error in scheduled member status update:', error);
    }
  });

  // Also run immediately when the server starts
  memberService.updateMemberStatusesService()
    .then(updates => console.log('Initial member status update completed:', updates))
    .catch(error => console.error('Error in initial member status update:', error));
};

module.exports = {
  scheduleMemberStatusUpdates
}; 