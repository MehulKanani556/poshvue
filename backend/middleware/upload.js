const { processAndUploadImage, uploadMultipleImages } = require('../utils/awsUpload');
const multer = require('multer');
const path = require('path');

// Configure multer for memory storage (temporary)
const storage = multer.memoryStorage();

// File filter - only images
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
  }
};

// Multer configuration - max 4 images, 5MB each
const uploadReviewImages = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
    files: 4 // Max 4 files
  },
  fileFilter: fileFilter
});

// Multer configuration for products - max 10 images, 5MB each
const uploadProductImages = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
    files: 10 // Max 10 files for products
  },
  fileFilter: fileFilter
});

/**
 * Middleware to handle AWS S3 upload with WebP conversion
 * This middleware should be used after multer middleware
 */
const uploadToS3 = async (req, res, next) => {
  try {
    console.log('UploadToS3 middleware - req.files:', req.files ? req.files.length : 'undefined');
    
    if (!req.files || req.files.length === 0) {
      console.log('No files to upload, proceeding to next middleware');
      return next();
    }

    console.log('Processing', req.files.length, 'files for S3 upload');
    
    // Process uploaded files and upload to S3 with WebP conversion
    const s3Urls = await uploadMultipleImages(req.files, 'reviews');
    
    console.log('S3 upload successful, URLs:', s3Urls);
    
    // Replace file information with S3 URLs
    req.s3FileUrls = s3Urls;
    req.files = undefined; // Clear multer files to free memory
    
    next();
  } catch (error) {
    console.error('Error uploading to S3:', error);
    console.error('Error details:', error.stack);
    return res.status(500).json({ message: 'Failed to upload images', error: error.message });
  }
};

/**
 * Middleware to handle AWS S3 upload for products
 */
const uploadProductsToS3 = async (req, res, next) => {
  try {
    console.log('UploadProductsToS3 middleware - req.files:', req.files ? req.files.length : 'undefined');
    
    if (!req.files || req.files.length === 0) {
      console.log('No files to upload, proceeding to next middleware');
      return next();
    }

    console.log('Processing', req.files.length, 'product images for S3 upload');
    
    // Process uploaded files and upload to S3 with WebP conversion
    const s3Urls = await uploadMultipleImages(req.files, 'products');
    
    console.log('Product S3 upload successful, URLs:', s3Urls);
    
    // Replace file information with S3 URLs
    req.s3FileUrls = s3Urls;
    req.files = undefined; // Clear multer files to free memory
    
    next();
  } catch (error) {
    console.error('Error uploading products to S3:', error);
    console.error('Error details:', error.stack);
    return res.status(500).json({ message: 'Failed to upload product images', error: error.message });
  }
};

module.exports = {
  uploadReviewImages: uploadReviewImages.array('images', 4), // 'images' is the field name, max 4 files
  uploadProductImages: uploadProductImages.array('images', 10), // 'images' is the field name, max 10 files
  uploadToS3,
  uploadProductsToS3
};
