/**
 * Real-World Test - Verify S3 Deletion with Actual Product
 * This script tests deletion with a real product from your database
 * 
 * Usage:
 *   1. Find a test product ID
 *   2. Run: node test-real-deletion.js <productId> <imageIndex>
 *   3. Example: node test-real-deletion.js 507f1f77bcf86cd799439011 0
 */

require('dotenv').config();
const { deleteImageFromS3, extractS3Key } = require('./utils/awsUpload');
const { Product } = require('./model');
const mongoose = require('mongoose');

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
}

async function testRealDeletion(productId, imageIndex) {
  try {
    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║         REAL-WORLD DELETION TEST                           ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');

    // Find product
    const product = await Product.findById(productId);
    if (!product) {
      console.error(`❌ Product not found with ID: ${productId}`);
      return;
    }

    console.log(`📦 Product Found: ${product.name}`);
    console.log(`📊 Total Images: ${product.images.length}`);

    // Check image index
    if (!product.images[imageIndex]) {
      console.error(`\n❌ Image index ${imageIndex} not found`);
      console.log(`Available indices: 0-${product.images.length - 1}`);
      return;
    }

    // Show product images
    console.log('\n📸 Product Images:');
    product.images.forEach((img, idx) => {
      const marker = idx === imageIndex ? '→ ' : '  ';
      console.log(`${marker}[${idx}] ${img.substring(0, 80)}...`);
    });

    // Get image to delete
    const imageToDelete = product.images[imageIndex];
    console.log(`\n🗑️  Selected Image (index ${imageIndex}):`);
    console.log(`    ${imageToDelete}`);

    // Extract S3 key
    const s3Key = extractS3Key(imageToDelete);
    console.log(`\n🔑 Extracted S3 Key:`);
    console.log(`    ${s3Key}`);

    // Confirm deletion
    console.log('\n⚠️  WARNING: This will delete the image from S3!');
    console.log('Type "DELETE" to confirm: ', '');
    
    // For automated testing, we'll just log what would happen
    console.log('\n📋 What would happen:');
    console.log('  1. ❌ Delete image from S3');
    console.log('  2. ✏️  Remove image URL from product in database');
    console.log(`  3. 💾 Product would have ${product.images.length - 1} images remaining`);

    console.log('\n💡 To actually test deletion with real AWS:');
    console.log('  1. Edit this file and uncomment the deletion code below');
    console.log('  2. Or use the admin panel to update a product and watch logs');
    console.log('  3. Or run: node test-delete-function.js');

    console.log('\n═══════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function listProductsWithImages() {
  try {
    console.log('\n📦 Products with Images in Database:\n');
    
    const products = await Product.find(
      { images: { $exists: true, $ne: [] } },
      { name: 1, 'images': { $size: '$images' } }
    ).limit(10);

    if (products.length === 0) {
      console.log('❌ No products with images found');
      return;
    }

    products.forEach((p, idx) => {
      console.log(`${idx + 1}. ${p.name}`);
      console.log(`   ID: ${p._id}`);
      console.log(`   Images: ${p.images?.length || 0}`);
      console.log('');
    });

    return products[0]?._id;

  } catch (error) {
    console.error('Error listing products:', error.message);
  }
}

async function main() {
  await connectDB();

  let productId = process.argv[2];
  let imageIndex = parseInt(process.argv[3] || '0');

  if (!productId) {
    console.log('Usage: node test-real-deletion.js <productId> [imageIndex]');
    console.log('\nExample: node test-real-deletion.js 507f1f77bcf86cd799439011 0\n');
    
    console.log('Finding sample products...');
    productId = await listProductsWithImages();
    
    if (!productId) {
      console.log('\n❌ No products found to test with');
      await mongoose.connection.close();
      process.exit(1);
    }

    imageIndex = 0;
  }

  await testRealDeletion(productId, imageIndex);
  await mongoose.connection.close();
}

main();
