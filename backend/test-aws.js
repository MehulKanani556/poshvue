require('dotenv').config();
const { uploadBase64Image } = require('./utils/awsUpload');

async function testAWSUpload() {
  try {
    console.log('Testing AWS S3 upload...');
    
    // Check if AWS credentials are set
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_S3_BUCKET) {
      console.error('❌ AWS credentials not configured. Please set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_S3_BUCKET in your .env file');
      return;
    }
    
    console.log('✅ AWS credentials found');
    
    // Test with a simple base64 image (1x1 red pixel)
    const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    
    const result = await uploadBase64Image(testImage, 'test');
    console.log('✅ Upload successful:', result);
    
  } catch (error) {
    console.error('❌ Upload failed:', error.message);
  }
}

testAWSUpload();
