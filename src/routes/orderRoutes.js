const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createOrder,
  getOrder,
  getOwnerOrders,
  updateOrderStatus,
  markOrderReady,
  markOrderCompleted,
  deleteOrder,
  getCustomerOrders
} = require('../controllers/orderController');

// Public routes
router.post('/', createOrder);
router.get('/customer/:phone', getCustomerOrders);

// Protected routes (owner only) - must be before /:orderId
router.get('/owner/list', protect, getOwnerOrders);

// Public route (must be after /owner/list)
router.get('/:orderId', getOrder);
router.put('/:orderId/status', protect, updateOrderStatus);
router.put('/:orderId/ready', protect, markOrderReady);
router.put('/:orderId/complete', protect, markOrderCompleted);
router.delete('/:orderId', protect, deleteOrder);

module.exports = router;
