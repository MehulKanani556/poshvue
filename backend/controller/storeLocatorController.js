const { StoreLocator } = require('../model');
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

  // Process stores images
  if (Array.isArray(obj.stores)) {
    obj.stores = obj.stores.map(store => ({
      ...store,
      image: processUrl(store.image)
    }));
  }

  return obj;
}

// Helper to save image (handles base64 or existing URLs)
async function saveImage(dataUrl, folder = 'stores') {
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
    let storeLocator = await StoreLocator.findOne();
    if (!storeLocator) return res.status(404).json({ message: 'Store locator not found' });
    
    const obj = storeLocator.toObject();
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
      body.bannerImage = await saveImage(body.bannerImage, 'stores');
    }

    // Process stores images
    if (Array.isArray(body.stores)) {
      for (let i = 0; i < body.stores.length; i++) {
        if (body.stores[i].image) {
          body.stores[i].image = await saveImage(body.stores[i].image, 'stores');
        }
      }
    }

    const storeLocator = await StoreLocator.findOneAndUpdate({}, body, { new: true, upsert: true });
    
    const obj = storeLocator.toObject();
    const processed = makeAbsoluteImages(obj, req);
    res.json(processed);
  } catch (err) {
    console.error('Error updating store locator:', err);
    res.status(500).json({ message: err.message });
  }
};
