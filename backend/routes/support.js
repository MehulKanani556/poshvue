const express = require('express');
const router = express.Router();
const contact = require('../controller/contactController');
const complaint = require('../controller/complaintController');
const wholesale = require('../controller/wholesaleController');
const subscription = require('../controller/subscriptionController');
const { auth, requireRole } = require('../middleware/auth');
const feedback = require('../controller/feedbackController');
  
// Contact
router.get('/contacts', auth, requireRole('admin'), contact.list);
router.post('/contacts', contact.create);
router.put('/contacts/:id/status', auth, requireRole('admin'), contact.updateStatus);

// Complaints
router.get('/complaints', auth, requireRole('admin'), complaint.list);
router.post('/complaints', complaint.create);
router.put('/complaints/:id/status', auth, requireRole('admin'), complaint.updateStatus);

// Wholesale inquiries
router.get('/wholesale', auth, requireRole('admin'), wholesale.list);
router.post('/wholesale', wholesale.create);
router.put('/wholesale/:id/status', auth, requireRole('admin'), wholesale.updateStatus);
router.delete('/wholesale/:id', auth, requireRole('admin'), wholesale.remove);

// Subscriptions
router.post('/subscriptions', subscription.subscribe);
router.get('/subscriptions', auth, requireRole('admin'), subscription.list);
router.delete('/subscriptions/:id', auth, requireRole('admin'), subscription.remove);

// Feedback
router.get('/feedbacks', auth, requireRole('admin'), feedback.list);
router.post('/feedbacks', feedback.create);
router.delete('/feedbacks/:id', auth, requireRole('admin'), feedback.remove);

module.exports = router;