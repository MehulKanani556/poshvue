const express = require('express');
const router = express.Router();
const { orderController } = require('../controller');
const { auth } = require('../middleware/auth');

router.post('/calculate-shipping', auth, orderController.calculateShipping);

module.exports = router;