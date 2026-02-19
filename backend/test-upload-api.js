const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Create a simple test image buffer (1x1 red pixel)
const testImageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');

async function testUploadAPI() {
  try {
    console.log('Testing upload API endpoint...');
    
    const form = new FormData();
    form.append('images', testImageBuffer, {
      filename: 'test.png',
      contentType: 'image/png'
    });
    form.append('product', '507f1f77bcf86cd799439011'); // dummy product ID
    form.append('rating', '5');
    form.append('comment', 'Test review with image');
    
    const response = await fetch('http://localhost:5000/api/content/reviews', {
      method: 'POST',
      headers: {
        ...form.getHeaders(),
        'Authorization': 'Bearer dummy_token' // You'll need a real token
      },
      body: form
    });
    
    const result = await response.json();
    console.log('Response status:', response.status);
    console.log('Response:', result);
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

// Note: This requires 'form-data' and 'node-fetch' packages
console.log('To test the API endpoint:');
console.log('1. Install required packages: npm install form-data node-fetch@2');
console.log('2. Get a valid JWT token from your auth endpoint');
console.log('3. Run: node test-upload-api.js');
