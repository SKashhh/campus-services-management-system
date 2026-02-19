const express = require('express');
const router = express.Router();
const {
  createRequest,
  getAllRequests,
  getMyRequests,
  getRequestById,
  updateRequestStatus,
  deleteRequest,
} = require('../controllers/requestController');
const { authenticateToken, isAdminOrStaff } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Student routes
router.post('/', createRequest);
router.get('/my-requests', getMyRequests);

// Admin/Staff routes
router.get('/', isAdminOrStaff, getAllRequests);
router.patch('/:id/status', isAdminOrStaff, updateRequestStatus);

// Shared routes
router.get('/:id', getRequestById);
router.delete('/:id', deleteRequest);

module.exports = router;
