const express = require('express');
const router = express.Router();

router.use('/auth', require('./auth'));
router.use('/admin', require('./admin'));
router.use('/catalog', require('./catalog'));
router.use('/content', require('./content'));
router.use('/commerce', require('./commerce'));
router.use('/payment', require('./payment'));
router.use('/shiprocket', require('./shiprocket'));
router.use('/support', require('./support'));
router.use('/story', require('./story'));
router.use('/home-poster', require('./homePoster'));
router.use('/slider', require('./slider'));
router.use('/about-us', require('./aboutUs'));
router.use('/contact-page', require('./contactPage'));
router.use('/store-locator', require('./storeLocator'));
router.use('/privacy-policy', require('./privacyPolicy'));
router.use('/shipping-policy', require('./shippingPolicy'));
router.use('/terms-conditions', require('./termAndCondition'));
router.use('/return-policy', require('./returnPolicy'));
router.use('/cart', require('./cart'));
router.use('/wishlist', require('./wishlist'));
router.use('/country', require('./country'));
router.use('/address', require('./address'));
router.use('/dashboard', require('./dashboard'));
router.use('/reports', require('./reports'));



module.exports = router;