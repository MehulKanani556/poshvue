const { Category } = require('../model');
const { uploadBase64Image } = require('../utils/awsUpload');

async function processCategoryImage(body, req) {
  // 1. Handle S3 upload from middleware (FormData)
  if (req.s3FileUrls && req.s3FileUrls.length > 0) {
    body.image = req.s3FileUrls[0];
    return;
  }

  // 2. Handle base64 image from body (JSON)
  if (typeof body.image === 'string' && body.image.startsWith('data:')) {
    try {
      const saved = await uploadBase64Image(body.image, 'categories');
      body.image = saved;
    } catch (error) {
      console.error('Error uploading base64 category image:', error);
    }
  }

  // 3. If it's an empty string or explicitly "null", we might want to clear it
  if (body.image === '' || body.image === 'null') {
    body.image = null;
  }
}

function mapAdminToCategory(payload) {
  const body = { ...payload };
  // Map status -> active
  if (typeof body.status === 'string') {
    body.active = body.status === 'Active';
    delete body.status;
  }
  return body;
}

exports.list = async (req, res) => {
  try {
    const { page = 1, limit = 50, q, sort = 'name' } = req.query;
    const query = {};
    if (q) query.name = { $regex: q, $options: 'i' };
    const [items, total] = await Promise.all([
      Category.find(query).sort(sort).skip((page - 1) * limit).limit(Number(limit)),
      Category.countDocuments(query),
    ]);
    return res.json({ items, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.get = async (req, res) => {
  try {
    const item = await Category.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Not found' });
    return res.json({ item });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.create = async (req, res) => {
  try {
    const body = mapAdminToCategory(req.body);
    
    // Process image (S3 or base64)
    await processCategoryImage(body, req);

    // slug from name if not provided
    if (body.name && !body.slug) body.slug = body.name.toLowerCase().replace(/\s+/g, '-');
    const item = await Category.create(body);
    return res.status(201).json({ item });
  } catch (err) {
    console.error('Category create error:', err);
    return res.status(400).json({ message: err.message || 'Invalid data' });
  }
};

exports.update = async (req, res) => {
  try {
    const body = mapAdminToCategory(req.body);

    // Process image (S3 or base64)
    await processCategoryImage(body, req);

    if (body.name && !body.slug) body.slug = body.name.toLowerCase().replace(/\s+/g, '-');
    const item = await Category.findByIdAndUpdate(req.params.id, body, { new: true });
    if (!item) return res.status(404).json({ message: 'Not found' });
    return res.json({ item });
  } catch (err) {
    console.error('Category update error:', err);
    return res.status(400).json({ message: err.message || 'Invalid data' });
  }
};

exports.remove = async (req, res) => {
  try {
    const item = await Category.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: 'Not found' });
    return res.json({ message: 'Deleted' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};