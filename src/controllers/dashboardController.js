const QRCode = require('../models/QRCode');
const Order = require('../models/Order');
const ApiError = require('../utils/ApiError');

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
// @access  Private
exports.getDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user.role === 'staff' && req.user.ownerId
      ? req.user.ownerId
      : req.user._id;

    // Get total QR codes
    const totalQRCodes = await QRCode.countDocuments({ userId, isActive: true });

    // Get active QR codes
    const activeQRCodes = await QRCode.countDocuments({ userId, isActive: true });

    // Get total scans
    const qrCodes = await QRCode.find({ userId });
    const totalScans = qrCodes.reduce((sum, qr) => sum + qr.scans, 0);

    // Get recent scans (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentScans = await QRCode.aggregate([
      {
        $match: {
          userId,
          lastScannedAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: null,
          count: { $sum: '$scans' }
        }
      }
    ]);

    // Calculate scan growth
    const scanGrowth = recentScans.length > 0 ? Math.round((recentScans[0].count / totalScans) * 100) : 0;

    // Get order statistics
    const totalOrders = await Order.countDocuments({ userId });

    // Get today's orders
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const todayOrders = await Order.countDocuments({
      userId,
      createdAt: { $gte: startOfDay }
    });

    // Get pending orders count
    const pendingOrders = await Order.countDocuments({
      userId,
      status: 'pending'
    });

    // Calculate today's revenue
    const todayOrdersData = await Order.find({
      userId,
      createdAt: { $gte: startOfDay },
      status: { $ne: 'cancelled' }
    });
    const todayRevenue = todayOrdersData.reduce((sum, order) => sum + order.totalAmount, 0);

    // Calculate total revenue
    const allOrders = await Order.find({ userId, status: { $ne: 'cancelled' } });
    const totalRevenue = allOrders.reduce((sum, order) => sum + order.totalAmount, 0);

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalQRCodes,
          activeQRCodes,
          totalScans,
          recentScans: recentScans.length > 0 ? recentScans[0].count : 0,
          scanGrowth: scanGrowth > 0 ? `+${scanGrowth}%` : '0%',
          totalOrders,
          todayOrders,
          pendingOrders,
          todayRevenue,
          totalRevenue
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get recent activity
// @route   GET /api/dashboard/activity
// @access  Private
exports.getRecentActivity = async (req, res, next) => {
  try {
    const userId = req.user.role === 'staff' && req.user.ownerId
      ? req.user.ownerId
      : req.user._id;

    // Get recently scanned QR codes
    const recentActivity = await QRCode.find({ userId })
      .sort({ lastScannedAt: -1 })
      .limit(10)
      .select('name type tableNumber scans lastScannedAt');

    res.status(200).json({
      success: true,
      data: { activity: recentActivity }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get QR codes summary
// @route   GET /api/dashboard/qr-summary
// @access  Private
exports.getQRSummary = async (req, res, next) => {
  try {
    const userId = req.user.role === 'staff' && req.user.ownerId
      ? req.user.ownerId
      : req.user._id;

    const qrCodes = await QRCode.find({ userId, isActive: true })
      .select('name type tableNumber scans createdAt')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        total: qrCodes.length,
        qrCodes
      }
    });
  } catch (error) {
    next(error);
  }
};
