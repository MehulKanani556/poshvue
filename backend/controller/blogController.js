const { Blog } = require('../model');
const { uploadBase64Image, fixWebsiteUrl } = require('../utils/awsUpload');

/* -------------------- Helpers -------------------- */

// Helper function to make image URLs absolute for local files (if any) and fix S3 URLs
function makeAbsoluteImages(images, req) {
  if (!Array.isArray(images)) return images;
  const host = `${req.protocol}://${req.get('host')}`;

  return images.map((img) => {
    let finalImg = img;
    
    // First fix any -website URLs
    if (typeof img === 'string') {
      finalImg = fixWebsiteUrl(img);
    }
    
    // Then handle relative URLs
    if (typeof finalImg === 'string' && finalImg.startsWith('/uploads/')) {
      return host + finalImg;
    }
    
    return finalImg; // Keep S3 URLs as-is (but fixed)
  });
}

// Helper function to save base64 image to AWS S3
async function saveBase64Image(dataUrl) {
  try {
    return await uploadBase64Image(dataUrl, 'blogs');
  } catch (error) {
    console.error('Error uploading base64 image to S3:', error);
    throw error;
  }
}

async function processImagesArray(images) {
  const out = [];

  for (const img of images) {
    if (typeof img === 'string' && img.startsWith('data:')) {
      const saved = await saveBase64Image(img);
      out.push(saved);
    } else if (typeof img === 'string') {
      // Keep S3 URLs as-is, but fix them if needed
      out.push(fixWebsiteUrl(img));
    }
  }

  return out;
}

function slugify(str) {
  return String(str || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function mapAdminToBlog(payload) {
  const body = { ...payload };
  // Accept content as array of { head, body } and map to sections
  if (Array.isArray(body.content)) {
    const blocks = body.content
      .filter(b => b && (b.head || b.heading || b.body))
      .map(b => ({ heading: b.head || b.heading || '', body: b.body || '' }));
    body.sections = blocks;
    delete body.content;
  }
  // Ensure sections supports incoming { head, body } or { heading, body }
  if (Array.isArray(body.sections)) {
    body.sections = body.sections
      .filter(s => s && (s.head || s.heading || s.body))
      .map(s => ({ heading: s.head || s.heading || '', body: s.body || '' }));
  }
  if (Array.isArray(body.tips)) {
    body.tips = body.tips.filter(t => typeof t === 'string' && t.trim().length);
  }
  if (Array.isArray(body.images)) {
    body.images = body.images.filter(u => typeof u === 'string' && u.trim().length);
  }
  // Derive slug from title if missing
  if (body.title && !body.slug) body.slug = slugify(body.title);
  return body;
}

exports.list = async (req, res) => {
  try {
    const { page = 1, limit = 10, q, tag, sort = '-createdAt' } = req.query;
    const query = {};
    if (q) query.title = { $regex: q, $options: 'i' };
    if (tag) query.tags = tag;

    const [items, total] = await Promise.all([
      Blog.find(query).sort(sort).skip((page - 1) * limit).limit(Number(limit)),
      Blog.countDocuments(query),
    ]);

    const processedItems = items.map(item => {
      const obj = item.toObject();
      obj.images = makeAbsoluteImages(obj.images, req);
      return obj;
    });

    return res.json({ items: processedItems, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.get = async (req, res) => {
  try {
    const item = await Blog.findOne({ slug: req.params.slug });
    if (!item) return res.status(404).json({ message: 'Not found' });
    
    const obj = item.toObject();
    obj.images = makeAbsoluteImages(obj.images, req);

    return res.json({ item: obj });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.create = async (req, res) => {
  try {
    const body = mapAdminToBlog(req.body);

    // Handle AWS S3 uploaded files from middleware
    let imagePaths = [];
    if (req.s3FileUrls && req.s3FileUrls.length > 0) {
      imagePaths = req.s3FileUrls;
    }

    // Handle images array from body (might contain base64 or existing URLs)
    if (body.images && Array.isArray(body.images)) {
      const processedImages = await processImagesArray(body.images);
      imagePaths.push(...processedImages);
    }

    // Remove duplicates and set images
    if (imagePaths.length > 0) {
      body.images = [...new Set(imagePaths)];
    }

    const item = await Blog.create(body);
    const obj = item.toObject();
    obj.images = makeAbsoluteImages(obj.images, req);

    return res.status(201).json({ item: obj });
  } catch (err) {
    console.error('Error in blog create:', err);
    return res.status(400).json({ message: err.message || 'Invalid data' });
  }
};

exports.update = async (req, res) => {
  try {
    const body = mapAdminToBlog(req.body);

    // Handle AWS S3 uploaded files from middleware
    let imagePaths = [];
    if (req.s3FileUrls && req.s3FileUrls.length > 0) {
      imagePaths = req.s3FileUrls;
    }

    // Handle images array from body (might contain base64 or existing URLs)
    if (body.images && Array.isArray(body.images)) {
      const processedImages = await processImagesArray(body.images);
      imagePaths.push(...processedImages);
    }

    // If we have any images (from S3 or processed base64), update the body
    if (imagePaths.length > 0) {
      body.images = [...new Set(imagePaths)];
    } else if (req.body.images === null || (Array.isArray(req.body.images) && req.body.images.length === 0)) {
      // If images were explicitly cleared
      body.images = [];
    }

    const item = await Blog.findByIdAndUpdate(req.params.id, body, { new: true });
    if (!item) return res.status(404).json({ message: 'Not found' });
    
    const obj = item.toObject();
    obj.images = makeAbsoluteImages(obj.images, req);

    return res.json({ item: obj });
  } catch (err) {
    console.error('Error in blog update:', err);
    return res.status(400).json({ message: err.message || 'Invalid data' });
  }
};

exports.remove = async (req, res) => {
  try {
    const item = await Blog.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: 'Not found' });
    return res.json({ message: 'Deleted' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};