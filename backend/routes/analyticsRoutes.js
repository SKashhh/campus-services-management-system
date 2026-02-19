const express = require('express');
const router = express.Router();
const {
  getDepartmentWorkload,
  getServicePerformance,
  getPriorityDistribution,
  getFeedbackRatings,
  getPrioritySummary,
  getMonthlyAnalytics,
  refreshMonthlyAnalytics,
  getDashboardOverview,
  getSLACompliance,
  getUserActivityReport,
} = require('../controllers/analyticsController');
const { authenticateToken, isAdminOrStaff, isAdmin } = require('../middleware/auth');

// All analytics routes require admin or staff authentication
router.use(authenticateToken);
router.use(isAdminOrStaff);

// Analytics endpoints
router.get('/dashboard', getDashboardOverview);
router.get('/department-workload', getDepartmentWorkload);
router.get('/service-performance', getServicePerformance);
router.get('/priority-distribution', getPriorityDistribution);
router.get('/feedback-ratings', getFeedbackRatings);
router.get('/priority-summary', getPrioritySummary);
router.get('/monthly', getMonthlyAnalytics);
router.get('/sla-compliance', getSLACompliance);

// Admin-only routes
router.get('/user-activity', isAdmin, getUserActivityReport);
router.post('/refresh-monthly', isAdmin, refreshMonthlyAnalytics);

module.exports = router;
