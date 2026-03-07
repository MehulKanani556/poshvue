const { Review, Order } = require('../model');
const { uploadBase64Image, fixWebsiteUrl } = require('../utils/awsUpload');

/* -------------------- Helpers -------------------- */

// Helper function to make image URLs absolute and fix S3 URLs
function makeAbsoluteImages(images, req) {
  if (!images) return images;
  const host = `${req.protocol}://${req.get('host')}`;

  const processUrl = (url) => {
    if (typeof url !== 'string') return url;
    let finalUrl = fixWebsiteUrl(url);
    if (finalUrl.startsWith('/uploads/')) {
      return host + finalUrl;
    }
    return finalUrl;
  };

  if (Array.isArray(images)) {
    return images.map(processUrl);
  }
  return processUrl(images);
}

function mapAdminToReview(payload) {
  const body = { ...payload };
  // star -> rating (Number)
  if (body.star !== undefined) {
    const r = Number(body.star);
    if (!Number.isNaN(r)) body.rating = r;
    delete body.star;
  }
  // msg -> comment (String)
  if (body.msg !== undefined) {
    body.comment = String(body.msg);
    delete body.msg;
  }
  // image stays as image (String) if provided
  if (body.image !== undefined && typeof body.image !== 'string') {
    delete body.image;
  }
  return body;
}

