const HomePoster = require('../model/HomePoster');
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

  // Process mainContent image
  if (obj.mainContent && obj.mainContent.image) {
    obj.mainContent.image = processUrl(obj.mainContent.image);
  }

  // Process cards images
  if (Array.isArray(obj.cards)) {
    obj.cards = obj.cards.map(card => ({
      ...card,
      image: processUrl(card.image)
    }));
  }

  return obj;
}

// Helper to save image (handles base64 or existing URLs)
async function saveImage(dataUrl) {
  if (typeof dataUrl === 'string' && dataUrl.startsWith('data:')) {
    try {
      // Still support base64 just in case, it also converts to WebP
      return await uploadBase64Image(dataUrl, 'home');
    } catch (error) {
      console.error('Error uploading home image to S3:', error);
      throw error;
    }
  }
  // If it's already an S3 URL or other URL, just fix it
  return fixWebsiteUrl(dataUrl);
}

const getHomePoster = async (req, res) => {
  try {
    let homePoster = await HomePoster.findOne();
    if (!homePoster) {
      // Return default data if none exists
      homePoster = {
        topText: {
          title: "Traditional Ethnic Wear for Women",
          desc: "Shop sarees, salwars, lehengas, and the latest trends—your go-to women's ethnic styles are here. Upgrade your wardrobe with must-have looks that blend tradition and today's fashion."
        },
        mainContent: {
          title: "Complete Indian Wear Wardrobe",
          desc: "Shop Sarees, Lehengas, Suits & Kurtis",
          buttonText: "SHOP NOW",
          image: "https://i.pinimg.com/1200x/59/9c/8c/599c8cd0645006f231f4cda408c5287f.jpg"
        },
        whyChooseUs: [
          { icon: "Award", title: "Premium Quality", desc: "Finest fabrics and hand-work." },
          { icon: "Users", title: "Custom Styling", desc: "Made-to-measure perfection." },
          { icon: "ShieldCheck", title: "Secure Delivery", desc: "Insured global shipping." }
        ],
        cards: [
          { image: "https://i.pinimg.com/736x/b7/3a/67/b73a6758225e0ee8063768b3e1fae234.jpg", title: "SALWAR SUIT", buttonText: "SHOP NOW" },
          { image: "https://i.pinimg.com/736x/ad/05/26/ad0526bef8e0513ded97a312cebde552.jpg", title: "KURTI SETS", buttonText: "SHOP NOW" },
          { image: "https://i.pinimg.com/736x/f1/56/4c/f1564c099ffa7ff94258ef36f16a02a2.jpg", title: "SAREES", buttonText: "SHOP NOW" },
          { image: "https://i.pinimg.com/736x/6d/92/52/6d9252ddbe90bf144e25505c229e174b.jpg", title: "LEHENGAS", buttonText: "SHOP NOW" }
        ]
      };
    } else {
      homePoster = homePoster.toObject();
    }

    homePoster = makeAbsoluteImages(homePoster, req);
    res.json(homePoster);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateHomePoster = async (req, res) => {
  try {
    const body = { ...req.body };

    // Process mainContent image
    if (body.mainContent && body.mainContent.image) {
      body.mainContent.image = await saveImage(body.mainContent.image);
    }

    // Process cards images
    if (Array.isArray(body.cards)) {
      for (let i = 0; i < body.cards.length; i++) {
        if (body.cards[i].image) {
          body.cards[i].image = await saveImage(body.cards[i].image);
        }
      }
    }

    const updatedHomePoster = await HomePoster.findOneAndUpdate({}, body, { new: true, upsert: true });
    
    const obj = updatedHomePoster.toObject();
    const processed = makeAbsoluteImages(obj, req);
    
    res.json(processed);
  } catch (error) {
    console.error('Error updating home poster:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getHomePoster,
  updateHomePoster,
};