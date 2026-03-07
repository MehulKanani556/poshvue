// Top-level imports
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);
const unlink = promisify(fs.unlink);
const { 
  uploadBase64Image, 
  fixWebsiteUrl,
  deleteMultipleImagesFromS3 
} = require('../utils/awsUpload');

const { Product, Category, ShippingPolicy, Country } = require('../model');

/* -------------------- Helpers -------------------- */

// function mapAdminToProduct(payload)
function mapAdminToProduct(payload) {
  const body = { ...payload };

  if (body.name && !body.title) body.title = body.name;

  if (typeof body.status === 'string') {
    body.active = body.status !== 'Inactive';
  }

  // if (typeof body.price === 'number') {
  //   const discount =
  //     typeof body.discountPercent === 'number' ? body.discountPercent : 0;

  //   body.salePrice =
  //     typeof body.salePrice === 'number'
  //       ? body.salePrice
  //       : Number((body.price - body.price * (discount / 100)).toFixed(2));
  // }

  // Country-wise pricing normalization + salePrice compute
  if (Array.isArray(body.pricesByCountry)) {
    body.pricesByCountry = body.pricesByCountry
      .map((row) => {
        const country = row.country;
        const rawPrice = Number(row.price || 0);
        const rawDiscount = Number(row.discountPercent || 0);
        const sale = Number.isFinite(rawPrice)
          ? Number((rawPrice - rawPrice * (rawDiscount / 100)).toFixed(2))
          : undefined;
        return country && Number.isFinite(rawPrice)
          ? { country, price: rawPrice, discountPercent: rawDiscount, salePrice: sale }
          : null;
      })
      .filter(Boolean);
  }

  if (Array.isArray(body.images)) {
    body.images = body.images.filter((img) => {
      if (typeof img === 'string') return true;
      if (img && typeof img === 'object' && img.url) return true;
      return false;
    });
  }

  return body;
}

async function saveBase64Image(dataUrl) {
  try {
    return await uploadBase64Image(dataUrl, 'products');
  } catch (error) {
    console.error('Error uploading base64 image to S3:', error);
    throw error;
  }
}

async function processImagesArray(images) {
  const out = [];

  for (const imgItem of images) {
    let imgUrl = typeof imgItem === 'string' ? imgItem : imgItem.url;
    const imgColor = typeof imgItem === 'string' ? null : imgItem.color;

    if (typeof imgUrl === 'string' && imgUrl.startsWith('data:')) {
      const saved = await saveBase64Image(imgUrl);
      out.push({ url: saved, color: imgColor });
    } else if (typeof imgUrl === 'string') {
      // Keep S3 URLs as-is
      if (imgUrl.startsWith('http')) {
        out.push({ url: imgUrl, color: imgColor });
      } else {
        out.push({ url: imgUrl, color: imgColor });
      }
    }
  }

  return out;
}

function makeAbsoluteImages(images, req) {
  if (!Array.isArray(images)) return images;
  const host = `${req.protocol}://${req.get('host')}`;

  return images.map((imgItem) => {
    // backward compatibility: if imgItem is string, wrap it
    let imgObj = typeof imgItem === 'string' ? { url: imgItem } : imgItem;
    let finalUrl = imgObj.url;
    
    // First fix any -website URLs
    if (typeof finalUrl === 'string') {
      finalUrl = fixWebsiteUrl(finalUrl);
    }
    
    // Then handle relative URLs
    if (typeof finalUrl === 'string' && finalUrl.startsWith('/uploads/')) {
      finalUrl = host + finalUrl;
    }
    
    return { ...imgObj, url: finalUrl };
  });
}

async function resolveCategory(body) {
  if (body.category && !body.categories) {
    const found = await Category.findOne({ name: body.category });
    if (found) body.categories = [found._id];
    delete body.category;
  }
}

/* -------------------- APIs -------------------- */

