/**
 * Check Environment Variables for AWS EMA
 * Shows what's configured and what's missing
 */

console.log('🔍 Environment Variables Check');
console.log('=============================\n');

// Check critical AWS variables
const requiredVars = [
  { name: 'AWS_ACCESS_KEY_ID', required: true },
  { name: 'AWS_SECRET_ACCESS_KEY', required: true },
  { name: 'AWS_S3_BUCKET', required: true },
  { name: 'AWS_REGION', required: false, default: 'us-east-1' },
  { name: 'AWS_CLOUDFRONT_DOMAIN', required: false, description: 'CloudFront CDN domain' },
  { name: 'CLOUDFRONT_DISTRIBUTION_ID', required: false, description: 'CloudFront distribution ID' },
  { name: 'EMA_ENABLED', required: false, default: 'true' },
  { name: 'EDGE_CACHE_TTL', required: false, default: '31536000' },
  { name: 'WEBP_QUALITY', required: false, default: '80' }
];

let allConfigured = true;
let missingRequired = [];

console.log('📋 Checking Required Variables:');
requiredVars.forEach(v => {
  const value = process.env[v.name];
  const status = value ? '✅' : '❌';
  const displayValue = value ? `${value.substring(0, 10)}...` : 'NOT SET';
  
  console.log(`  ${status} ${v.name}: ${displayValue}`);
  
  if (v.required && !value) {
    allConfigured = false;
    missingRequired.push(v.name);
  }
});

console.log('\n🎯 Configuration Summary:');
if (allConfigured) {
  console.log('✅ All required environment variables are configured');
  console.log('✅ AWS EMA should work correctly');
} else {
  console.log(`❌ Missing required variables: ${missingRequired.join(', ')}`);
  console.log('💡 Update your .env file with these values');
}

console.log('\n🔧 Issues Found in Your Logs:');
console.log('❌ "req.files: undefined" - Means multer not receiving files');
console.log('❌ Direct S3 URLs instead of CloudFront - Means CLOUDFRONT_DOMAIN not set');

console.log('\n💡 Solutions:');
console.log('1. For "req.files: undefined": Check multer configuration');
console.log('2. For S3 URLs: Set AWS_CLOUDFRONT_DOMAIN in .env');

console.log('\n📝 Example .env Configuration:');
console.log('# AWS Configuration');
console.log('AWS_ACCESS_KEY_ID=your_actual_key_here');
console.log('AWS_SECRET_ACCESS_KEY=your_actual_secret_here');
console.log('AWS_S3_BUCKET=your-bucket-name');
console.log('');
console.log('# CloudFront CDN Configuration');
console.log('AWS_CLOUDFRONT_DOMAIN=your-domain.cloudfront.net');
console.log('CLOUDFRONT_DISTRIBUTION_ID=E1234567890ABC');
console.log('');
console.log('# EMA Settings');
console.log('EMA_ENABLED=true');
console.log('EDGE_CACHE_TTL=31536000');
console.log('WEBP_QUALITY=80');

console.log('\n🚀 Next Steps:');
console.log('1. Update .env with CloudFront domain');
console.log('2. Restart server: npm start');
console.log('3. Test image upload in admin panel');
console.log('4. Check if URLs are CloudFront domain URLs');

if (missingRequired.length > 0) {
  console.log('\n❌ ACTION REQUIRED: Update .env file');
} else {
  console.log('\n✅ ACTION: Test image upload functionality');
}
