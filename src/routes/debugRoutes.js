const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Order = require('../models/Order');
const User = require('../models/User');

// @desc    Debug: Check user's orders
// @route   GET /api/debug/my-orders
// @access  Private
router.get('/my-orders', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get all orders for this user
    const orders = await Order.find({ userId }).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      userId: userId,
      userName: req.user.name,
      userEmail: req.user.email,
      totalOrders: orders.length,
      orders: orders.map(o => ({
        id: o._id,
        customer: o.customerName,
        phone: o.customerPhone,
        total: o.totalAmount,
        status: o.status,
        createdAt: o.createdAt,
        daysAgo: Math.floor((Date.now() - o.createdAt) / (1000 * 60 * 60 * 24))
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// @desc    Debug: Check all orders (see if order exists for different user)
// @route   GET /api/debug/all-orders
// @access  Private
router.get('/all-orders', protect, async (req, res) => {
  try {
    const orders = await Order.find().populate('userId', 'name email').sort({ createdAt: -1 }).limit(10);
    
    res.json({
      success: true,
      currentUser: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email
      },
      recentOrders: orders.map(o => ({
        id: o._id,
        customer: o.customerName,
        total: o.totalAmount,
        status: o.status,
        ownerId: o.userId?._id,
        ownerName: o.userId?.name,
        ownerEmail: o.userId?.email,
        createdAt: o.createdAt,
        belongsToMe: o.userId?._id?.toString() === req.user.id
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