exports.list = async (req, res) => {
  try {
    let { page = 1, limit = 5000, q, sort = '-createdAt', category } = req.query;

    page = Number(page);
    limit = Number(limit);

    const query = {};
    if (q) query.title = { $regex: q, $options: 'i' };
    if (category) query.categories = { $in: [category] };
    
    // Only show active products for public view, unless all=true is specified (for admin)
    if (req.query.all !== 'true') {
      query.active = { $ne: false }; // Show active or where active field is missing
    }

    const findQuery = Product.find(query)
      .sort(sort)
      .populate('categories');

    // ✅ limit = 0 → no pagination (return all)
    if (limit > 0) {
      findQuery.skip((page - 1) * limit).limit(limit);
    }

    const [items, total] = await Promise.all([
      findQuery,
      Product.countDocuments(query),
    ]);

    const itemsOut = items.map((it) => {
      const obj = it.toObject();
      obj.images = makeAbsoluteImages(obj.images, req);
      return obj;
    });

    res.json({
      items: itemsOut,
      total,
      page,
      limit,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};


exports.get = async (req, res) => {
  try {
    const item = await Product.findById(req.params.id).populate('categories');
    if (!item) return res.status(404).json({ message: 'Not found' });

    const obj = item.toObject();
    obj.images = makeAbsoluteImages(obj.images, req);

    res.json({ item: obj });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Add: ensure base price is present when using country-wise pricing
async function ensureBasePriceFromCountry(body) {
  // if base price is already provided and is a number, ensure salePrice is in sync and return
  if (typeof body.price === 'number') {
    if (typeof body.salePrice !== 'number') {
      const discount = typeof body.discountPercent === 'number' ? body.discountPercent : 0;
      body.salePrice = Number((body.price - body.price * (discount / 100)).toFixed(2));
    }
    return;
  }

  // no base price → derive from country-wise pricing if present
  if (!Array.isArray(body.pricesByCountry) || body.pricesByCountry.length === 0) {
    return; // will fail validation later if truly missing
  }

  let chosen = body.pricesByCountry[0];

  // Prefer default country if available
  try {
    const def = await Country.findOne({ isDefault: true, active: true }).select('_id').lean();
    if (def) {
      const foundRow = body.pricesByCountry.find((row) => String(row.country) === String(def._id));
      if (foundRow) chosen = foundRow;
    }
  } catch (e) {
    // non-blocking if default country lookup fails
  }

  // Set base fields from chosen country price/discount
  body.price = Number(chosen.price);
  const disc = Number(chosen.discountPercent || 0);
  body.discountPercent = Number.isFinite(disc) ? disc : (body.discountPercent || 0);
  body.salePrice = Number.isFinite(Number(chosen.salePrice))
    ? Number(chosen.salePrice)
    : Number((body.price - body.price * (body.discountPercent / 100)).toFixed(2));
}

exports.create = async (req, res) => {
  try {
    const body = mapAdminToProduct(req.body);

    // Handle AWS S3 uploaded files
    let imagePaths = [];
    console.log('Product controller - req.s3FileUrls:', req.s3FileUrls);
    console.log('Product controller - req.files:', req.files);

    if (req.s3FileUrls && req.s3FileUrls.length > 0) {
      // Limit to 10 images for products
      imagePaths = req.s3FileUrls.slice(0, 10).map(url => ({ url }));
      console.log('Using S3 URLs for products:', imagePaths);
    }

    // Handle base64 images (for backward compatibility)
    if (body.images && Array.isArray(body.images)) {
      const processedImages = await processImagesArray(body.images);
      imagePaths.push(...processedImages);
    }

    // Limit to 10 images total and remove duplicates
    imagePaths = [...new Set(imagePaths)].slice(0, 10);

    // Set images array
    if (imagePaths.length > 0) {
      body.images = imagePaths;
    }

    await resolveCategory(body);
    // Ensure base price exists when using pricesByCountry
    await ensureBasePriceFromCountry(body);

    const item = await Product.create(body);
    const populated = await Product.findById(item._id).populate('categories');

    const obj = populated.toObject();
    obj.images = makeAbsoluteImages(obj.images, req);

    res.status(201).json({ 
      item: obj,
      message: 'Product created successfully'
    });
  } catch (err) {
    res.status(400).json({ message: err.message || 'Invalid data' });
  }
};

// exports.update = async (req, res) => {
exports.update = async (req, res) => {
  try {
    console.log('\n========== PRODUCT UPDATE START ==========');
    console.log('Product ID:', req.params.id);
    
    const body = mapAdminToProduct(req.body);
    await resolveCategory(body);

    const existing = await Product.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Not found' });

    const imagesProvided = Array.isArray(req.body.images);

    if (imagesProvided) {
      // 🟢 Step 1: Get old images from database
      const oldImages = Array.isArray(existing.images) ? existing.images : [];
      console.log(`\n📸 Found ${oldImages.length} old images in database`);

      // 🟢 Step 2: Process new images first (to ensure they upload successfully)
      console.log('\n📤 Processing and uploading new images...');
      const newImages = await processImagesArray(body.images);
      console.log(`✅ Successfully processed ${newImages.length} new images`);
      
      // 🟢 Step 3: Only delete images that are being replaced
      // Find images to delete (old images that are not in the new set)
      const newImageUrls = new Set(newImages.map(img => img.url));
      const imagesToDelete = oldImages
        .map(img => typeof img === 'string' ? img : img.url)
        .filter(oldImg => !newImageUrls.has(oldImg));
      
      if (imagesToDelete.length > 0) {
        console.log(`🗑️  Deleting ${imagesToDelete.length} old images from S3...`);
        const deleteResult = await deleteMultipleImagesFromS3(imagesToDelete);
        console.log(`\n✅ Deletion complete: ${deleteResult.deleted}/${deleteResult.total} deleted successfully`);
        if (deleteResult.failed > 0) {
          console.warn(`⚠️  Warning: ${deleteResult.failed} images failed to delete from S3`);
        }
      } else {
        console.log('ℹ️  No images to delete - keeping existing images');
      }
      
      // 🟢 Step 4: Replace images in database
      body.images = newImages;
      console.log(`✅ Ready to update database with ${newImages.length} new images`);
    } else {
      delete body.images;
    }

    // Update product in database
    console.log('\n💾 Updating product in database...');
    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      body,
      { new: true }
    ).populate('categories');

    console.log('✅ Product updated in database');

    if (imagesProvided) {
      console.log(`✅ Images updated: old deleted from S3, ${body.images.length} new images stored`);
    }
    
    console.log('========== PRODUCT UPDATE COMPLETE ==========\n');

    const obj = updated.toObject();
    obj.images = makeAbsoluteImages(obj.images, req);

    res.json({ 
      item: obj,
      message: 'Product updated successfully'
    });
  } catch (err) {
    res.status(400).json({ message: 'Invalid data' });
  }
};


exports.remove = async (req, res) => {
  try {
    console.log('🗑️ Delete Request - Product ID:', req.params.id);
    console.log('🔍 Looking for product with ID:', req.params.id);
    
    const item = await Product.findByIdAndDelete(req.params.id);
    if (!item) {
      console.log('❌ Product not found with ID:', req.params.id);
      return res.status(404).json({ message: 'Not found' });
    }

    console.log('✅ Product deleted successfully:', item.title || item.name);
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    console.log('❌ Delete error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};
