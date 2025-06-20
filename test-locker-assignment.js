const axios = require('axios');

// Test locker assignment
async function testLockerAssignment() {
  try {
    console.log('Testing locker assignment...');
    
    // First, let's search for a member
    const searchResponse = await axios.get('http://localhost:3000/api/members/search?q=test', {
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'token=your-test-token-here' // You'll need to replace this with a valid token
      }
    });
    
    console.log('Search response:', searchResponse.data);
    
    if (searchResponse.data.success && searchResponse.data.data.length > 0) {
      const member = searchResponse.data.data[0];
      console.log('Found member:', member);
      
      // Now try to assign a locker
      const lockerResponse = await axios.post(`http://localhost:3000/api/members/${member.memberId}/assign-locker`, {
        lockerNumber: 'TEST001',
        paymentAmount: 100,
        paymentMethod: 'cash'
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Cookie': 'token=your-test-token-here' // You'll need to replace this with a valid token
        }
      });
      
      console.log('Locker assignment response:', lockerResponse.data);
    }
  } catch (error) {
    console.error('Error testing locker assignment:', error.response?.data || error.message);
  }
}

// Run the test
testLockerAssignment();