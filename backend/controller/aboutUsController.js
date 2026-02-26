const AboutUs = require('../model/AboutUs');
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

  // Process ourStory image
  if (obj.ourStory && obj.ourStory.image) {
    obj.ourStory.image = processUrl(obj.ourStory.image);
  }

  return obj;
}

// Helper to save image (handles base64 or existing URLs)
async function saveImage(dataUrl, folder = 'about') {
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

const getAboutUs = async (req, res) => {
  try {
    let aboutUs = await AboutUs.findOne();
    if (!aboutUs) {
      // Return default data if none exists
      aboutUs = {
        heroHeader: {
          title: "Our Legacy",
          subtitle: "Crafting Dreams Since 2010",
        },
        ourStory: {
          image: "https://i.pinimg.com/1200x/51/af/ad/51afad40af61143805d996b127ae4951.jpg",
          subtitle: "The Journey",
          title: "Defining Elegance in Wedding Wear",
          description: [
            "Welcome to Poshvue. Our journey is fueled by a passion to make every bride feel like a queen. What started as a small dream is now a premier destination for bridal couture.",
            "We blend timeless Indian craftsmanship with modern silhouettes to create outfits that are as unique as your love story."
          ],
          stats: [
            { number: "15k+", label: "Brides" },
            { number: "25+", label: "Designers" },
          ],
        },
        whyChooseUs: [
          { icon: "Award", title: "Premium Quality", desc: "Finest fabrics and hand-work." },
          { icon: "Users", title: "Custom Styling", desc: "Made-to-measure perfection." },
          { icon: "ShieldCheck", title: "Secure Delivery", desc: "Insured global shipping." },
        ],
        visionSection: {
          quoteIcon: "Quote",
          subtitle: "Our Vision",
          visionText: "To be the global heart of Indian bridal wear, empowering every woman to celebrate her heritage with grace, ethical fashion, and unmatched luxury.",
          buttonText: "DISCOVER MORE",
        },
        experienceBanner: {
          icon: "ShoppingBag",
          title: "Experience Luxury",
          description: "Flagship Store: Surat, Gujarat, India",
        },
      };
    } else {
      aboutUs = aboutUs.toObject();
    }
    
    aboutUs = makeAbsoluteImages(aboutUs, req);
    res.json(aboutUs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateAboutUs = async (req, res) => {
  try {
    const body = { ...req.body };

    // Process ourStory image
    if (body.ourStory && body.ourStory.image) {
      body.ourStory.image = await saveImage(body.ourStory.image, 'about');
    }

    const updatedAboutUs = await AboutUs.findOneAndUpdate({}, body, { new: true, upsert: true });
    
    const obj = updatedAboutUs.toObject();
    const processed = makeAbsoluteImages(obj, req);
    
    res.json(processed);
  } catch (error) {
    console.error('Error updating about us:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAboutUs,
  updateAboutUs,
};