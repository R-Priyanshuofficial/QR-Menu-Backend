const QRCode = require('../models/QRCode');
const qrcode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const ApiError = require('../utils/ApiError');

// @desc    Generate QR Code
// @route   POST /api/qr/generate
// @access  Private
exports.generateQR = async (req, res, next) => {
  try {
    const { name, type, tableNumber } = req.body;
    const userId = req.user.id;

    // Check for duplicate table number
    if (type === 'table' && tableNumber) {
      const existingQR = await QRCode.findOne({
        userId,
        type: 'table',
        tableNumber,
        isActive: true
      });

      if (existingQR) {
        throw new ApiError(`QR code for Table ${tableNumber} already exists`, 400);
      }
    }

    // Generate unique token
    const token = uuidv4();

    // Create menu URL
    const menuSlug = req.user.restaurantName
      ? req.user.restaurantName.toLowerCase().replace(/\s+/g, '-')
      : 'menu';
    // Prefer the frontend origin from the request (admin app) if provided,
    // otherwise fall back to env variable, then localhost for development.
    const requestOrigin = (req.headers.origin || '').replace(/\/$/, '');
    const frontendBase = (process.env.FRONTEND_APP_URL || requestOrigin || 'http://localhost:3000');
    const url = `${frontendBase}/m/${menuSlug}/q/${token}`;

    // Generate QR code as data URL
    const qrCodeData = await qrcode.toDataURL(url, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    // Save to database
    const qrCodeDoc = await QRCode.create({
      userId,
      name,
      type,
      tableNumber: type === 'table' ? tableNumber : null,
      token,
      qrCodeData,
      url
    });

    res.status(201).json({
      success: true,
      message: 'QR Code generated successfully',
      data: {
        qrCode: {
          id: qrCodeDoc._id,
          name: qrCodeDoc.name,
          type: qrCodeDoc.type,
          tableNumber: qrCodeDoc.tableNumber,
          token: qrCodeDoc.token,
          url: qrCodeDoc.url,
          qrCodeData: qrCodeDoc.qrCodeData,
          createdAt: qrCodeDoc.createdAt
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all QR codes
// @route   GET /api/qr
// @access  Private
exports.getAllQRCodes = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const qrCodes = await QRCode.find({ userId, isActive: true })
      .sort({ createdAt: -1 });

    // Map _id to id for consistency with frontend
    const formattedQRCodes = qrCodes.map(qr => ({
      id: qr._id,
      name: qr.name,
      type: qr.type,
      tableNumber: qr.tableNumber,
      token: qr.token,
      url: qr.url,
      qrCodeData: qr.qrCodeData,
      scans: qr.scans,
      createdAt: qr.createdAt,
      lastScannedAt: qr.lastScannedAt
    }));

    res.status(200).json({
      success: true,
      count: formattedQRCodes.length,
      data: { qrCodes: formattedQRCodes }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single QR code
// @route   GET /api/qr/:id
// @access  Private
exports.getQRCode = async (req, res, next) => {
  try {
    const qrCode = await QRCode.findById(req.params.id);

    if (!qrCode) {
      throw new ApiError('QR Code not found', 404);
    }

    // Check ownership
    if (qrCode.userId.toString() !== req.user.id) {
      throw new ApiError('Not authorized to access this QR Code', 403);
    }

    res.status(200).json({
      success: true,
      data: { qrCode }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete QR code
// @route   DELETE /api/qr/:id
// @access  Private
exports.deleteQRCode = async (req, res, next) => {
  try {
    const qrCode = await QRCode.findById(req.params.id);

    if (!qrCode) {
      throw new ApiError('QR Code not found', 404);
    }

    // Check ownership
    if (qrCode.userId.toString() !== req.user.id) {
      throw new ApiError('Not authorized to delete this QR Code', 403);
    }

    // Hard delete - permanently remove from database
    await QRCode.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'QR Code deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Track QR code scan
// @route   POST /api/qr/scan/:token
// @access  Public
exports.trackScan = async (req, res, next) => {
  try {
    const { token } = req.params;

    const qrCode = await QRCode.findOne({ token, isActive: true });

    if (!qrCode) {
      throw new ApiError('QR Code not found or inactive', 404);
    }

    // Increment scan count
    qrCode.scans += 1;
    qrCode.lastScannedAt = new Date();
    await qrCode.save();

    res.status(200).json({
      success: true,
      message: 'Scan tracked successfully',
      data: {
        url: qrCode.url,
        tableNumber: qrCode.tableNumber
      }
    });
  } catch (error) {
    next(error);
  }
};