exports.list = async (req, res) => {
  try {
    const { page = 1, limit = 20, product, status } = req.query;
    const query = {};
    if (product) query.product = product;
    if (status) query.status = status;

    const [items, total] = await Promise.all([
      Review.find(query)
        .populate('product', 'name images salePrice')
        .populate('user', 'name email')
        .sort('-createdAt')
        .skip((page - 1) * limit)
        .limit(Number(limit)),
      Review.countDocuments(query),
    ]);

    const processedItems = items.map(item => {
      const obj = item.toObject();
      if (obj.image) obj.image = makeAbsoluteImages(obj.image, req);
      if (obj.images) obj.images = makeAbsoluteImages(obj.images, req);
      if (obj.product && obj.product.images) {
        obj.product.images = makeAbsoluteImages(obj.product.images, req);
      }
      return obj;
    });

    return res.json({ items: processedItems, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

// Helper function to save base64 image to AWS S3
async function saveBase64Image(dataUrl) {
  try {
    return await uploadBase64Image(dataUrl, 'reviews');
  } catch (error) {
    console.error('Error uploading base64 image to S3:', error);
    throw error;
  }
}

exports.create = async (req, res) => {
  try {
    const body = mapAdminToReview(req.body);
    
    // Add user ID from auth token if available
    if (req.user?.id) {
      body.user = req.user.id;
    }
    
    // Validate product ID is provided
    if (!body.product) {
      return res.status(400).json({ message: 'Product ID is required' });
    }
    
    // If user is logged in, verify they have ordered this product with completed payment
    if (req.user?.id) {
      const hasOrdered = await Order.findOne({
        user: req.user.id,
        'items.product': body.product,
        paymentStatus: 'completed'
      });
      
      if (!hasOrdered) {
        return res.status(403).json({ 
          message: 'You can only review products you have purchased with completed payment' 
        });
      }
    }
    
    // Handle AWS S3 uploaded files
    let imagePaths = [];
    console.log('Review controller - req.s3FileUrls:', req.s3FileUrls);
    console.log('Review controller - req.files:', req.files);
    
    if (req.s3FileUrls && req.s3FileUrls.length > 0) {
      // Limit to 4 images
      imagePaths = req.s3FileUrls.slice(0, 4);
      console.log('Using S3 URLs:', imagePaths);
    }
    
    // Handle base64 images (for backward compatibility)
    if (body.image && typeof body.image === 'string' && body.image.startsWith('data:')) {
      try {
        const savedPath = await saveBase64Image(body.image);
        imagePaths.push(savedPath);
      } catch (err) {
        console.error('Error saving base64 image:', err);
      }
    }
    
    // Handle images array from base64
    if (Array.isArray(body.images)) {
      for (const img of body.images.slice(0, 4 - imagePaths.length)) {
        if (typeof img === 'string' && img.startsWith('data:')) {
          try {
            const savedPath = await saveBase64Image(img);
            imagePaths.push(savedPath);
          } catch (err) {
            console.error('Error saving base64 image:', err);
          }
        } else if (typeof img === 'string' && !img.startsWith('data:')) {
          // Already a path
          imagePaths.push(img);
        }
      }
    }
    
    // Limit to 4 images total
    imagePaths = imagePaths.slice(0, 4);
    
    // Set images array and legacy image field (for backward compatibility)
    if (imagePaths.length > 0) {
      body.images = imagePaths;
      body.image = imagePaths[0]; // First image as legacy field
    }
    
    const item = await Review.create(body);
    const populatedItem = await Review.findById(item._id)
      .populate('product', 'title name images salePrice')
      .populate('user', 'name email');
    
    const obj = populatedItem.toObject();
    if (obj.image) obj.image = makeAbsoluteImages(obj.image, req);
    if (obj.images) obj.images = makeAbsoluteImages(obj.images, req);
    if (obj.product && obj.product.images) {
      obj.product.images = makeAbsoluteImages(obj.product.images, req);
    }
    
    return res.status(201).json({ item: obj });
  } catch (err) {
    console.error('Review create error:', err);
    return res.status(400).json({ message: err.message || 'Invalid data' });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const item = await Review.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    if (!item) return res.status(404).json({ message: 'Not found' });
    return res.json({ item });
  } catch (err) {
    return res.status(400).json({ message: 'Invalid status' });
  }
};

exports.remove = async (req, res) => {
  try {
    const item = await Review.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: 'Not found' });
    return res.json({ message: 'Deleted' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get products with reviews grouped (for admin panel)
 */
exports.getProductsWithReviews = async (req, res) => {
  try {
    // Get all reviews with product and user populated
    const reviews = await Review.find()
      .populate('product', 'title name images salePrice')
      .populate('user', 'name email')
      .sort('-createdAt')
      .lean();
    
    // Normalize images - use images array if available, fallback to image field
    reviews.forEach(review => {
      if (!review.images || review.images.length === 0) {
        if (review.image) {
          review.images = [review.image];
        } else {
          review.images = [];
        }
      }
    });

    // Group reviews by product
    const productMap = new Map();
    
    reviews.forEach(review => {
      if (review.product && review.product._id) {
        const productId = review.product._id.toString();
        
        if (!productMap.has(productId)) {
          // Handle images - could be array or string
          let productImage = '';
          if (review.product.images) {
            if (review.product && Array.isArray(review.product.images) && review.product.images.length > 0) {
              const firstImg = review.product.images[0];
              productImage = typeof firstImg === 'object' ? firstImg.url : firstImg;
            } else if (typeof review.product.images === 'string') {
              productImage = review.product.images;
            }
          }
          
          // Use title (primary) or name (fallback) for product name
          const productName = review.product.title || review.product.name || 'Unknown Product';
          
          productMap.set(productId, {
            _id: review.product._id,
            name: productName,
            image: makeAbsoluteImages(productImage, req),
            salePrice: review.product.salePrice || 0,
            reviewCount: 0,
            reviews: []
          });
        }
        
        const product = productMap.get(productId);
        product.reviewCount += 1;
        // Normalize images - use images array if available, fallback to image field
        let reviewImages = review.images || [];
        if (reviewImages.length === 0 && review.image) {
          reviewImages = [review.image];
        }
        
        product.reviews.push({
          _id: review._id,
          rating: review.rating,
          comment: review.comment,
          image: makeAbsoluteImages(reviewImages[0] || review.image, req), // Legacy field
          images: makeAbsoluteImages(reviewImages, req), // New array field
          status: review.status,
          user: review.user ? {
            name: review.user.name,
            email: review.user.email
          } : null,
          createdAt: review.createdAt
        });
      }
    });

    // Convert to array and sort by review count (descending)
    const productsWithReviews = Array.from(productMap.values())
      .sort((a, b) => b.reviewCount - a.reviewCount);

    return res.json({ items: productsWithReviews });
  } catch (err) {
    console.error('Get products with reviews error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get products that user has ordered with completed payment (for review page)
 */
exports.getReviewableProducts = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Find all orders with completed payment for this user
    const orders = await Order.find({
      user: req.user.id,
      paymentStatus: 'completed'
    })
      .populate({
        path: 'items.product',
        select: 'name images salePrice _id'
      })
      .sort('-createdAt');

    // Extract unique products that user has ordered
    const productMap = new Map();
    
    orders.forEach(order => {
      order.items.forEach(item => {
        if (item.product && item.product._id) {
          const productId = item.product._id.toString();
          
          // Check if user has already reviewed this product
          if (!productMap.has(productId)) {
            // Handle images - could be array or string
            let productImage = '';
            if (item.product.images) {
              if (item.product && Array.isArray(item.product.images) && item.product.images.length > 0) {
                const firstImg = item.product.images[0];
                productImage = typeof firstImg === 'object' ? firstImg.url : firstImg;
              } else if (typeof item.product.images === 'string') {
                productImage = item.product.images;
              }
            }
            
            productMap.set(productId, {
              _id: item.product._id,
              name: item.product.name || item.name,
              image: makeAbsoluteImages(productImage, req),
              salePrice: item.product.salePrice || item.price,
              orderId: order._id,
              orderDate: order.createdAt
            });
          }
        }
      });
    });

    // Check which products already have reviews from this user
    const productIds = Array.from(productMap.keys());
    const existingReviews = await Review.find({
      user: req.user.id,
      product: { $in: productIds }
    }).select('product');

    const reviewedProductIds = new Set(
      existingReviews.map(r => r.product.toString())
    );

    // Filter out products that already have reviews
    const reviewableProducts = Array.from(productMap.values())
      .filter(product => !reviewedProductIds.has(product._id.toString()))
      .map(product => ({
        id: product._id,
        name: product.name,
        image: product.image,
        salePrice: product.salePrice,
        orderId: product.orderId,
        orderDate: product.orderDate
      }));

    return res.json({ items: reviewableProducts });
  } catch (err) {
    console.error('Get reviewable products error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};