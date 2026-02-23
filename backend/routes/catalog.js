const express = require('express');
const router = express.Router();
const product = require('../controller/productController');
const category = require('../controller/categoryController');
const { auth, requireRole } = require('../middleware/auth');
const { uploadProductImages, uploadProductsToS3 } = require('../middleware/upload');

// Middleware to log incoming headers for debugging file uploads
const logHeaders = (req, res, next) => {
  console.log('[Request Headers on /products]:', JSON.stringify(req.headers, null, 2));
  next();
};

// Public catalog endpoints
router.get('/products', product.list);
router.get('/products/:id', product.get);
router.get('/categories', category.list);
router.get('/categories/:id', category.get);

// Admin-only catalog management
router.post('/products', auth, requireRole('admin'), logHeaders, uploadProductImages, uploadProductsToS3, product.create);
router.put('/products/:id', auth, requireRole('admin'), logHeaders, uploadProductImages, uploadProductsToS3, product.update);
router.delete('/products/:id', auth, requireRole('admin'), product.remove);
router.post('/categories', auth, requireRole('admin'), category.create);
router.put('/categories/:id', auth, requireRole('admin'), category.update);
router.delete('/categories/:id', auth, requireRole('admin'), category.remove);

module.exports = router;