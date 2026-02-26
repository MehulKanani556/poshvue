const { Story } = require('../model');
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

  // Process hero backgroundImage
  if (obj.hero && obj.hero.backgroundImage) {
    obj.hero.backgroundImage = processUrl(obj.hero.backgroundImage);
  }

  // Process philosophy image
  if (obj.philosophy && obj.philosophy.image) {
    obj.philosophy.image = processUrl(obj.philosophy.image);
  }

  // Process craftsmanship image
  if (obj.craftsmanship && obj.craftsmanship.image) {
    obj.craftsmanship.image = processUrl(obj.craftsmanship.image);
  }

  return obj;
}

// Helper to save image (handles base64 or existing URLs)
async function saveImage(dataUrl, folder = 'story') {
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

exports.getStory = async (req, res) => {
  try {
    let story = await Story.findOne();
    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }
    
    const obj = story.toObject();
    const processed = makeAbsoluteImages(obj, req);
    res.json(processed);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateStory = async (req, res) => {
  try {
    const body = { ...req.body };

    // Process hero backgroundImage
    if (body.hero && body.hero.backgroundImage) {
      body.hero.backgroundImage = await saveImage(body.hero.backgroundImage, 'story');
    }

    // Process philosophy image
    if (body.philosophy && body.philosophy.image) {
      body.philosophy.image = await saveImage(body.philosophy.image, 'story');
    }

    // Process craftsmanship image
    if (body.craftsmanship && body.craftsmanship.image) {
      body.craftsmanship.image = await saveImage(body.craftsmanship.image, 'story');
    }

    const story = await Story.findOneAndUpdate({}, body, { new: true, upsert: true });
    
    const obj = story.toObject();
    const processed = makeAbsoluteImages(obj, req);
    res.json(processed);
  } catch (error) {
    console.error('Error updating story:', error);
    res.status(500).json({ message: error.message });
  }
};