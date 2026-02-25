/**
 * Test Script to Verify S3 Deletion Function
 * Run: node test-delete-function.js
 */

require('dotenv').config();
const { deleteImageFromS3, deleteMultipleImagesFromS3, extractS3Key } = require('./utils/awsUpload');

// Test URLs - Replace these with actual URLs from your products
const TEST_URLS = [
  // Format 1: S3 Direct URL with CloudFront
  'https://poshvue-images-2026.s3.eu-north-1.amazonaws.com/products/test-image-1.webp',
  // Format 2: With cache busting
  'https://poshvue-images-2026.s3.eu-north-1.amazonaws.com/products/test-image-2.webp?v=1234567890',
  // Format 3: CloudFront domain (if configured)
  'https://d123456789.cloudfront.net/products/test-image-3.webp',
];

async function testKeyExtraction() {
  console.log('\n═══════════════════════════════════════════');
  console.log('   🔍 Testing S3 Key Extraction');
  console.log('═══════════════════════════════════════════\n');

  for (const url of TEST_URLS) {
    console.log(`URL: ${url}`);
    const key = extractS3Key(url);
    console.log(`Key: ${key}\n`);
  }
}

async function testSingleDeletion() {
  console.log('\n═══════════════════════════════════════════');
  console.log('   🗑️  Testing Single Image Deletion');
  console.log('═══════════════════════════════════════════\n');

  // Use a test URL (won't exist but we can see if extraction works)
  const testUrl = 'https://poshvue-images-2026.s3.eu-north-1.amazonaws.com/products/test-delete-me-1.webp';
  
  console.log(`Testing deletion of: ${testUrl}\n`);
  const result = await deleteImageFromS3(testUrl);
  
  console.log('\nResult:', result);
}

async function testMultipleDeletion() {
  console.log('\n═══════════════════════════════════════════');
  console.log('   🗑️  Testing Multiple Image Deletion');
  console.log('═══════════════════════════════════════════\n');

  const testUrls = [
    'https://poshvue-images-2026.s3.eu-north-1.amazonaws.com/products/test-delete-me-2.webp',
    'https://poshvue-images-2026.s3.eu-north-1.amazonaws.com/products/test-delete-me-3.webp',
    'https://poshvue-images-2026.s3.eu-north-1.amazonaws.com/products/test-delete-me-4.webp',
  ];

  console.log(`Testing deletion of ${testUrls.length} images:\n`);
  testUrls.forEach((url, i) => {
    console.log(`  ${i + 1}. ${url}`);
  });

  const result = await deleteMultipleImagesFromS3(testUrls);
  
  console.log('\nDeletion Summary:');
  console.log(result);
}

async function testWithRealProduct() {
  console.log('\n═══════════════════════════════════════════');
  console.log('   📦 Testing with Real Product Images');
  console.log('═══════════════════════════════════════════\n');

  const { Product } = require('./model');

  try {
    // Find first product with images
    const product = await Product.findOne({ images: { $exists: true, $ne: [] } });
    
    if (!product) {
      console.log('❌ No products with images found in database');
      return;
    }

    console.log(`Found product: ${product.name}`);
    console.log(`Images count: ${product.images.length}`);
    console.log('\nImages:');
    product.images.forEach((img, i) => {
      console.log(`  ${i + 1}. ${img}`);
      const key = extractS3Key(img);
      console.log(`     Key: ${key}`);
    });

    console.log('\n⚠️  Note: Not deleting real product images to prevent data loss');
    console.log('If you want to test deletion, uncomment the code below\n');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

async function runAllTests() {
  console.log('\n\n');
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║         S3 DELETION SYSTEM - COMPREHENSIVE TEST            ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');

  try {
    await testKeyExtraction();
    await testSingleDeletion();
    await testMultipleDeletion();
    await testWithRealProduct();

    console.log('\n═══════════════════════════════════════════');
    console.log('   ✅ All Tests Complete');
    console.log('═══════════════════════════════════════════\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test Error:', error);
    process.exit(1);
  }
}

// Run tests
runAllTests();
