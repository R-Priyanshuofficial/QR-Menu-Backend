const express = require('express');
const router = express.Router();
const { getDashboardStats, getRecentActivity, getQRSummary } = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

router.get('/stats', protect, getDashboardStats);
router.get('/activity', protect, getRecentActivity);
router.get('/qr-summary', protect, getQRSummary);

module.exports = router;
