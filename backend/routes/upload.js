const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../middleware/auth');
const { uploadCategoryImage, uploadCategoryToS3, uploadBlogImages, uploadBlogToS3, uploadStoryImages, uploadStoryToS3, uploadProductImages, uploadProductsToS3 } = require('../middleware/upload');
const uploadController = require('../controller/uploadController');

// Category image upload endpoint
router.post('/category-image', auth, requireRole('admin'), uploadCategoryImage, uploadCategoryToS3, uploadController.uploadSingle);

// Blog images upload endpoint
router.post('/blog-image', auth, requireRole('admin'), uploadBlogImages, uploadBlogToS3, uploadController.uploadMultiple);

// Story images upload endpoint
router.post('/story-image', auth, requireRole('admin'), uploadStoryImages, uploadStoryToS3, uploadController.uploadSingle);

// Product images upload endpoint
router.post('/product-images', auth, requireRole('admin'), uploadProductImages, uploadProductsToS3, uploadController.uploadMultiple);

module.exports = router;
