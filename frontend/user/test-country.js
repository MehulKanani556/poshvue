// Test script to verify country API functionality
import client from './src/api/client.js';

async function testCountryAPI() {
  try {
    console.log('Testing country API...');
    
    // Test 1: Get active countries
    console.log('\n1. Testing GET /country/active');
    const activeRes = await client.get('/country/active');
    console.log('Active countries:', activeRes.data.items.length);
    
    if (activeRes.data.items.length > 0) {
      const firstCountry = activeRes.data.items[0];
      console.log('First country:', firstCountry.name, firstCountry._id);
      
      // Test 2: Set default country
      console.log('\n2. Testing POST /country/set-default');
      const setDefaultRes = await client.post('/country/set-default', {
        countryId: firstCountry._id
      });
      console.log('Set default response:', setDefaultRes.data);
      
      // Test 3: Get default country
      console.log('\n3. Testing GET /country/default');
      const defaultRes = await client.get('/country/default');
      console.log('Default country:', defaultRes.data.item.name);
    }
    
  } catch (error) {
    console.error('Test failed:', error.response?.data || error.message);
  }
}

testCountryAPI();
