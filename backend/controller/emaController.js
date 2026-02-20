/**
 * EMA Cache Controller
 * Handles cache invalidation and management for CloudFront EMA
 */

const { invalidateEMACache, checkEMAStatus } = require('../middleware/emaCache');

/**
 * Get EMA Cache Status
 * Returns current EMA configuration and status
 */
exports.getEMAStatus = (req, res) => {
  try {
    const status = checkEMAStatus();
    
    res.status(200).json({
      success: true,
      data: {
        ema: status,
        timestamp: new Date().toISOString(),
        message: status.enabled ? 'EMA is enabled and active' : 'EMA is disabled'
      }
    });
  } catch (error) {
    console.error('Error getting EMA status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get EMA status',
      error: error.message
    });
  }
};

/**
 * Invalidate EMA Cache
 * Invalidates CloudFront cache for specified paths
 */
exports.invalidateCache = async (req, res) => {
  try {
    const { paths = [] } = req.body;
    
    // Validate paths array
    if (!Array.isArray(paths)) {
      return res.status(400).json({
        success: false,
        message: 'Paths must be an array'
      });
    }
    
    // Limit number of paths per invalidation
    if (paths.length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 1000 paths allowed per invalidation'
      });
    }
    
    const result = await invalidateEMACache(paths);
    
    res.status(200).json({
      success: true,
      data: {
        invalidationId: result.Invalidation.Id,
        status: result.Invalidation.Status,
        paths: paths,
        createTime: result.Invalidation.CreateTime,
        estimatedCompletion: new Date(
          Date.parse(result.Invalidation.CreateTime) + 15 * 60 * 1000 // 15 minutes
        ).toISOString()
      },
      message: 'Cache invalidation initiated successfully'
    });
  } catch (error) {
    console.error('Error invalidating EMA cache:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to invalidate cache',
      error: error.message
    });
  }
};

/**
 * Invalidate All Image Cache
 * Invalidates all image cache (common operation)
 */
exports.invalidateAllImages = async (req, res) => {
  try {
    const result = await invalidateEMACache(['/images/*', '*/images/*']);
    
    res.status(200).json({
      success: true,
      data: {
        invalidationId: result.Invalidation.Id,
        status: result.Invalidation.Status,
        paths: ['/images/*', '*/images/*'],
        createTime: result.Invalidation.CreateTime,
        estimatedCompletion: new Date(
          Date.parse(result.Invalidation.CreateTime) + 15 * 60 * 1000 // 15 minutes
        ).toISOString()
      },
      message: 'All image cache invalidation initiated'
    });
  } catch (error) {
    console.error('Error invalidating all image cache:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to invalidate all image cache',
      error: error.message
    });
  }
};

/**
 * Get Cache Statistics
 * Returns cache performance statistics (placeholder for monitoring)
 */
exports.getCacheStats = (req, res) => {
  try {
    // This would typically integrate with CloudFront analytics
    // For now, return basic cache status
    const status = checkEMAStatus();
    
    res.status(200).json({
      success: true,
      data: {
        ema: status,
        cacheHitRatio: '95.2%', // Example metric
        averageResponseTime: '45ms', // Example metric
        edgeLocations: 120, // Example metric
        lastInvalidation: '2024-01-15T10:30:00Z', // Example timestamp
        totalCachedObjects: '1.2M', // Example metric
        cacheEfficiency: 'High'
      },
      message: 'Cache statistics retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting cache stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get cache statistics',
      error: error.message
    });
  }
};
