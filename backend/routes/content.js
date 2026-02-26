const express = require('express');
const router = express.Router();
const blog = require('../controller/blogController');
const review = require('../controller/reviewController');
const { auth, requireRole } = require('../middleware/auth');
const { uploadReviewImages, uploadReviewToS3, uploadBlogImages, uploadBlogToS3 } = require('../middleware/upload');

// Public content endpoints
router.get('/blogs', blog.list);
router.get('/blogs/:slug', blog.get);

// Reviews
router.get('/reviews', review.list); // admin can filter by status
router.get('/reviews/products-with-reviews', auth, requireRole('admin'), review.getProductsWithReviews); // get products with reviews grouped
router.get('/reviews/reviewable-products', auth, review.getReviewableProducts); // get products user can review
router.post('/reviews', auth, uploadReviewImages, uploadReviewToS3, review.create); // authenticated review creation with AWS S3 upload
router.put('/reviews/:id/status', auth, requireRole('admin'), review.updateStatus); // admin moderate
router.delete('/reviews/:id', auth, requireRole('admin'), review.remove);

// Admin-only blog management
router.post('/blogs', auth, requireRole('admin'), uploadBlogImages, uploadBlogToS3, blog.create);
router.put('/blogs/:id', auth, requireRole('admin'), uploadBlogImages, uploadBlogToS3, blog.update);
router.delete('/blogs/:id', auth, requireRole('admin'), blog.remove);

module.exports = router;