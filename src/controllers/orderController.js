const Order = require('../models/Order');
const QRCode = require('../models/QRCode');
const ApiError = require('../utils/ApiError');
const { notifyNewOrder, notifyOrderReady, notifyOrderStatusChange } = require('../config/socket');
const { 
  sendOrderConfirmation, 
  sendOrderReadyNotification, 
  sendOrderStatusUpdate,
  sendNewOrderNotification 
} = require('../utils/smsService');
const { sendPushToUser, sendPushToPhone } = require('./pushController');

// @desc    Create a new order
// @route   POST /api/orders
// @access  Public
exports.createOrder = async (req, res, next) => {
  try {
    const { token, customerName, customerPhone, items, totalAmount, paymentMethod, notes } = req.body;

    // Validate required fields
    if (!token || !customerName || !customerPhone || !items || items.length === 0 || !totalAmount) {
      throw new ApiError('Please provide all required fields', 400);
    }

    // Find QR code to get userId and table number
    const qrCode = await QRCode.findOne({ token, isActive: true });
    
    if (!qrCode) {
      throw new ApiError('Invalid QR code or QR code is inactive', 404);
    }

    // Create order
    const order = await Order.create({
      userId: qrCode.userId,
      qrToken: token,
      tableNumber: qrCode.tableNumber,
      customerName,
      customerPhone,
      items,
      totalAmount,
      paymentMethod: paymentMethod || 'cash',
      notes: notes || ''
    });
    
    // Populate order details
    const populatedOrder = await Order.findById(order._id)
      .populate('userId', 'restaurantName email phone');

    const orderNumber = populatedOrder._id.toString().slice(-8).toUpperCase();

    // Send Socket.io notification to restaurant owner
    notifyNewOrder(qrCode.userId.toString(), {
      orderId: populatedOrder._id,
      orderNumber,
      customerName: populatedOrder.customerName,
      customerPhone: populatedOrder.customerPhone,
      tableNumber: populatedOrder.tableNumber,
      totalAmount: populatedOrder.totalAmount,
      itemCount: populatedOrder.items.length,
      items: populatedOrder.items
    });

    // Send Web Push to owner (restaurant admin)
    try {
      await sendPushToUser(qrCode.userId.toString(), {
        title: 'New Order Received',
        body: `${populatedOrder.items.length} item(s) • ${populatedOrder.customerName} • ₹${populatedOrder.totalAmount}`,
        data: { url: '/owner/orders' }
      });
    } catch (e) {
      console.error('Owner push failed:', e?.message || e);
    }

    // Send SMS notification to customer (order confirmation)
    try {
      await sendOrderConfirmation(
        customerPhone,
        orderNumber,
        customerName,
        totalAmount
      );
    } catch (smsError) {
      console.error('SMS to customer failed:', smsError);
    }

    // Send SMS notification to owner (new order alert)
    try {
      if (populatedOrder.userId.phone) {
        await sendNewOrderNotification(
          populatedOrder.userId.phone,
          orderNumber,
          customerName,
          totalAmount
        );
      }
    } catch (smsError) {
      console.error('SMS to owner failed:', smsError);
    }

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: {
        orderId: populatedOrder._id,
        order: {
          id: populatedOrder._id,
          tableNumber: populatedOrder.tableNumber,
          customerName: populatedOrder.customerName,
          customerPhone: populatedOrder.customerPhone,
          items: populatedOrder.items,
          totalAmount: populatedOrder.totalAmount,
          status: populatedOrder.status,
          paymentMethod: populatedOrder.paymentMethod,
          createdAt: populatedOrder.createdAt
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:orderId
// @access  Public
exports.getOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate('userId', 'restaurantName email');

    if (!order) {
      throw new ApiError('Order not found', 404);
    }

    res.status(200).json({
      success: true,
      data: {
        id: order._id,
        tableNumber: order.tableNumber,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        items: order.items,
        totalAmount: order.totalAmount,
        status: order.status,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        notes: order.notes,
        createdAt: order.createdAt,
        completedAt: order.completedAt,
        restaurant: {
          name: order.userId.restaurantName,
          email: order.userId.email
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all orders for owner
// @route   GET /api/orders/owner
// @access  Private
exports.getOwnerOrders = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;

    const query = { userId };
    if (status && status !== 'all') {
      query.status = status;
    }

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .limit(100);

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders.map(order => ({
        id: order._id,
        tableNumber: order.tableNumber,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        items: order.items,
        totalAmount: order.totalAmount,
        status: order.status,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        notes: order.notes,
        createdAt: order.createdAt,
        completedAt: order.completedAt
      }))
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:orderId/status
// @access  Private
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.orderId);

    if (!order) {
      throw new ApiError('Order not found', 404);
    }

    // Check ownership
    if (order.userId.toString() !== req.user.id) {
      throw new ApiError('Not authorized to update this order', 403);
    }

    // Validate status
    const validStatuses = ['pending', 'preparing', 'ready', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      throw new ApiError('Invalid order status', 400);
    }

    order.status = status;
    
    // Set completed date if status is completed
    if (status === 'completed' && !order.completedAt) {
      order.completedAt = new Date();
    }

    await order.save();

    const orderNumber = order._id.toString().slice(-8).toUpperCase();

    // Send Socket.io notification to customer about status change
    notifyOrderStatusChange(
      order._id.toString(),
      order.customerPhone,
      status,
      {
        orderId: order._id,
        orderNumber,
        customerName: order.customerName,
        totalAmount: order.totalAmount
      }
    );

    // Send SMS notification to customer about status change
    try {
      await sendOrderStatusUpdate(
        order.customerPhone,
        orderNumber,
        status,
        order.customerName
      );
    } catch (smsError) {
      console.error('SMS notification failed:', smsError);
    }

    // Send Web Push to customer about status change
    try {
      await sendPushToPhone(order.customerPhone, {
        title: `Order ${status.toUpperCase()}`,
        body: `Order #${orderNumber} is now ${status}`,
        data: { url: `/m/menu/q/token/order/${order._id}` },
      });
    } catch (e) {
      console.error('Customer push failed:', e?.message || e);
    }

    res.status(200).json({
      success: true,
      message: 'Order status updated successfully. Customer notified.',
      data: {
        id: order._id,
        status: order.status,
        completedAt: order.completedAt
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark order as ready
// @route   PUT /api/orders/:orderId/ready
// @access  Private
exports.markOrderReady = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.orderId);

    if (!order) {
      throw new ApiError('Order not found', 404);
    }

    // Check ownership
    if (order.userId.toString() !== req.user.id) {
      throw new ApiError('Not authorized to update this order', 403);
    }

    order.status = 'ready';
    await order.save();

    const orderNumber = order._id.toString().slice(-8).toUpperCase();

    // Send Socket.io notification to customer that order is ready
    notifyOrderReady(
      order._id.toString(),
      order.customerPhone,
      {
        orderId: order._id,
        orderNumber,
        customerName: order.customerName,
        totalAmount: order.totalAmount
      }
    );

    // Send SMS notification to customer
    try {
      await sendOrderReadyNotification(
        order.customerPhone,
        orderNumber,
        order.customerName
      );
    } catch (smsError) {
      console.error('SMS notification failed:', smsError);
    }

    // Send Web Push to customer: order ready
    try {
      await sendPushToPhone(order.customerPhone, {
        title: 'Order Ready 🎉',
        body: `Order #${orderNumber} is ready for pickup`,
        data: { url: `/m/menu/q/token/order/${order._id}` },
      });
    } catch (e) {
      console.error('Customer push (ready) failed:', e?.message || e);
    }

    res.status(200).json({
      success: true,
      message: 'Order marked as ready. Customer notified via app and SMS.',
      data: {
        id: order._id,
        status: order.status
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark order as completed
// @route   PUT /api/orders/:orderId/complete
// @access  Private
exports.markOrderCompleted = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.orderId);

    if (!order) {
      throw new ApiError('Order not found', 404);
    }

    // Check ownership
    if (order.userId.toString() !== req.user.id) {
      throw new ApiError('Not authorized to update this order', 403);
    }

    order.status = 'completed';
    order.completedAt = new Date();
    await order.save();

    res.status(200).json({
      success: true,
      message: 'Order marked as completed',
      data: {
        id: order._id,
        status: order.status,
        completedAt: order.completedAt
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete order
// @route   DELETE /api/orders/:orderId
// @access  Private
exports.deleteOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.orderId);

    if (!order) {
      throw new ApiError('Order not found', 404);
    }

    // Check ownership
    if (order.userId.toString() !== req.user.id) {
      throw new ApiError('Not authorized to delete this order', 403);
    }

    await Order.findByIdAndDelete(req.params.orderId);

    res.status(200).json({
      success: true,
      message: 'Order deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get customer's orders by phone (today only)
// @route   GET /api/orders/customer/:phone
// @access  Public
exports.getCustomerOrders = async (req, res, next) => {
  try {
    const { phone } = req.params;

    // Get start and end of today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // Find orders by phone number (today only)
    const orders = await Order.find({
      customerPhone: phone,
      createdAt: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    })
    .populate('userId', 'restaurantName')
    .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders.map(order => ({
        id: order._id,
        restaurantName: order.userId.restaurantName,
        tableNumber: order.tableNumber,
        items: order.items,
        totalAmount: order.totalAmount,
        status: order.status,
        paymentMethod: order.paymentMethod,
        createdAt: order.createdAt
      }))
    });
  } catch (error) {
    next(error);
  }
};
