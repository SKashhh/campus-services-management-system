const express = require('express');
const router = express.Router();
const {
  submitFeedback,
  getFeedbackByRequest,
  getAllFeedback,
} = require('../controllers/feedbackController');
const { authenticateToken, isAdminOrStaff } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Student routes
router.post('/', submitFeedback);

// Admin/Staff routes
router.get('/', isAdminOrStaff, getAllFeedback);

// Shared routes
router.get('/request/:requestId', getFeedbackByRequest);

module.exports = router;
