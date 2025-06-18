const mongoose = require('mongoose');
const Member = require('./src/models/Member.model');
const { sendEventNotificationToAllMembers } = require('./src/utils/emailService');

// Test event data
const testEvent = {
  eventId: 'KB-EVTA001',
  title: 'Test Fitness Workshop',
  organizer: 'John Doe',
  category: 'fitness',
  location: 'Main Gym',
  startTime: new Date('2024-12-25T10:00:00Z'),
  endTime: new Date('2024-12-25T12:00:00Z'),
  description: ['This is a test fitness workshop', 'Come join us for a great workout!'],
  tags: ['fitness', 'workshop', 'test'],
  authorName: 'Test User',
  participantCount: 0
};

async function testEventEmail() {
  try {
    console.log('🧪 Starting event email test...');
    
    // Connect to MongoDB (you'll need to set your connection string)
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/your-database';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Find active members
    const activeMembers = await Member.find({ 
      memberStatus: { $in: ['active', 'expiring'] }
    }).select('fullName email memberStatus');

    console.log(`🔍 Found ${activeMembers.length} active/expiring members`);
    
    if (activeMembers.length === 0) {
      console.log('❌ No active members found. Please create some active members first.');
      return;
    }

    console.log('📧 Members found:');
    activeMembers.forEach(member => {
      console.log(`  - ${member.fullName} (${member.email}) - ${member.memberStatus}`);
    });

    // Test sending emails
    console.log('\n📧 Testing event notification emails...');
    const results = await sendEventNotificationToAllMembers(testEvent, activeMembers);

    console.log('\n📊 Test Results:');
    console.log(`  Total: ${results.total}`);
    console.log(`  Successful: ${results.successful}`);
    console.log(`  Failed: ${results.failed}`);

    if (results.failed > 0) {
      console.log('\n❌ Failed emails:');
      results.errors.forEach(error => {
        console.log(`  - ${error.member} (${error.email}): ${error.error}`);
      });
    }

    console.log('\n✅ Test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the test
testEventEmail(); 