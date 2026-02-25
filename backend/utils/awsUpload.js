const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
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
    s3Url = s3Url.replace('-website', '');
  }
  
  return s3Url;
}

// Additional fix for any existing URLs with -website
function fixWebsiteUrl(url) {
  if (typeof url !== 'string') return url;
  
  // Fix S3 URLs with -website in domain and bucket name
  if (url.includes('s3-website.') || url.includes('-website.s3.')) {
    const fixedUrl = url
      .replace('s3-website.', 's3.')  // Fix domain
      .replace('-website.s3.', '.s3.');  // Fix bucket name
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

    // Generate cache-busting query string for EMA (Edge-Memory Acceleration)
    const timestamp = Date.now();
    const cacheKey = `${timestamp}-${crypto.randomBytes(4).toString('hex')}`;
    
    const cacheControl = 'max-age=31536000, immutable'; // 1 year cache, immutable

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

    // Return the CDN URL with cache-busting for EMA
    const cdnUrl = getCdnUrl(key);
    const finalUrl = `${cdnUrl}?v=${cacheKey}`;

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
    // Convert to WebP
    const webpBuffer = await convertToWebp(buffer);
    
    // Generate unique filename
    const filename = generateFilename(originalName, folder.split('/').pop());
    
    // Upload to S3
    const s3Url = await uploadToS3(webpBuffer, filename, folder);
    
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
  const uploadPromises = files.map(file => 
    processAndUploadImage(file.buffer, file.originalname, folder)
  );
  
  const results = await Promise.all(uploadPromises);
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

/**
 * Extract S3 key from S3 or CloudFront URL
 * @param {string} imageUrl - S3 or CDN URL
 * @returns {string} - S3 object key
 */
function extractS3Key(imageUrl) {
  try {
    if (!imageUrl || typeof imageUrl !== 'string') {
      console.warn('❌ Invalid URL provided:', imageUrl);
      return null;
    }

    console.log('🔍 Extracting key from URL:', imageUrl);

    // Remove query string (cache-busting) and whitespace
    const urlWithoutQuery = imageUrl.split('?')[0].trim();

    // Pattern 1: CloudFront URL
    // https://poshvue-images-2026.s3.eu-north-1.amazonaws.com/products/image.webp
    const cloudFrontMatch = urlWithoutQuery.match(/https:\/\/[^/]+\/(.+)$/);
    if (cloudFrontMatch) {
      const key = cloudFrontMatch[1];
      console.log('✅ Extracted key (CloudFront pattern):', key);
      return key;
    }

    // Pattern 2: S3 Direct URL with bucket.s3.region format
    // https://bucket.s3.region.amazonaws.com/path/to/image.webp
    const s3DirectMatch = urlWithoutQuery.match(/https:\/\/[^.]+\.[^/]+\/(.+)$/);
    if (s3DirectMatch) {
      const key = s3DirectMatch[1];
      console.log('✅ Extracted key (S3 direct pattern):', key);
      return key;
    }

    // Pattern 3: Fallback - extract everything after domain
    const fallbackMatch = urlWithoutQuery.match(/amazonaws\.com\/(.+)$/);
    if (fallbackMatch) {
      const key = fallbackMatch[1];
      console.log('✅ Extracted key (fallback pattern):', key);
      return key;
    }

    // Pattern 4: Simple domain extraction
    const parts = urlWithoutQuery.split('/');
    if (parts.length > 3) {
      const key = parts.slice(3).join('/');
      console.log('✅ Extracted key (simple pattern):', key);
      return key;
    }

    console.warn('❌ Could not extract S3 key from URL:', imageUrl);
    return null;
  } catch (error) {
    console.error('❌ Error extracting S3 key:', error.message);
    return null;
  }
}

/**
 * Delete a single image from S3
 * @param {string} imageUrl - Image URL (S3 or CloudFront)
 * @returns {Promise<{success: boolean, url: string, key: string, error?: string}>} - Delete result
 */
async function deleteImageFromS3(imageUrl) {
  try {
    if (!imageUrl) {
      console.warn('⚠️  No URL provided for deletion');
      return { success: false, url: imageUrl, key: null, error: 'No URL provided' };
    }

    const key = extractS3Key(imageUrl);
    if (!key) {
      console.warn('❌ Could not extract S3 key from URL:', imageUrl);
      return { success: false, url: imageUrl, key: null, error: 'Could not extract key' };
    }

    console.log(`🗑️  Attempting to delete: ${key}`);

    const deleteCommand = new DeleteObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
    });

    const response = await s3Client.send(deleteCommand);
    console.log(`✅ Successfully deleted: ${key}`, response);
    
    return { success: true, url: imageUrl, key: key };
  } catch (error) {
    console.error(`❌ Error deleting image from S3:`, error.message);
    return { success: false, url: imageUrl, key: null, error: error.message };
  }
}

/**
 * Delete multiple images from S3
 * @param {Array<string>} imageUrls - Array of image URLs
 * @returns {Promise<{total: number, deleted: number, failed: number, results: Array}>} - Deletion summary
 */
async function deleteMultipleImagesFromS3(imageUrls) {
  console.log(`\n🗑️  Starting deletion of ${imageUrls?.length || 0} images...`);
  
  if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
    console.log('⚠️  No images to delete');
    return { total: 0, deleted: 0, failed: 0, results: [] };
  }

  const deletePromises = imageUrls.map(url => deleteImageFromS3(url));
  const results = await Promise.all(deletePromises);
  
  const deleted = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`\n📊 Deletion Summary:`);
  console.log(`   Total: ${results.length}`);
  console.log(`   ✅ Deleted: ${deleted}`);
  console.log(`   ❌ Failed: ${failed}`);
  
  if (failed > 0) {
    console.log('\n⚠️  Failed deletions:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`   - ${r.url} (Error: ${r.error})`);
    });
  }
  
  return { total: results.length, deleted, failed, results };
}

module.exports = {
  processAndUploadImage,
  uploadMultipleImages,
  uploadBase64Image,
  deleteImageFromS3,
  deleteMultipleImagesFromS3,
  extractS3Key,
  convertToWebp,
  generateFilename,
  getCdnUrl,
  fixWebsiteUrl,
  uploadToS3,
};
