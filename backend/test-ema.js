/**
 * EMA Cache Testing Script
 * This script tests if EMA caching is working correctly
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = process.env.TEST_URL || 'http://localhost:5000';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'your-admin-token-here';

// Test results storage
const testResults = {
  passed: 0,
  failed: 0,
  details: []
};

/**
 * Helper function to log test results
 */
function logTest(testName, passed, details = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} ${testName}`);
  if (details) {
    console.log(`   ${details}`);
  }
  
  testResults.details.push({
    test: testName,
    passed,
    details
  });
  
  if (passed) {
    testResults.passed++;
  } else {
    testResults.failed++;
  }
}

/**
 * Test 1: Check EMA Status Endpoint
 */
async function testEMAStatus() {
  try {
    const response = await axios.get(`${BASE_URL}/upload/ema/status`, {
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`
      }
    });
    
    const data = response.data;
    const emaEnabled = data.data?.ema?.enabled;
    
    logTest(
      'EMA Status Endpoint',
      response.status === 200 && emaEnabled,
      `Status: ${response.status}, EMA Enabled: ${emaEnabled}`
    );
    
    return response.data;
  } catch (error) {
    logTest('EMA Status Endpoint', false, `Error: ${error.message}`);
    return null;
  }
}

/**
 * Test 2: Check EMA Cache Headers
 */
async function testCacheHeaders() {
  try {
    // Test with a sample image URL
    const testImageUrl = `${BASE_URL}/catalog/products`;
    const response = await axios.get(testImageUrl);
    
    const headers = response.headers;
    const hasCacheControl = headers['cache-control'];
    const hasEMAHeaders = headers['x-ema-cache'] || headers['x-edge-cache-ttl'];
    
    logTest(
      'EMA Cache Headers',
      hasCacheControl && hasEMAHeaders,
      `Cache-Control: ${hasCacheControl}, EMA Headers: ${!!hasEMAHeaders}`
    );
    
    return headers;
  } catch (error) {
    logTest('EMA Cache Headers', false, `Error: ${error.message}`);
    return null;
  }
}

/**
 * Test 3: Test Image Upload with CDN URL
 */
async function testImageUpload() {
  try {
    // Create a test image buffer (1x1 pixel PNG)
    const testImageBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
      0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,
      0x54, 0x08, 0x99, 0x01, 0x01, 0x01, 0x00, 0x00,
      0xFE, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01,
      0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44,
      0xAE, 0x42, 0x60, 0x82
    ]);
    
    const formData = new FormData();
    formData.append('image', new Blob([testImageBuffer]), 'test.png');
    
    const response = await axios.post(`${BASE_URL}/upload/category-image`, formData, {
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
        'Content-Type': 'multipart/form-data'
      }
    });
    
    const uploadData = response.data;
    const hasCDNUrl = uploadData.url && (uploadData.url.includes('cloudfront') || uploadData.url.includes('s3'));
    const hasCacheBusting = uploadData.url && uploadData.url.includes('?v=');
    
    logTest(
      'Image Upload with CDN URL',
      response.status === 200 && hasCDNUrl && hasCacheBusting,
      `URL: ${uploadData.url}, CDN: ${hasCDNUrl}, Cache Busting: ${hasCacheBusting}`
    );
    
    return uploadData.url;
  } catch (error) {
    logTest('Image Upload with CDN URL', false, `Error: ${error.message}`);
    return null;
  }
}

/**
 * Test 4: Test Cache Invalidation
 */
async function testCacheInvalidation() {
  try {
    const response = await axios.post(`${BASE_URL}/upload/ema/invalidate-all`, {}, {
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    const hasInvalidationId = response.data.data?.invalidationId;
    const hasStatus = response.data.data?.status;
    
    logTest(
      'Cache Invalidation',
      response.status === 200 && hasInvalidationId,
      `Invalidation ID: ${hasInvalidationId}, Status: ${hasStatus}`
    );
    
    return response.data;
  } catch (error) {
    logTest('Cache Invalidation', false, `Error: ${error.message}`);
    return null;
  }
}

/**
 * Test 5: Test Cache Statistics
 */
async function testCacheStats() {
  try {
    const response = await axios.get(`${BASE_URL}/upload/ema/stats`, {
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`
      }
    });
    
    const hasCacheHitRatio = response.data.data?.cacheHitRatio;
    const hasEdgeLocations = response.data.data?.edgeLocations;
    
    logTest(
      'Cache Statistics',
      response.status === 200 && hasCacheHitRatio,
      `Cache Hit Ratio: ${hasCacheHitRatio}, Edge Locations: ${hasEdgeLocations}`
    );
    
    return response.data;
  } catch (error) {
    logTest('Cache Statistics', false, `Error: ${error.message}`);
    return null;
  }
}

/**
 * Test 6: Test Environment Variables
 */
function testEnvironmentVariables() {
  const requiredVars = [
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'AWS_S3_BUCKET',
    'EMA_ENABLED',
    'EDGE_CACHE_TTL'
  ];
  
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  const allVarsPresent = missingVars.length === 0;
  
  logTest(
    'Environment Variables',
    allVarsPresent,
    missingVars.length > 0 ? `Missing: ${missingVars.join(', ')}` : 'All required variables present'
  );
  
  return allVarsPresent;
}

/**
 * Test 7: Test File Structure
 */
function testFileStructure() {
  const requiredFiles = [
    'utils/awsUpload.js',
    'utils/cloudfrontConfig.js',
    'middleware/emaCache.js',
    'controller/emaController.js',
    'routes/upload.js'
  ];
  
  const missingFiles = requiredFiles.filter(filePath => !fs.existsSync(filePath));
  const allFilesPresent = missingFiles.length === 0;
  
  logTest(
    'File Structure',
    allFilesPresent,
    missingFiles.length > 0 ? `Missing: ${missingFiles.join(', ')}` : 'All required files present'
  );
  
  return allFilesPresent;
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('🧪 EMA Cache Testing Suite');
  console.log('=============================\n');
  
  console.log('📋 Running Tests...\n');
  
  // Run all tests
  testEnvironmentVariables();
  testFileStructure();
  await testEMAStatus();
  await testCacheHeaders();
  await testImageUpload();
  await testCacheInvalidation();
  await testCacheStats();
  
  // Print summary
  console.log('\n📊 Test Results Summary');
  console.log('=======================');
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📈 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);
  
  // Print detailed results
  console.log('\n📝 Detailed Results:');
  console.log('===================');
  testResults.details.forEach(result => {
    const status = result.passed ? '✅' : '❌';
    console.log(`${status} ${result.test}`);
    if (result.details) {
      console.log(`   ${result.details}`);
    }
  });
  
  // Recommendations
  console.log('\n💡 Recommendations:');
  console.log('==================');
  
  if (testResults.failed > 0) {
    console.log('❌ Some tests failed. Please check:');
    console.log('   - Environment variables are set correctly');
    console.log('   - Server is running and accessible');
    console.log('   - AWS credentials are valid');
    console.log('   - Admin token is correct');
  } else {
    console.log('🎉 All tests passed! EMA caching is working correctly.');
    console.log('   - Images will be served from CloudFront CDN');
    console.log('   - Cache headers are properly set');
    console.log('   - Cache invalidation is functional');
  }
  
  return testResults.failed === 0;
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = {
  runTests,
  testEMAStatus,
  testCacheHeaders,
  testImageUpload,
  testCacheInvalidation,
  testCacheStats,
  testEnvironmentVariables,
  testFileStructure
};
