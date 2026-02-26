const { ContactPage } = require('../model');
const { uploadBase64Image, fixWebsiteUrl } = require('../utils/awsUpload');

/* -------------------- Helpers -------------------- */

// Helper function to make image URLs absolute and fix S3 URLs
function makeAbsoluteImages(obj, req) {
  if (!obj) return obj;
  const host = `${req.protocol}://${req.get('host')}`;

  const processUrl = (url) => {
    if (typeof url !== 'string') return url;
    let finalUrl = fixWebsiteUrl(url);
    if (finalUrl.startsWith('/uploads/')) {
      return host + finalUrl;
    }
    return finalUrl;
  };

  // Process bannerImage
  if (obj.bannerImage) {
    obj.bannerImage = processUrl(obj.bannerImage);
  }

  return obj;
}

// Helper to save image (handles base64 or existing URLs)
async function saveImage(dataUrl, folder = 'contact') {
  if (typeof dataUrl === 'string' && dataUrl.startsWith('data:')) {
    try {
      return await uploadBase64Image(dataUrl, folder);
    } catch (error) {
      console.error(`Error uploading ${folder} image to S3:`, error);
      throw error;
    }
  }
  return fixWebsiteUrl(dataUrl);
}

exports.get = async (req, res) => {
  try {
    let page = await ContactPage.findOne();
    if (!page) return res.status(404).json({ message: 'Contact page not found' });
    
    const obj = page.toObject();
    const processed = makeAbsoluteImages(obj, req);
    res.json(processed);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const body = { ...req.body };

    // Process bannerImage
    if (body.bannerImage) {
      body.bannerImage = await saveImage(body.bannerImage, 'contact');
    }

    const page = await ContactPage.findOneAndUpdate({}, body, { new: true, upsert: true });
    
    const obj = page.toObject();
    const processed = makeAbsoluteImages(obj, req);
    res.json(processed);
  } catch (err) {
    console.error('Error updating contact page:', err);
    res.status(500).json({ message: err.message });
  }
};
