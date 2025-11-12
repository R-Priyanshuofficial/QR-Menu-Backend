const Order = require('../models/Order');
const QRCode = require('../models/QRCode');
const ApiError = require('../utils/ApiError');
const mongoose = require('mongoose');

// @desc    Get comprehensive analytics stats
// @route   GET /api/analytics/stats
// @access  Private
exports.getAnalyticsStats = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { period = 'week' } = req.query; // week, month, year, all

    console.log('📊 Analytics Request - User ID:', userId);
    console.log('📅 Period:', period);

    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case 'all':
        startDate = new Date(0); // Beginning of time
        break;
      default:
        startDate.setDate(now.getDate() - 7);
    }

    console.log('📅 Date range:', startDate, 'to', now);

    // First check total orders for this user (debugging)
    const allUserOrders = await Order.find({ userId }).countDocuments();
    console.log('📊 Total orders for user:', allUserOrders);

    // Get all orders for the period
    const orders = await Order.find({
      userId,
      createdAt: { $gte: startDate }
    });

    console.log('📦 Found orders in period:', orders.length);
    if (orders.length > 0) {
      console.log('First order sample:', {
        id: orders[0]._id,
        userId: orders[0].userId,
        customer: orders[0].customerName,
        status: orders[0].status,
        total: orders[0].totalAmount,
        createdAt: orders[0].createdAt
      });
    } else if (allUserOrders > 0) {
      // Check if orders exist but outside date range
      const anyOrder = await Order.findOne({ userId }).sort({ createdAt: -1 });
      console.log('⚠️ Orders exist but outside date range. Latest order:', {
        createdAt: anyOrder.createdAt,
        daysAgo: Math.floor((now - anyOrder.createdAt) / (1000 * 60 * 60 * 24))
      });
    }

    // Calculate revenue metrics
    const totalOrders = orders.length;
    const completedOrders = orders.filter(o => o.status === 'completed');
    const cancelledOrders = orders.filter(o => o.status === 'cancelled');
    const pendingOrders = orders.filter(o => o.status === 'pending');
    const preparingOrders = orders.filter(o => o.status === 'preparing');
    const readyOrders = orders.filter(o => o.status === 'ready');

    // Revenue calculations
    const totalRevenue = completedOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const averageOrderValue = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;
    
    // Calculate pending revenue (orders that haven't been completed yet)
    const pendingRevenue = orders
      .filter(o => ['pending', 'preparing', 'ready'].includes(o.status))
      .reduce((sum, order) => sum + order.totalAmount, 0);

    // Get today's stats
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayOrders = orders.filter(o => o.createdAt >= todayStart);
    const todayRevenue = todayOrders
      .filter(o => o.status === 'completed')
      .reduce((sum, order) => sum + order.totalAmount, 0);

    // Calculate daily average
    const daysDiff = Math.ceil((now - startDate) / (1000 * 60 * 60 * 24));
    const dailyAverage = daysDiff > 0 ? totalRevenue / daysDiff : 0;

    // Customer analytics
    const uniqueCustomers = new Set(orders.map(o => o.customerPhone)).size;
    const repeatCustomers = orders.reduce((acc, order) => {
      const customerOrders = orders.filter(o => o.customerPhone === order.customerPhone);
      if (customerOrders.length > 1 && !acc.has(order.customerPhone)) {
        acc.add(order.customerPhone);
      }
      return acc;
    }, new Set()).size;

    // Most popular items
    const itemFrequency = {};
    orders.forEach(order => {
      order.items.forEach(item => {
        if (!itemFrequency[item.name]) {
          itemFrequency[item.name] = {
            name: item.name,
            quantity: 0,
            revenue: 0
          };
        }
        itemFrequency[item.name].quantity += item.quantity;
        itemFrequency[item.name].revenue += item.price * item.quantity;
      });
    });

    const popularItems = Object.values(itemFrequency)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    // Payment method breakdown
    const paymentMethods = orders.reduce((acc, order) => {
      acc[order.paymentMethod] = (acc[order.paymentMethod] || 0) + 1;
      return acc;
    }, {});

    // Hourly distribution with revenue
    const hourlyDistribution = Array(24).fill(0).map((_, i) => ({ hour: i, orders: 0, revenue: 0 }));
    orders.forEach(order => {
      const hour = new Date(order.createdAt).getHours();
      hourlyDistribution[hour].orders++;
      if (order.status === 'completed') {
        hourlyDistribution[hour].revenue += order.totalAmount;
      }
    });

    // Peak hours
    const peakHour = hourlyDistribution.reduce((max, curr, idx, arr) => 
      curr.orders > arr[max].orders ? idx : max, 0);

    // Day of week analysis (0 = Sunday, 6 = Saturday)
    const dayOfWeekData = Array(7).fill(0).map((_, i) => ({ 
      day: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][i],
      orders: 0, 
      revenue: 0 
    }));
    orders.forEach(order => {
      const day = new Date(order.createdAt).getDay();
      dayOfWeekData[day].orders++;
      if (order.status === 'completed') {
        dayOfWeekData[day].revenue += order.totalAmount;
      }
    });

    // Table performance
    const tablePerformance = {};
    orders.forEach(order => {
      const table = order.tableNumber || 'Unknown';
      if (!tablePerformance[table]) {
        tablePerformance[table] = { orders: 0, revenue: 0 };
      }
      tablePerformance[table].orders++;
      if (order.status === 'completed') {
        tablePerformance[table].revenue += order.totalAmount;
      }
    });
    const topTables = Object.entries(tablePerformance)
      .map(([table, data]) => ({ table, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Get QR code stats
    const qrCodes = await QRCode.find({ userId, isActive: true });
    const totalScans = qrCodes.reduce((sum, qr) => sum + qr.scans, 0);

    // Revenue trend (last 7 days)
    const revenueTrend = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const dayOrders = orders.filter(o => 
        o.createdAt >= date && 
        o.createdAt < nextDate && 
        o.status === 'completed'
      );
      
      const dayRevenue = dayOrders.reduce((sum, order) => sum + order.totalAmount, 0);
      
      revenueTrend.push({
        date: date.toISOString().split('T')[0],
        revenue: dayRevenue,
        orders: dayOrders.length
      });
    }

    // Order status distribution
    const statusDistribution = {
      pending: pendingOrders.length,
      preparing: preparingOrders.length,
      ready: readyOrders.length,
      completed: completedOrders.length,
      cancelled: cancelledOrders.length
    };

    // Calculate growth (compare with previous period)
    const previousPeriodStart = new Date(startDate);
    const periodLength = now - startDate;
    previousPeriodStart.setTime(previousPeriodStart.getTime() - periodLength);

    const previousOrders = await Order.find({
      userId,
      createdAt: { $gte: previousPeriodStart, $lt: startDate },
      status: 'completed'
    });

    const previousRevenue = previousOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const revenueGrowth = previousRevenue > 0 
      ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 
      : 0;

    const orderGrowth = previousOrders.length > 0
      ? ((completedOrders.length - previousOrders.length) / previousOrders.length) * 100
      : 0;

    res.status(200).json({
      success: true,
      data: {
        period,
        dateRange: {
          start: startDate,
          end: now
        },
        revenue: {
          total: Math.round(totalRevenue * 100) / 100,
          pending: Math.round(pendingRevenue * 100) / 100,
          average: Math.round(averageOrderValue * 100) / 100,
          daily: Math.round(dailyAverage * 100) / 100,
          today: Math.round(todayRevenue * 100) / 100,
          growth: Math.round(revenueGrowth * 100) / 100
        },
        orders: {
          total: totalOrders,
          completed: completedOrders.length,
          pending: pendingOrders.length,
          preparing: preparingOrders.length,
          ready: readyOrders.length,
          cancelled: cancelledOrders.length,
          today: todayOrders.length,
          growth: Math.round(orderGrowth * 100) / 100,
          statusDistribution
        },
        customers: {
          unique: uniqueCustomers,
          repeat: repeatCustomers,
          repeatRate: uniqueCustomers > 0 
            ? Math.round((repeatCustomers / uniqueCustomers) * 100) 
            : 0
        },
        popularItems,
        paymentMethods,
        peakHour,
        hourlyDistribution,
        dayOfWeekData,
        topTables,
        revenueTrend,
        qrStats: {
          totalCodes: qrCodes.length,
          totalScans,
          averageScans: qrCodes.length > 0 ? Math.round(totalScans / qrCodes.length) : 0
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get detailed order history with pagination
// @route   GET /api/analytics/orders
// @access  Private
exports.getOrderHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, status, startDate, endDate } = req.query;

    const query = { userId };
    
    if (status && status !== 'all') {
      query.status = status;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    res.status(200).json({
      success: true,
      data: {
        orders: orders.map(order => ({
          id: order._id,
          orderNumber: order._id.toString().slice(-8).toUpperCase(),
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          tableNumber: order.tableNumber,
          items: order.items,
          totalAmount: order.totalAmount,
          status: order.status,
          paymentMethod: order.paymentMethod,
          paymentStatus: order.paymentStatus,
          createdAt: order.createdAt,
          completedAt: order.completedAt
        })),
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get customer insights
// @route   GET /api/analytics/customers
// @access  Private
exports.getCustomerInsights = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const orders = await Order.find({ userId });

    // Group orders by customer
    const customerData = orders.reduce((acc, order) => {
      const phone = order.customerPhone;
      if (!acc[phone]) {
        acc[phone] = {
          phone,
          name: order.customerName,
          orders: [],
          totalSpent: 0,
          orderCount: 0
        };
      }
      acc[phone].orders.push(order);
      acc[phone].totalSpent += order.totalAmount;
      acc[phone].orderCount++;
      return acc;
    }, {});

    // Convert to array and sort by total spent
    const topCustomers = Object.values(customerData)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 20)
      .map(customer => ({
        phone: customer.phone,
        name: customer.name,
        orderCount: customer.orderCount,
        totalSpent: Math.round(customer.totalSpent * 100) / 100,
        averageOrderValue: Math.round((customer.totalSpent / customer.orderCount) * 100) / 100,
        lastOrder: customer.orders[customer.orders.length - 1].createdAt
      }));

    res.status(200).json({
      success: true,
      data: { topCustomers }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = exports;
