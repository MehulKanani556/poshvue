/**
 * EMA (Edge-Memory Acceleration) Cache Middleware
 * This middleware adds appropriate cache headers for CloudFront EMA
 */

const { getEMACacheHeaders } = require('../utils/cloudfrontConfig');

/**
 * EMA Cache Middleware
 * Adds EMA-specific cache headers to image responses
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const emaCacheMiddleware = (req, res, next) => {
  try {
    const url = req.url;
    const contentType = req.get('Content-Type') || '';
    
    // Check if this is an image request
    const isImageRequest = url.includes('/images/') || 
                        url.includes('.jpg') || 
                        url.includes('.jpeg') || 
                        url.includes('.png') || 
                        url.includes('.gif') || 
                        url.includes('.webp') ||
                        contentType.startsWith('image/');
    
    if (isImageRequest) {
      // Get EMA cache headers for images
      const emaHeaders = getEMACacheHeaders(contentType);
      
      // Apply EMA headers to response
      Object.keys(emaHeaders).forEach(key => {
        res.set(key, emaHeaders[key]);
      });
      
      // Additional EMA-specific headers
      res.set('X-EMA-Cache', 'enabled');
      res.set('X-Edge-Cache-TTL', emaHeaders['EMA-TTL']);
      res.set('X-CDN-Cache', 'cloudfront-ema');
      
      console.log('EMA cache headers applied for:', url);
    } else {
      // API responses should not be cached aggressively
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '-1');
      res.set('Surrogate-Control', 'no-store');
      res.set('X-EMA-Cache', 'disabled');
    }
    
    next();
  } catch (error) {
    console.error('EMA Cache Middleware Error:', error);
    // Continue without EMA headers if there's an error
    res.set('Cache-Control', 'max-age=3600, public'); // 1 hour fallback
    next();
  }
};

/**
 * EMA Invalidation Helper
 * Creates CloudFront invalidation for EMA cache
 * @param {Array} paths - Array of paths to invalidate
 * @returns {Promise} - Invalidation result
 */
const invalidateEMACache = async (paths = []) => {
  try {
    const { createEMAInvalidation } = require('../utils/cloudfrontConfig');
    const distributionId = process.env.CLOUDFRONT_DISTRIBUTION_ID;
    
    if (!distributionId) {
      console.warn('CloudFront distribution ID not configured');
      return null;
    }
    
    // Default to invalidating all images if no paths specified
    const invalidationPaths = paths.length > 0 ? paths : ['/images/*'];
    
    const result = await createEMAInvalidation(invalidationPaths, distributionId);
    console.log('EMA cache invalidation initiated:', result.Invalidation.Id);
    
    return result;
  } catch (error) {
    console.error('EMA cache invalidation failed:', error);
    throw error;
  }
};

/**
 * EMA Cache Status Checker
 * Checks if EMA is properly configured
 * @returns {Object} - EMA configuration status
 */
const checkEMAStatus = () => {
  return {
    enabled: process.env.EMA_ENABLED === 'true',
    cloudfrontDomain: process.env.AWS_CLOUDFRONT_DOMAIN,
    distributionId: process.env.CLOUDFRONT_DISTRIBUTION_ID,
    edgeCacheTTL: process.env.EDGE_CACHE_TTL || '31536000',
    edgeMemorySize: process.env.EDGE_MEMORY_SIZE || '1000',
    compression: process.env.EDGE_COMPRESSION === 'true',
    cacheBusting: process.env.CACHE_BUSTING_ENABLED === 'true'
  };
};

module.exports = {
  emaCacheMiddleware,
  invalidateEMACache,
  checkEMAStatus
};
