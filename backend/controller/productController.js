const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);
const unlink = promisify(fs.unlink);

const { Product, Category, ShippingPolicy } = require('../model');

/* -------------------- Helpers -------------------- */

function mapAdminToProduct(payload) {
  const body = { ...payload };

  if (body.name && !body.title) body.title = body.name;

  if (typeof body.status === 'string') {
    body.active = body.status !== 'Inactive';
  }

  if (typeof body.price === 'number') {
    const discount =
      typeof body.discountPercent === 'number' ? body.discountPercent : 0;

    body.salePrice =
      typeof body.salePrice === 'number'
        ? body.salePrice
        : Number((body.price - body.price * (discount / 100)).toFixed(2));
  }

  if (Array.isArray(body.images)) {
    body.images = body.images.filter((img) => typeof img === 'string');
  }

  return body;
}

async function saveBase64Image(dataUrl) {
  const match = /^data:(image\/[a-zA-Z]+);base64,(.+)$/.exec(dataUrl);
  if (!match) throw new Error('Invalid image data');

  const mime = match[1];
  let ext = mime.split('/')[1];
  if (ext === 'jpeg') ext = 'jpg';

  const buffer = Buffer.from(match[2], 'base64');
  const MAX_BYTES = 5 * 1024 * 1024;

  if (buffer.length > MAX_BYTES) {
    throw new Error('Image too large');
  }

  const uploadDir = path.join(__dirname, '..', 'uploads', 'products');
  await mkdir(uploadDir, { recursive: true });

  const filename = `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}.${ext}`;

  const filePath = path.join(uploadDir, filename);
  await writeFile(filePath, buffer);

  return `/uploads/products/${filename}`;
}

async function processImagesArray(images) {
  const out = [];

  for (const img of images) {
    if (typeof img === 'string' && img.startsWith('data:')) {
      const saved = await saveBase64Image(img);
      out.push(saved);
    } else if (typeof img === 'string') {
      out.push(img);
    }
  }

  return out;
}

function makeAbsoluteImages(images, req) {
  if (!Array.isArray(images)) return images;
  const host = `${req.protocol}://${req.get('host')}`;

  return images.map((img) =>
    typeof img === 'string' && img.startsWith('/uploads/')
      ? host + img
      : img
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

exports.create = async (req, res) => {
  try {
    const body = mapAdminToProduct(req.body);

    if (Array.isArray(body.images)) {
      body.images = await processImagesArray(body.images);
    }

    await resolveCategory(body);

    const item = await Product.create(body);
    const populated = await Product.findById(item._id).populate('categories');

    const obj = populated.toObject();
    obj.images = makeAbsoluteImages(obj.images, req);

    res.status(201).json({ item: obj });
  } catch (err) {
    res.status(400).json({ message: 'Invalid data' });
  }
};

exports.update = async (req, res) => {
  try {
    const body = mapAdminToProduct(req.body);
    await resolveCategory(body);

    const existing = await Product.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Not found' });

    // ✅ SAFE image detection
    const imagesProvided = Array.isArray(req.body.images);

    if (imagesProvided) {
      body.images = await processImagesArray(body.images);
    } else {
      delete body.images;
    }

    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      body,
      { new: true }
    ).populate('categories');

    // ✅ delete only when images explicitly updated
    if (imagesProvided) {
      const oldImages = existing.images || [];
      const newImages = body.images || [];
      const prefix = '/uploads/products/';

      for (const img of oldImages) {
        if (img.startsWith(prefix) && !newImages.includes(img)) {
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
