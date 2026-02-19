const multer = require('multer');
const path = require('path');
const sharp = require('sharp');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

// S3 Config
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY
  }
});

// Memory storage (no local save)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  if (extname && mimetype) cb(null, true);
  else cb(new Error('Only image files allowed'));
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 4 },
  fileFilter
});

/** Convert any image buffer to WebP and upload to S3; returns S3 URL */
async function bufferToWebPAndUpload(buffer, s3KeyPrefix, mimeOrExt) {
  let webpBuffer;
  try {
    webpBuffer = await sharp(buffer)
      .webp({ quality: 85 })
      .toBuffer();
  } catch (e) {
    webpBuffer = buffer;
  }
  const key = `${s3KeyPrefix}${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp`;
  await s3.send(new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET,
    Key: key,
    Body: webpBuffer,
    ContentType: 'image/webp'
  }));
  return `https://${process.env.AWS_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
}

// Multer only when multipart (so req.files is set for FormData)
const withMulterIfMultipart = (req, res, next) => {
  if (!req.is('multipart/form-data')) return next();
  upload.array('images', 4)(req, res, (err) => {
    if (err) return res.status(400).json({ message: err.message || 'Invalid upload' });
    next();
  });
};

const uploadReviewImagesHandler = async (req, res, next) => {
  try {
    const uploadedImages = [];

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const url = await bufferToWebPAndUpload(file.buffer, 'reviews/', file.mimetype);
        uploadedImages.push(url);
      }
    }

    if (req.body.image && typeof req.body.image === 'string' && req.body.image.startsWith('data:')) {
      const base64Data = req.body.image.split(';base64,').pop();
      const buffer = Buffer.from(base64Data, 'base64');
      const url = await bufferToWebPAndUpload(buffer, 'reviews/', 'image/png');
      uploadedImages.push(url);
    }

    req.uploadedImages = uploadedImages;
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Image upload failed' });
  }
};

const uploadReviewImages = [withMulterIfMultipart, uploadReviewImagesHandler];

module.exports = { uploadReviewImages, bufferToWebPAndUpload };
