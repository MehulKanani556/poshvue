const { Wishlist } = require('../model');

// Helper function to fix image URLs
function makeAbsoluteImages(images, req) {
  if (!Array.isArray(images)) return images;
  const host = `${req.protocol}://${req.get('host')}`;

  return images.map((img) => {
    let finalImg = img;
    
    // Fix -website in bucket name and s3-website. in domain
    if (typeof img === 'string') {
      finalImg = img
        .replace('s3-website.', 's3.')
        .replace('-website.s3.', '.s3.');
    } else if (img && typeof img === 'object' && img.url) {
        finalImg = { ...img };
        finalImg.url = img.url
            .replace('s3-website.', 's3.')
            .replace('-website.s3.', '.s3.');
    }
    
    // Handle relative URLs
    if (typeof finalImg === 'string' && finalImg.startsWith('/uploads/')) {
      return host + finalImg;
    } else if (finalImg && typeof finalImg === 'object' && typeof finalImg.url === 'string' && finalImg.url.startsWith('/uploads/')) {
        finalImg.url = host + finalImg.url;
    }
    
    return finalImg;
  });
}

/* GET WISHLIST */
exports.getWishlist = async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.user.id })
      .populate("items.product");

    if (wishlist && wishlist.items) {
      wishlist.items = wishlist.items.map(item => {
        if (item.product && item.product.images) {
          item.product.images = makeAbsoluteImages(item.product.images, req);
        }
        return item;
      });
    }

    res.json(wishlist || { user: req.user.id, items: [] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ADD / REMOVE PRODUCT */
exports.toggleWishlist = async (req, res) => {
  try {
    const { productId } = req.body;

    let wishlist = await Wishlist.findOne({ user: req.user.id });

    if (!wishlist) {
      wishlist = await Wishlist.create({
        user: req.user.id,
        items: [{ product: productId }]
      });
      return res.json(wishlist);
    }

    const index = wishlist.items.findIndex(
      (i) => i.product.toString() === productId
    );

    if (index > -1) {
      wishlist.items.splice(index, 1); // remove
    } else {
      wishlist.items.push({ product: productId }); // add
    }

    await wishlist.save();
    res.json(wishlist);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.removeWishlistItem = async (req, res) => {
  try {
    const { productId } = req.params;

    const wishlist = await Wishlist.findOne({ user: req.user.id });

    if (!wishlist) return res.status(404).json({ message: "Wishlist not found" });

    const index = wishlist.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (index === -1) {
      return res.status(404).json({ message: "Product not in wishlist" });
    }

    wishlist.items.splice(index, 1); // remove the item
    await wishlist.save();

    res.json({ message: "Product removed from wishlist", wishlist });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
