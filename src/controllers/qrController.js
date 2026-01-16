const QRCode = require('../models/QRCode');
const { v4: uuidv4 } = require('uuid');
const ApiError = require('../utils/ApiError');
const { generateCustomizedQR, bufferToDataURL } = require('../services/qrService');

// @desc    Generate QR Code
// @route   POST /api/qr/generate
// @access  Private
exports.generateQR = async (req, res, next) => {
  try {
    const { name, type, tableNumber, customization } = req.body;
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
    const requestOrigin = (req.headers.origin || '').replace(/\/$/, '');
    const frontendBase = (process.env.FRONTEND_APP_URL || requestOrigin || 'http://localhost:3000');
    const url = `${frontendBase}/m/${menuSlug}/q/${token}`;

    // Prepare customization options
    const qrCustomization = {
      qrColor: customization?.qrColor || '#000000',
      backgroundColor: customization?.backgroundColor || '#FFFFFF',
      logoUrl: customization?.logoUrl || null,
      avatarId: customization?.avatarId || null,
      borderStyle: customization?.borderStyle || 'none',
      borderColor: customization?.borderColor || '#000000',
      showTableNumber: type === 'table' && customization?.showTableNumber === true,
      tableNumber: type === 'table' ? tableNumber : null
    };

    // Generate customized QR code
    const qrBuffer = await generateCustomizedQR(url, qrCustomization);
    const qrCodeData = bufferToDataURL(qrBuffer);

    // Save to database
    const qrCodeDoc = await QRCode.create({
      userId,
      name,
      type,
      tableNumber: type === 'table' ? tableNumber : null,
      token,
      qrCodeData,
      url,
      customization: {
        logoUrl: qrCustomization.logoUrl,
        borderStyle: qrCustomization.borderStyle,
        borderColor: qrCustomization.borderColor,
        qrColor: qrCustomization.qrColor,
        backgroundColor: qrCustomization.backgroundColor,
        showTableNumber: qrCustomization.showTableNumber,
        avatarId: qrCustomization.avatarId
      }
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
          customization: qrCodeDoc.customization,
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
    const userId = req.user.role === 'staff' && req.user.ownerId
      ? req.user.ownerId
      : req.user._id;

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

// @desc    Get available avatars
// @route   GET /api/qr/avatars
// @access  Public
exports.getAvatars = async (req, res, next) => {
  try {
    const avatars = [
      { id: 'chef', name: 'Chef Hat', url: '/avatars/chef.png' },
      { id: 'fork-knife', name: 'Fork & Knife', url: '/avatars/fork-knife.png' },
      { id: 'pizza', name: 'Pizza', url: '/avatars/pizza.png' },
      { id: 'burger', name: 'Burger', url: '/avatars/burger.png' },
      { id: 'coffee', name: 'Coffee', url: '/avatars/coffee.png' },
      { id: 'plate', name: 'Plate', url: '/avatars/plate.png' },
      { id: 'wine', name: 'Wine Glass', url: '/avatars/wine.png' },
      { id: 'cake', name: 'Cake', url: '/avatars/cake.png' }
    ];

    res.status(200).json({
      success: true,
      data: { avatars }
    });
  } catch (error) {
    next(error);
  }
};

