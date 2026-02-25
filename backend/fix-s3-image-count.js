// Fix S3 Image Count Issue
// Problem: When editing products, old images aren't being properly deleted from S3
// This causes incorrect count in S3 bucket

const { S3Client, ListObjectsCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'eu-north-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const S3_BUCKET = process.env.AWS_S3_BUCKET;

/**
 * List all images in S3 bucket
 */
async function listAllImages() {
  try {
    console.log('📋 Listing all images in S3 bucket...');
    
    const command = new ListObjectsCommand({
      Bucket: S3_BUCKET,
      Prefix: 'products/',
    });

    const response = await s3Client.send(command);
    const objects = response.Contents || [];
    
    console.log(`\n📊 Current S3 Bucket Status:`);
    console.log(`   Total objects: ${objects.length}`);
    console.log(`   Prefix: products/`);
    
    // Group by file type
    const imageFiles = objects.filter(obj => 
      obj.Key && (obj.Key.includes('.jpg') || obj.Key.includes('.jpeg') || obj.Key.includes('.png') || obj.Key.includes('.webp'))
    );
    
    console.log(`   Image files: ${imageFiles.length}`);
    console.log(`   Other files: ${objects.length - imageFiles.length}`);
    
    // Show last 10 files
    console.log('\n📁 Recent files:');
    imageFiles.slice(-10).forEach(obj => {
      console.log(`   ${obj.Key} (${obj.Size} bytes)`);
    });
    
    return objects;
  } catch (error) {
    console.error('❌ Error listing S3 objects:', error);
    return [];
  }
}

/**
 * Clean up orphaned images (not referenced in any product)
 */
async function cleanupOrphanedImages() {
  try {
    console.log('\n🧹 Cleaning up orphaned images...');
    
    // Get all S3 objects
    const listCommand = new ListObjectsCommand({
      Bucket: S3_BUCKET,
      Prefix: 'products/',
    });
    
    const response = await s3Client.send(listCommand);
    const s3Objects = response.Contents || [];
    
    // Get all products from database
    const { Product } = require('./model');
    const products = await Product.find({});
    
    // Collect all referenced images from products
    const referencedImages = new Set();
    products.forEach(product => {
      if (Array.isArray(product.images)) {
        product.images.forEach(img => {
          if (typeof img === 'string') {
            // Extract S3 key from URL
            const key = extractS3Key(img);
            if (key) referencedImages.add(key);
          }
        });
      }
    });
    
    console.log(`   Referenced images: ${referencedImages.size}`);
    console.log(`   Total S3 images: ${s3Objects.length}`);
    
    // Find orphaned images
    const orphanedImages = s3Objects.filter(obj => 
      obj.Key && !referencedImages.has(obj.Key)
    );
    
    console.log(`   Orphaned images: ${orphanedImages.length}`);
    
    if (orphanedImages.length > 0) {
      console.log('\n🗑️  Deleting orphaned images...');
      
      const deletePromises = orphanedImages.map(obj => {
        const deleteCommand = new DeleteObjectCommand({
          Bucket: S3_BUCKET,
          Key: obj.Key,
        });
        
        return s3Client.send(deleteCommand)
          .then(() => ({ success: true, key: obj.Key }))
          .catch(error => ({ success: false, key: obj.Key, error: error.message }));
      });
      
      const results = await Promise.all(deletePromises);
      const deleted = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      
      console.log(`   ✅ Deleted: ${deleted}`);
      console.log(`   ❌ Failed: ${failed}`);
      
      if (failed > 0) {
        console.log('\n⚠️  Failed deletions:');
        results.filter(r => !r.success).forEach(r => {
          console.log(`   - ${r.key}: ${r.error}`);
        });
      }
    } else {
      console.log('   ✅ No orphaned images found');
    }
    
    return { deleted: orphanedImages.length, referenced: referencedImages.size };
  } catch (error) {
    console.error('❌ Error cleaning up orphaned images:', error);
    return { deleted: 0, referenced: 0 };
  }
}

/**
 * Extract S3 key from URL
 */
function extractS3Key(url) {
  if (!url || typeof url !== 'string') return null;
  
  // Handle various URL formats
  const patterns = [
    /products\/([^\/]+\.(jpg|jpeg|png|webp))/i,
    /poshvue-images-2026\/products\/([^\/]+\.(jpg|jpeg|png|webp))/i
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return `products/${match[1]}`;
  }
  
  return null;
}

/**
 * Main function to fix S3 image count
 */
async function fixS3ImageCount() {
  console.log('🔧 Starting S3 Image Count Fix\n');
  console.log('=====================================');
  
  // Step 1: List current images
  await listAllImages();
  
  // Step 2: Clean up orphaned images
  await cleanupOrphanedImages();
  
  // Step 3: Final count
  console.log('\n📋 Final image count...');
  const finalList = await listAllImages();
  
  console.log('\n✅ S3 Image Count Fix Complete!');
  console.log('=====================================');
}

// Run the fix
if (require.main === module) {
  fixS3ImageCount().catch(console.error);
}

module.exports = {
  listAllImages,
  cleanupOrphanedImages,
  fixS3ImageCount,
  extractS3Key
};
