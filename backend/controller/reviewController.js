const { Review, Order } = require('../model');

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
    return res.json({ items, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.create = async (req, res) => {
  try {
    const body = mapAdminToReview(req.body);

    if (req.user?.id) body.user = req.user.id;

    if (!body.product) {
      return res.status(400).json({ message: 'Product ID is required' });
    }

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

    // All images (multipart or base64) are uploaded as WebP to S3 by middleware
    let imagePaths = Array.isArray(req.uploadedImages) ? [...req.uploadedImages] : [];
    if (Array.isArray(body.images)) {
      for (const img of body.images.slice(0, 4 - imagePaths.length)) {
        if (typeof img === 'string' && !img.startsWith('data:')) imagePaths.push(img);
      }
    }
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

    return res.status(201).json({ item: populatedItem });
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
            if (Array.isArray(review.product.images) && review.product.images.length > 0) {
              productImage = review.product.images[0];
            } else if (typeof review.product.images === 'string') {
              productImage = review.product.images;
            }
          }

          // Use title (primary) or name (fallback) for product name
          const productName = review.product.title || review.product.name || 'Unknown Product';

          productMap.set(productId, {
            _id: review.product._id,
            name: productName,
            image: productImage,
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
          image: reviewImages[0] || review.image, // Legacy field
          images: reviewImages, // New array field
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
              if (Array.isArray(item.product.images) && item.product.images.length > 0) {
                productImage = item.product.images[0];
              } else if (typeof item.product.images === 'string') {
                productImage = item.product.images;
              }
            }

            productMap.set(productId, {
              _id: item.product._id,
              name: item.product.name || item.name,
              image: productImage,
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