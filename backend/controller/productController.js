// Top-level imports
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const unlink = promisify(fs.unlink);

const { Product, Category, ShippingPolicy, Country } = require('../model');
const { bufferToWebPAndUpload } = require('../middleware/upload');

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
    body.images = body.images.filter((img) => typeof img === 'string');
  }

  return body;
}

async function saveBase64Image(dataUrl) {
  const match = /^data:(image\/[a-zA-Z]+);base64,(.+)$/.exec(dataUrl);
  if (!match) throw new Error('Invalid image data');

  const buffer = Buffer.from(match[2], 'base64');
  const MAX_BYTES = 5 * 1024 * 1024;
  if (buffer.length > MAX_BYTES) throw new Error('Image too large');

  return bufferToWebPAndUpload(buffer, 'products/', match[1]);
}

async function processImagesArray(images) {
  const out = [];

  for (const img of images) {
    if (typeof img === 'string' && img.startsWith('data:')) {
      const saved = await saveBase64Image(img);
      out.push(saved);
    } else if (typeof img === 'string') {
      // Keep S3/full URLs as-is; normalize legacy full URL to path for DB
      if (img.startsWith('http')) {
        const idx = img.indexOf('/uploads/products/');
        if (idx !== -1) out.push(img.slice(idx));
        else out.push(img);
      } else {
        out.push(img);
      }
    }
  }

  return out;
}

function makeAbsoluteImages(images, req) {
  if (!Array.isArray(images)) return images;
  const host = `${req.protocol}://${req.get('host')}`;
  return images.map((img) =>
    typeof img === 'string' && img.startsWith('/uploads/') ? host + img : img
  );
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

// exports.create = async (req, res) => {
exports.create = async (req, res) => {
  try {
    const body = mapAdminToProduct(req.body);

    if (Array.isArray(body.images)) {
      body.images = await processImagesArray(body.images);
    }

    await resolveCategory(body);
    // Ensure base price exists when using pricesByCountry
    await ensureBasePriceFromCountry(body);

    const item = await Product.create(body);
    const populated = await Product.findById(item._id).populate('categories');

    const obj = populated.toObject();
    obj.images = makeAbsoluteImages(obj.images, req);

    res.status(201).json({ item: obj });
  } catch (err) {
    res.status(400).json({ message: 'Invalid data' });
  }
};

// exports.update = async (req, res) => {
exports.update = async (req, res) => {
  try {
    const body = mapAdminToProduct(req.body);
    await resolveCategory(body);

    const existing = await Product.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Not found' });

    const imagesProvided = Array.isArray(req.body.images);

    if (imagesProvided) {
      body.images = await processImagesArray(body.images);
    } else {
      delete body.images;
    }

    // remove ensureBasePriceFromCountry (deleted)
    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      body,
      { new: true }
    ).populate('categories');

    // ✅ delete only when images explicitly updated (normalize new images for compare)
    if (imagesProvided) {
      const oldImages = existing.images || [];
      const newImagesNormalized = (body.images || []).map((img) => {
        if (typeof img !== 'string') return img;
        if (img.startsWith('http')) {
          const idx = img.indexOf('/uploads/products/');
          return idx !== -1 ? img.slice(idx) : img;
        }
        return img;
      });
      const prefix = '/uploads/products/';

      for (const img of oldImages) {
        if (img.startsWith(prefix) && !newImagesNormalized.includes(img)) {
          const filePath = path.join(__dirname, '..', img);
          try {
            await unlink(filePath);
          } catch (e) {}
        }
      }
    }

    const obj = updated.toObject();
    obj.images = makeAbsoluteImages(obj.images, req);

    res.json({ item: obj });
  } catch (err) {
    res.status(400).json({ message: 'Invalid data' });
  }
};


exports.remove = async (req, res) => {
  try {
    const item = await Product.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: 'Not found' });

    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
