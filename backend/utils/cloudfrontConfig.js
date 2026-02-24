/**
 * AWS CloudFront Configuration for EMA (Edge-Memory Acceleration)
 * This file contains CloudFront distribution settings for optimal image caching
 */

// Try to use AWS SDK v3 first, fallback to v2
let AWS;
let cloudfront;

try {
  // AWS SDK v3
  const { CloudFrontClient, CreateInvalidationCommand } = require('@aws-sdk/client-cloudfront');
  
  const cloudfrontClient = new CloudFrontClient({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
  });
  
  // Create wrapper for v2 compatibility
  cloudfront = {
    createInvalidation: async (params) => {
      const command = new CreateInvalidationCommand(params);
      return await cloudfrontClient.send(command);
    }
  };
  
  AWS = require('aws-sdk');
} catch (error) {
  console.log('⚠️ Using AWS SDK v2 as fallback');
  // AWS SDK v2
  AWS = require('aws-sdk');
  
  cloudfront = new AWS.CloudFront({
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  });
}

const cloudfrontConfig = {
  // CloudFront Distribution Configuration
  distributionConfig: {
    // Origin Configuration
    Origins: {
      Quantity: 1,
      Items: [
        {
          Id: `S3-${process.env.AWS_S3_BUCKET}`,
          DomainName: `${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com`,
          S3OriginConfig: {
            OriginAccessIdentity: process.env.CLOUDFRONT_OAI || ''
          }
        }
      ]
    },

    // Default Cache Behavior with EMA
    DefaultCacheBehavior: {
      TargetOriginId: `S3-${process.env.AWS_S3_BUCKET}`,
      ViewerProtocolPolicy: 'redirect-to-https',
      TrustedSigners: { Quantity: 0 },
      TrustedKeyGroups: { Quantity: 0 },
      MinTTL: 31536000, // 1 year
      MaxTTL: 31536000, // 1 year
      DefaultTTL: 31536000, // 1 year
      ForwardedValues: {
        QueryString: false,
        Cookies: { Forward: 'none' },
        Headers: {
          Quantity: 2,
          Items: ['Origin', 'Access-Control-Request-Headers']
        }
      },
      Compress: true, // Enable compression
      LambdaFunctionAssociations: { Quantity: 0 },
      FieldLevelEncryptionId: '',
      SmoothStreaming: false,
      AllowedMethods: {
        Quantity: 2,
        Items: ['HEAD', 'GET'],
        CachedMethods: {
          Quantity: 2,
          Items: ['HEAD', 'GET']
        }
      }
    },

    // Cache Behaviors for different content types
    CacheBehaviors: {
      Quantity: 2,
      Items: [
        {
          PathPattern: '*.webp',
          TargetOriginId: `S3-${process.env.AWS_S3_BUCKET}`,
          ViewerProtocolPolicy: 'redirect-to-https',
          MinTTL: 31536000, // 1 year for images
          MaxTTL: 31536000,
          DefaultTTL: 31536000,
          ForwardedValues: {
            QueryString: true, // Allow cache-busting query strings
            QueryStringCacheKeys: {
              Quantity: 1,
              Items: ['v'] // Cache-busting version parameter
            },
            Cookies: { Forward: 'none' },
            Headers: {
              Quantity: 3,
              Items: ['Origin', 'Access-Control-Request-Headers', 'Accept-Encoding']
            }
          },
          Compress: true,
          AllowedMethods: {
            Quantity: 2,
            Items: ['HEAD', 'GET'],
            CachedMethods: {
              Quantity: 2,
              Items: ['HEAD', 'GET']
            }
          }
        },
        {
          PathPattern: '*',
          TargetOriginId: `S3-${process.env.AWS_S3_BUCKET}`,
          ViewerProtocolPolicy: 'redirect-to-https',
          MinTTL: 86400, // 1 day for other content
          MaxTTL: 31536000,
          DefaultTTL: 86400,
          ForwardedValues: {
            QueryString: false,
            Cookies: { Forward: 'none' },
            Headers: {
              Quantity: 2,
              Items: ['Origin', 'Access-Control-Request-Headers']
            }
          },
          Compress: true,
          AllowedMethods: {
            Quantity: 2,
            Items: ['HEAD', 'GET'],
            CachedMethods: {
              Quantity: 2,
              Items: ['HEAD', 'GET']
            }
          }
        }
      ]
    },

    // Comment for the distribution
    Comment: 'EMA-enabled distribution for image CDN with edge caching',

    // Enabled state
    Enabled: true,

    // Price Class for cost optimization
    PriceClass: 'PriceClass_100', // Use all edge locations

    // Aliases (Custom Domain Names)
    Aliases: {
      Quantity: 1,
      Items: [process.env.AWS_CLOUDFRONT_DOMAIN || 'cdn.yourdomain.com']
    },

    // SSL Certificate
    ViewerCertificate: {
      CloudFrontDefaultCertificate: true, // Use CloudFront default certificate
      SSLSupportMethod: 'sni-only',
      MinimumProtocolVersion: 'TLSv1.2_2021'
    },

    // Default Root Object
    DefaultRootObject: 'index.html',

    // Logging Configuration
    Logging: {
      Enabled: true,
      IncludeCookies: false,
      Bucket: `${process.env.AWS_S3_BUCKET}-logs`,
      Prefix: 'cloudfront-logs/'
    },

    // Geo Restrictions
    Restrictions: {
      GeoRestriction: {
        RestrictionType: 'none'
      }
    },

    // Web ACL ID
    WebACLId: ''
  },

  // EMA (Edge-Memory Acceleration) Settings
  emaSettings: {
    enabled: true,
    // Edge memory cache size in MB (adjust based on your needs)
    edgeMemorySize: 1000, // 1GB edge memory cache
    // Cache duration at edge locations
    edgeCacheTtl: 31536000, // 1 year
    // Enable compression for edge cache
    edgeCompression: true,
    // Cache invalidation settings
    invalidation: {
      paths: ['/*.webp'], // Paths to invalidate
      batchSize: 1000, // Max paths per invalidation
      callerReference: 'ema-invalidation'
    }
  }
};

