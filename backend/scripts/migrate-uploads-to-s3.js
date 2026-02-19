/**
 * Migrate existing images from backend/uploads to AWS S3 as WebP.
 * Run from backend: node scripts/migrate-uploads-to-s3.js
 * Requires: .env with AWS_* and MONGO_URI
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const path = require('path');
const fs = require('fs').promises;
const sharp = require('sharp');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const mongoose = require('mongoose');

const uploadsDir = path.join(__dirname, '..', 'uploads');
const BUCKET = process.env.AWS_BUCKET;
const REGION = process.env.AWS_REGION;

if (!BUCKET || !REGION || !process.env.AWS_ACCESS_KEY || !process.env.AWS_SECRET_KEY) {
  console.error('Missing AWS_* in .env');
  process.exit(1);
}

const s3 = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY
  }
});

async function listFiles(dir, base = '') {
  let list = [];
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(dir, e.name);
      const rel = base ? `${base}/${e.name}` : e.name;
      if (e.isDirectory()) {
        list = list.concat(await listFiles(full, rel));
      } else if (/\.(jpg|jpeg|png|gif|webp)$/i.test(e.name)) {
        list.push(rel);
      }
    }
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }
  return list;
}

async function uploadFileAsWebP(relativePath) {
  const fullPath = path.join(uploadsDir, relativePath);
  const buffer = await fs.readFile(fullPath);
  let webpBuffer;
  try {
    webpBuffer = await sharp(buffer).webp({ quality: 85 }).toBuffer();
  } catch (e) {
    webpBuffer = buffer;
  }
  const key = `migrated/${relativePath.replace(/\.[a-z]+$/i, '')}.webp`;
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: webpBuffer,
    ContentType: 'image/webp'
  }));
  const url = `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;
  return url;
}

async function run() {
  const relativeFiles = await listFiles(uploadsDir);
  if (relativeFiles.length === 0) {
    console.log('No image files in uploads folder. Nothing to migrate.');
    return;
  }

  const pathToUrl = {};
  for (const rel of relativeFiles) {
    const urlPath = `/uploads/${rel.replace(/\\/g, '/')}`;
    try {
      const url = await uploadFileAsWebP(rel);
      pathToUrl[urlPath] = url;
      console.log('Uploaded:', urlPath, '->', url);
    } catch (err) {
      console.error('Failed:', urlPath, err.message);
    }
  }

  if (Object.keys(pathToUrl).length === 0) {
    console.log('No files uploaded. Skipping DB update.');
    return;
  }

  await mongoose.connect(process.env.MONGO_URI);
  const { Product, Review, Blog, Category } = require('../model');

  const replaceUrl = (str) => {
    if (!str || typeof str !== 'string') return str;
    if (pathToUrl[str]) return pathToUrl[str];
    const m = str.match(/(\/uploads\/[^#?]+)/);
    return (m && pathToUrl[m[1]]) ? pathToUrl[m[1]] : str;
  };

  for (const modelName of ['Product', 'Review', 'Blog', 'Category']) {
    const Model = { Product, Review, Blog, Category }[modelName];
    const docs = await Model.find({}).lean();
    let updated = 0;
    for (const doc of docs) {
      const update = {};
      if (Model.schema.paths.images && Array.isArray(doc.images)) {
        const newImages = doc.images.map((img) => replaceUrl(img));
        if (JSON.stringify(newImages) !== JSON.stringify(doc.images)) {
          update.images = newImages;
        }
      }
      if (Model.schema.paths.image && doc.image) {
        const newImage = replaceUrl(doc.image);
        if (newImage !== doc.image) update.image = newImage;
      }
      if (Object.keys(update).length) {
        await Model.updateOne({ _id: doc._id }, { $set: update });
        updated++;
      }
    }
    console.log(modelName, 'updated', updated, 'documents');
  }

  await mongoose.disconnect();
  console.log('Migration done. Old files are still in backend/uploads (delete manually if desired).');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
