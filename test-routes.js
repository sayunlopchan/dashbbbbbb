const axios = require('axios');

// Test the routes
async function testRoutes() {
  const baseURL = 'http://localhost:4000';
  
  try {
    console.log('Testing routes...');
    
    // Test 1: Get lockers route
    console.log('\n1. Testing /api/members/lockers route...');
    try {
      const lockersResponse = await axios.get(`${baseURL}/api/members/lockers`, {
        headers: {
          'Accept': 'application/json'
        }
      });
      console.log('✅ Lockers route works:', lockersResponse.status);
    } catch (error) {
      console.log('❌ Lockers route failed:', error.response?.status, error.response?.data?.message);
    }
    
    // Test 2: Search members route
    console.log('\n2. Testing /api/members/search route...');
    try {
      const searchResponse = await axios.get(`${baseURL}/api/members/search?q=test`, {
        headers: {
          'Accept': 'application/json'
        }
      });
      console.log('✅ Search route works:', searchResponse.status);
    } catch (error) {
      console.log('❌ Search route failed:', error.response?.status, error.response?.data?.message);
    }
    
    // Test 3: Get specific member route
    console.log('\n3. Testing /api/members/:memberId route...');
    try {
      const memberResponse = await axios.get(`${baseURL}/api/members/KB-M01`, {
        headers: {
          'Accept': 'application/json'
        }
      });
      console.log('✅ Member route works:', memberResponse.status);
    } catch (error) {
      console.log('❌ Member route failed:', error.response?.status, error.response?.data?.message);
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

// Run the test
testRoutes(); 