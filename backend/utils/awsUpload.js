const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const sharp = require('sharp');
const crypto = require('crypto');
const { getEMACacheHeaders } = require('./cloudfrontConfig');

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const S3_BUCKET = process.env.AWS_S3_BUCKET;
const CLOUDFRONT_DOMAIN = process.env.AWS_CLOUDFRONT_DOMAIN; // e.g., d1234567890.cloudfront.net

/**
 * Get CloudFront CDN URL or fallback to S3 URL
 * @param {string} s3Key - S3 object key
 * @returns {string} - CloudFront URL or S3 URL as fallback
 */
function getCdnUrl(s3Key) {
  // Always use CloudFront CDN if configured, fallback to S3 URL
  if (CLOUDFRONT_DOMAIN) {
    return `https://${CLOUDFRONT_DOMAIN}/${s3Key}`;
  }
  
  // Fallback to S3 URL if CloudFront not configured
  let s3Url = `https://${S3_BUCKET}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${s3Key}`;
  
  // Fix: Remove -website from S3 URL if present
  if (s3Url.includes('-website')) {
    console.log('🔧 Removing -website from S3 URL:', s3Url);
    s3Url = s3Url.replace('-website', '');
    console.log('✅ Fixed S3 URL:', s3Url);
  }
  
  return s3Url;
}

// Additional fix for any existing URLs with -website
function fixWebsiteUrl(url) {
  if (typeof url !== 'string') return url;
  
  // Fix S3 URLs with -website
  if (url.includes('s3-website.')) {
    console.log('🔧 Fixing S3-website URL:', url);
    const fixedUrl = url.replace('s3-website.', 's3.');
    console.log('✅ Fixed S3 URL:', fixedUrl);
    return fixedUrl;
  }
  
  return url;
}

/**
 * Convert image buffer to WebP format using Sharp
 * @param {Buffer} buffer - Input image buffer
 * @returns {Promise<Buffer>} - WebP format buffer
 */
async function convertToWebp(buffer) {
  try {
    return await sharp(buffer)
      .webp({ quality: 80 })
      .toBuffer();
  } catch (error) {
    console.error('Error converting to WebP:', error);
    throw new Error('Failed to convert image to WebP format');
  }
}

/**
 * Generate unique filename
 * @param {string} originalName - Original filename
 * @param {string} prefix - Prefix for the filename
 * @returns {string} - Unique filename
 */
function generateFilename(originalName, prefix = 'image') {
  const timestamp = Date.now();
  const random = crypto.randomBytes(4).toString('hex');
  return `${prefix}-${timestamp}-${random}.webp`;
}

/**
 * Upload image to AWS S3 with WebP conversion and CDN caching
 * @param {Buffer} buffer - Image buffer
 * @param {string} filename - Filename for S3
 * @param {string} folder - S3 folder path
 * @returns {Promise<string>} - CDN URL of uploaded image
 */
async function uploadToS3(buffer, filename, folder = 'uploads') {
  try {
    const key = `${folder}/${filename}`;
    console.log(`[AWS UPLOAD] Uploading to S3: bucket=${S3_BUCKET}, key=${key}`);

    // Generate cache-busting query string for EMA (Edge-Memory Acceleration)
    const timestamp = Date.now();
    const cacheKey = `${timestamp}-${crypto.randomBytes(4).toString('hex')}`;
    
    const cacheControl = 'max-age=31536000, immutable'; // 1 year cache, immutable
    console.log(`[AWS UPLOAD] Setting Cache-Control: ${cacheControl}`);

    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: S3_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: 'image/webp',
        CacheControl: cacheControl,
        Metadata: {
          'cache-key': cacheKey,
          'ema-enabled': 'true',
          'cdn-ttl': '31536000', // 1 year TTL for CDN edge caching
          'content-type': 'image/webp'
        },
        // Apply EMA cache headers
        ...getEMACacheHeaders('image/webp')
      },
    });

    await upload.done();
    console.log(`[AWS UPLOAD] S3 upload successful for key: ${key}`);

    // Return the CDN URL with cache-busting for EMA
    const cdnUrl = getCdnUrl(key);
    const finalUrl = `${cdnUrl}?v=${cacheKey}`;
    console.log(`[AWS UPLOAD] Final CDN URL: ${finalUrl}`);

    return finalUrl;
  } catch (error) {
    console.error('[AWS UPLOAD] Error uploading to S3:', error);
    throw new Error('Failed to upload image to S3');
  }
}

/**
 * Process and upload image with WebP conversion
 * @param {Buffer} buffer - Input image buffer
 * @param {string} originalName - Original filename
 * @param {string} folder - S3 folder path
 * @returns {Promise<string>} - S3 URL of uploaded WebP image
 */
async function processAndUploadImage(buffer, originalName, folder = 'uploads') {
  try {
    console.log(`[AWS UPLOAD] Processing image '${originalName}' for folder '${folder}'`);
    // Convert to WebP
    const webpBuffer = await convertToWebp(buffer);
    
    // Generate unique filename
    const filename = generateFilename(originalName, folder.split('/').pop());
    
    // Upload to S3
    const s3Url = await uploadToS3(webpBuffer, filename, folder);
    
    console.log(`[AWS UPLOAD] Successfully processed and uploaded '${originalName}'`);
    return s3Url;
  } catch (error) {
    console.error(`[AWS UPLOAD] Error processing image '${originalName}':`, error);
    throw error;
  }
}

/**
 * Handle multiple image uploads
 * @param {Array} files - Array of file objects with buffer property
 * @param {string} folder - S3 folder path
 * @returns {Promise<Array>} - Array of S3 URLs
 */
async function uploadMultipleImages(files, folder = 'uploads') {
  console.log(`[AWS UPLOAD] Starting batch upload of ${files.length} images to folder '${folder}'`);
  const uploadPromises = files.map(file => 
    processAndUploadImage(file.buffer, file.originalname, folder)
  );
  
  const results = await Promise.all(uploadPromises);
  console.log(`[AWS UPLOAD] Finished batch upload. ${results.length} images uploaded.`);
  return results;
}

/**
 * Handle base64 image upload
 * @param {string} dataUrl - Base64 data URL
 * @param {string} folder - S3 folder path
 * @returns {Promise<string>} - S3 URL of uploaded WebP image
 */
async function uploadBase64Image(dataUrl, folder = 'uploads') {
  try {
    const match = /^data:(image\/[a-zA-Z]+);base64,(.+)$/.exec(dataUrl);
    if (!match) throw new Error('Invalid image data');

    const buffer = Buffer.from(match[2], 'base64');
    const filename = `base64-${Date.now()}.webp`;
    
    return await processAndUploadImage(buffer, filename, folder);
  } catch (error) {
    console.error('Error uploading base64 image:', error);
    throw error;
  }
}

module.exports = {
  processAndUploadImage,
  uploadMultipleImages,
  uploadBase64Image,
  convertToWebp,
  generateFilename,
  getCdnUrl,
  fixWebsiteUrl,
  uploadToS3,
};
