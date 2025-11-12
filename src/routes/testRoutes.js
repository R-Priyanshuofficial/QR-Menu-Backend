const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { notifyNewOrder, notifyOrderReady, notifyOrderStatusChange, getIO } = require('../config/socket');
const Order = require('../models/Order');
const QRCode = require('../models/QRCode');

// @desc    Test new order notification
// @route   GET /api/test/notify-new-order
// @access  Private
router.get('/notify-new-order', protect, (req, res) => {
  try {
    const ownerId = req.user.id;
    
    const testOrderData = {
      orderId: 'test123',
      orderNumber: 'TEST001',
      customerName: 'Test Customer',
      customerPhone: '+919876543210',
      tableNumber: 'Table 5',
      totalAmount: 500,
      itemCount: 3,
      items: [
        { name: 'Pizza', quantity: 1, price: 300 },
        { name: 'Coke', quantity: 2, price: 100 }
      ]
    };

    notifyNewOrder(ownerId, testOrderData);
    
    res.json({
      success: true,
      message: 'Test notification sent to owner!',
      data: { ownerId, testOrderData }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Test order ready notification
// @route   GET /api/test/notify-order-ready
// @access  Public
router.get('/notify-order-ready', (req, res) => {
  try {
    const testOrderData = {
      orderId: 'test123',
      orderNumber: 'TEST001',
      customerName: 'Test Customer',
      totalAmount: 500
    };

    notifyOrderReady('test123', '+919876543210', testOrderData);
    
    res.json({
      success: true,
      message: 'Test "Order Ready" notification sent to customer!',
      data: testOrderData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Test order status change notification
// @route   GET /api/test/notify-status/:status
// @access  Public
router.get('/notify-status/:status', (req, res) => {
  try {
    const { status } = req.params;
    
    const testOrderData = {
      orderId: 'test123',
      orderNumber: 'TEST001',
      customerName: 'Test Customer',
      totalAmount: 500
    };

    notifyOrderStatusChange('test123', '+919876543210', status, testOrderData);
    
    res.json({
      success: true,
      message: `Test "${status}" notification sent to customer!`,
      data: { status, ...testOrderData }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Get Socket.io status
// @route   GET /api/test/socket-status
// @access  Public
router.get('/socket-status', (req, res) => {
  try {
    const io = getIO();
    
    if (!io) {
      return res.json({
        success: false,
        message: 'Socket.io not initialized',
        connected: false
      });
    }

    const sockets = io.sockets.sockets;
    const connectedClients = Array.from(sockets.keys());
    
    res.json({
      success: true,
      message: 'Socket.io is running',
      data: {
        connected: true,
        clientCount: connectedClients.length,
        clients: connectedClients
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Broadcast test message to all clients
// @route   GET /api/test/broadcast
// @access  Public
router.get('/broadcast', (req, res) => {
  try {
    const io = getIO();
    
    if (!io) {
      return res.status(500).json({
        success: false,
        message: 'Socket.io not initialized'
      });
    }

    const testMessage = {
      type: 'test',
      title: 'Test Notification',
      message: '🎉 This is a test broadcast message!',
      timestamp: new Date()
    };

    io.emit('notification', testMessage);
    
    res.json({
      success: true,
      message: 'Broadcast sent to all connected clients!',
      data: testMessage
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Generate sample data for analytics testing
// @route   POST /api/test/generate-sample-data
// @access  Private
router.post('/generate-sample-data', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const { count = 30 } = req.body; // Generate 30 days of data by default

    // Get or create a QR code for this user
    let qrCode = await QRCode.findOne({ userId, isActive: true });
    if (!qrCode) {
      qrCode = await QRCode.create({
        userId,
        token: `test-${Date.now()}`,
        tableNumber: 'Test Table',
        isActive: true,
        scans: Math.floor(Math.random() * 100) + 50
      });
    }

    const menuItems = [
      { name: 'Margherita Pizza', price: 299 },
      { name: 'Pepperoni Pizza', price: 349 },
      { name: 'Chicken Burger', price: 199 },
      { name: 'Veggie Burger', price: 179 },
      { name: 'French Fries', price: 99 },
      { name: 'Coke', price: 50 },
      { name: 'Pasta Alfredo', price: 249 },
      { name: 'Caesar Salad', price: 149 },
      { name: 'Garlic Bread', price: 99 },
      { name: 'Ice Cream', price: 89 }
    ];

    const statuses = ['completed', 'completed', 'completed', 'completed', 'pending', 'preparing', 'ready', 'cancelled'];
    const paymentMethods = ['cash']; // Only cash payment
    const customerNames = ['John Doe', 'Jane Smith', 'Mike Johnson', 'Sarah Williams', 'Tom Brown', 'Emily Davis', 'Chris Wilson', 'Lisa Anderson'];
    
    const orders = [];
    const now = new Date();

    for (let i = 0; i < count; i++) {
      // Generate orders for the past `count` days
      const daysAgo = Math.floor(Math.random() * count);
      const orderDate = new Date(now);
      orderDate.setDate(orderDate.getDate() - daysAgo);
      
      // Random hour between 10 AM and 10 PM
      const hour = Math.floor(Math.random() * 12) + 10;
      orderDate.setHours(hour, Math.floor(Math.random() * 60), 0, 0);

      // Random number of items (1-5)
      const itemCount = Math.floor(Math.random() * 5) + 1;
      const orderItems = [];
      let totalAmount = 0;

      for (let j = 0; j < itemCount; j++) {
        const item = menuItems[Math.floor(Math.random() * menuItems.length)];
        const quantity = Math.floor(Math.random() * 3) + 1;
        orderItems.push({
          name: item.name,
          price: item.price,
          quantity
        });
        totalAmount += item.price * quantity;
      }

      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const customerName = customerNames[Math.floor(Math.random() * customerNames.length)];
      const customerPhone = `+91${9000000000 + Math.floor(Math.random() * 99999999)}`;

      const order = {
        userId,
        qrToken: qrCode.token,
        tableNumber: qrCode.tableNumber,
        customerName,
        customerPhone,
        items: orderItems,
        totalAmount,
        status,
        paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
        paymentStatus: status === 'completed' ? 'paid' : 'pending',
        createdAt: orderDate,
        completedAt: status === 'completed' ? new Date(orderDate.getTime() + Math.random() * 3600000) : null
      };

      orders.push(order);
    }

    // Insert all orders
    const createdOrders = await Order.insertMany(orders);

    res.json({
      success: true,
      message: `Successfully generated ${createdOrders.length} sample orders for analytics testing`,
      data: {
        ordersCreated: createdOrders.length,
        dateRange: {
          from: new Date(now.setDate(now.getDate() - count)).toISOString(),
          to: new Date().toISOString()
        }
      }
    });
  } catch (error) {
    console.error('Sample data generation error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Clear all test/sample data
// @route   DELETE /api/test/clear-sample-data
// @access  Private
router.delete('/clear-sample-data', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await Order.deleteMany({ userId });
    
    res.json({
      success: true,
      message: `Cleared ${result.deletedCount} orders`,
      data: {
        deletedCount: result.deletedCount
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