/**
 * Generate CloudFront invalidation for EMA cache
 * @param {Array} paths - Array of paths to invalidate
 * @param {string} distributionId - CloudFront distribution ID
 * @returns {Promise} - Invalidation result
 */
async function createEMAInvalidation(paths, distributionId) {
  const params = {
    DistributionId: distributionId,
    InvalidationBatch: {
      Paths: {
        Quantity: paths.length,
        Items: paths
      },
      CallerReference: `ema-invalidation-${Date.now()}`
    }
  };

  try {
    const result = await cloudfront.createInvalidation(params);
    
    // Handle both v2 and v3 SDK responses
    const invalidation = result.Invalidation || result.$response?.Invalidation;
    
    console.log('✅ EMA Invalidation created:', invalidation.Id);
    return { Invalidation: invalidation };
  } catch (error) {
    console.error('❌ Error creating EMA invalidation:', error);
    throw error;
  }
}

/**
 * Get optimized cache headers for EMA
 * @param {string} contentType - Content type of the file
 * @returns {Object} - Cache headers object
 */
function getEMACacheHeaders(contentType) {
  const isImage = contentType.startsWith('image/');
  
  return {
    'Cache-Control': isImage 
      ? 'max-age=31536000, immutable, public' 
      : 'max-age=86400, public',
    'EMA-Cache-Enabled': isImage ? 'true' : 'false',
    'EMA-TTL': isImage ? '31536000' : '86400',
    'Edge-Cache-Control': isImage 
      ? 'max-age=31536000, immutable' 
      : 'max-age=86400',
    'Vary': 'Accept-Encoding'
  };
}

module.exports = {
  cloudfrontConfig,
  createEMAInvalidation,
  getEMACacheHeaders
};
