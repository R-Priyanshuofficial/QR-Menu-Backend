const express = require('express');
const router = express.Router();
const { 
  getAnalyticsStats, 
  getOrderHistory, 
  getCustomerInsights 
} = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');

// All routes are protected (require authentication)
router.get('/stats', protect, getAnalyticsStats);
router.get('/orders', protect, getOrderHistory);
router.get('/customers', protect, getCustomerInsights);

module.exports = router;
