const express = require('express');
const router = express.Router();
const {
  getAllDepartments,
  getAllServices,
  getServiceById,
  createService,
  createDepartment,
  updateDepartment,
} = require('../controllers/serviceController');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// Public/authenticated routes
router.get('/departments', getAllDepartments);
router.get('/services', getAllServices);
router.get('/services/:id', getServiceById);

// Admin-only routes
router.post('/services', authenticateToken, isAdmin, createService);
router.post('/departments', authenticateToken, isAdmin, createDepartment);
router.patch('/departments/:id', authenticateToken, isAdmin, updateDepartment);

module.exports = router;
