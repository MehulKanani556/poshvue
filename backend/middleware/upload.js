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

// Multer configuration for categories - max 1 image, 5MB
const uploadCategoryImage = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
    files: 1 // Max 1 file for categories
  },
  fileFilter: fileFilter
});

// Multer configuration for blogs - max 5 images, 5MB each
const uploadBlogImages = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
    files: 5 // Max 5 files for blogs
  },
  fileFilter: fileFilter
});

// Multer configuration for stories - max 1 image, 5MB
const uploadStoryImages = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
    files: 1 // Max 1 file for stories
  },
  fileFilter: fileFilter
});



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

/**
 * Middleware to handle AWS S3 upload for categories
 */
const uploadCategoryToS3 = async (req, res, next) => {
  try {
    console.log('UploadCategoryToS3 middleware - req.files:', req.files ? req.files.length : 'undefined');
    
    if (!req.files || req.files.length === 0) {
      console.log('No files to upload, proceeding to next middleware');
      return next();
    }

    console.log('Processing', req.files.length, 'category images for S3 upload');
    
    // Process uploaded files and upload to S3 with WebP conversion
    const s3Urls = await uploadMultipleImages(req.files, 'categories');
    
    console.log('Category S3 upload successful, URLs:', s3Urls);
    
    // Replace file information with S3 URLs
    req.s3FileUrls = s3Urls;
    req.files = undefined; // Clear multer files to free memory
    
    next();
  } catch (error) {
    console.error('Error uploading category to S3:', error);
    console.error('Error details:', error.stack);
    return res.status(500).json({ message: 'Failed to upload category images', error: error.message });
  }
};

/**
 * Middleware to handle AWS S3 upload for blogs
 */
const uploadBlogToS3 = async (req, res, next) => {
  try {
    console.log('UploadBlogToS3 middleware - req.files:', req.files ? req.files.length : 'undefined');
    
    if (!req.files || req.files.length === 0) {
      console.log('No files to upload, proceeding to next middleware');
      return next();
    }

    console.log('Processing', req.files.length, 'blog images for S3 upload');
    
    // Process uploaded files and upload to S3 with WebP conversion
    const s3Urls = await uploadMultipleImages(req.files, 'blogs');
    
    console.log('Blog S3 upload successful, URLs:', s3Urls);
    
    // Replace file information with S3 URLs
    req.s3FileUrls = s3Urls;
    req.files = undefined; // Clear multer files to free memory
    
    next();
  } catch (error) {
    console.error('Error uploading blog to S3:', error);
    console.error('Error details:', error.stack);
    return res.status(500).json({ message: 'Failed to upload blog images', error: error.message });
  }
};

/**
 * Middleware to handle AWS S3 upload for stories
 */
const uploadStoryToS3 = async (req, res, next) => {
  try {
    console.log('UploadStoryToS3 middleware - req.files:', req.files ? req.files.length : 'undefined');
    
    if (!req.files || req.files.length === 0) {
      console.log('No files to upload, proceeding to next middleware');
      return next();
    }

    console.log('Processing', req.files.length, 'story images for S3 upload');
    
    // Process uploaded files and upload to S3 with WebP conversion
    const s3Urls = await uploadMultipleImages(req.files, 'stories');
    
    console.log('Story S3 upload successful, URLs:', s3Urls);
    
    // Replace file information with S3 URLs
    req.s3FileUrls = s3Urls;
    req.files = undefined; // Clear multer files to free memory
    
    next();
  } catch (error) {
    console.error('Error uploading story to S3:', error);
    console.error('Error details:', error.stack);
    return res.status(500).json({ message: 'Failed to upload story images', error: error.message });
  }
};

/**
 * Middleware to handle AWS S3 upload for reviews
 */
const uploadReviewToS3 = async (req, res, next) => {
  try {
    console.log('uploadReviewToS3 middleware - req.files:', req.files ? req.files.length : 'undefined');
    
    if (!req.files || req.files.length === 0) {
      console.log('No files to upload, proceeding to next middleware');
      return next();
    }

    console.log('Processing', req.files.length, 'review images for S3 upload');
    
    // Process uploaded files and upload to S3 with WebP conversion
    const s3Urls = await uploadMultipleImages(req.files, 'reviews');
    
    console.log('Review S3 upload successful, URLs:', s3Urls);
    
    // Replace file information with S3 URLs
    req.s3FileUrls = s3Urls;
    req.files = undefined; // Clear multer files to free memory
    
    next();
  } catch (error) {
    console.error('Error uploading reviews to S3:', error);
    console.error('Error details:', error.stack);
    return res.status(500).json({ message: 'Failed to upload review images', error: error.message });
  }
};

module.exports = {
  uploadReviewImages: uploadReviewImages.array('images', 4), // 'images' is the field name, max 4 files
  uploadProductImages: uploadProductImages.any(), // Accept any files for products, max 10 files as per config
  uploadCategoryImage: uploadCategoryImage.single('image'), // 'image' is the field name, max 1 file
  uploadBlogImages: uploadBlogImages.array('images', 5), // 'images' is the field name, max 5 files
  uploadStoryImages: uploadStoryImages.single('image'), // 'image' is the field name, max 1 file
  uploadProductsToS3,
  uploadCategoryToS3,
  uploadBlogToS3,
  uploadStoryToS3,
  uploadReviewToS3
};
