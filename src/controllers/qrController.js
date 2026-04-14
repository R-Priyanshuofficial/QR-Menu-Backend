const QRCode = require('../models/QRCode');
const { v4: uuidv4 } = require('uuid');
const ApiError = require('../utils/ApiError');
const { generateBaseQR, bufferToDataURL } = require('../services/qrService');
const { sanitizeCustomization } = require('../utils/qrCustomizationSanitizer');

// @desc    Generate QR Code
// @route   POST /api/qr/generate
// @access  Private
exports.generateQR = async (req, res, next) => {
  try {
    const {
      name, type, tableNumber, customization, designConfig,
      restaurantName, tagline, category
    } = req.body;
    const safeCustomization = sanitizeCustomization(customization || {}, type);
    const userId = req.user.id;

    // Check for duplicate table number
    if (type === 'table' && tableNumber) {
      const existingQR = await QRCode.findOne({
        userId, type: 'table', tableNumber, isActive: true
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
    const frontendBase = process.env.FRONTEND_APP_URL || requestOrigin || 'http://localhost:3000';
    const url = `${frontendBase}/m/${menuSlug}/q/${token}`;

    // Generate a basic QR image for fallback (emails, PDF exports, etc.)
    const qrColor = safeCustomization.qrColor || designConfig?.dotsOptions?.color || '#000000';
    const bgColor = safeCustomization.backgroundColor || designConfig?.backgroundOptions?.color || '#FFFFFF';
    const qrBuffer = await generateBaseQR(url, { qrColor, backgroundColor: bgColor });
    const qrCodeData = bufferToDataURL(qrBuffer);

    // Save to database with full design config
    const qrCodeDoc = await QRCode.create({
      userId,
      name,
      type,
      tableNumber: type === 'table' ? tableNumber : null,
      token,
      qrCodeData,
      url,
      redirectUrl: url,
      designConfig: designConfig || null,
      restaurantName: restaurantName || '',
      tagline: tagline || '',
      category: category || 'restaurant',
      customization: safeCustomization
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
          designConfig: qrCodeDoc.designConfig,
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

    const formattedQRCodes = qrCodes.map(qr => ({
      id: qr._id,
      name: qr.name,
      type: qr.type,
      tableNumber: qr.tableNumber,
      token: qr.token,
      url: qr.url,
      qrCodeData: qr.qrCodeData,
      designConfig: qr.designConfig,
      scans: qr.scans,
      createdAt: qr.createdAt,
      lastScannedAt: qr.lastScannedAt,
      restaurantName: qr.restaurantName,
      category: qr.category,
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
    if (!qrCode) throw new ApiError('QR Code not found', 404);
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

// @desc    Update QR code
// @route   PUT /api/qr/:id
// @access  Private
exports.updateQR = async (req, res, next) => {
  try {
    const qrCode = await QRCode.findById(req.params.id);
    if (!qrCode) throw new ApiError('QR Code not found', 404);
    if (qrCode.userId.toString() !== req.user.id) {
      throw new ApiError('Not authorized to update this QR Code', 403);
    }

    const { name, designConfig, customization, restaurantName, tagline, category, redirectUrl } = req.body;

    if (name) qrCode.name = name;
    if (designConfig) qrCode.designConfig = designConfig;
    if (customization) {
      const safeCustomization = sanitizeCustomization(customization, qrCode.type);
      qrCode.customization = { ...qrCode.customization, ...safeCustomization };
    }
    if (restaurantName !== undefined) qrCode.restaurantName = restaurantName;
    if (tagline !== undefined) qrCode.tagline = tagline;
    if (category) qrCode.category = category;
    if (redirectUrl) qrCode.redirectUrl = redirectUrl;

    // Regenerate fallback QR image
    const qrColor = qrCode.customization?.qrColor || designConfig?.dotsOptions?.color || '#000000';
    const bgColor = qrCode.customization?.backgroundColor || designConfig?.backgroundOptions?.color || '#FFFFFF';
    const qrBuffer = await generateBaseQR(qrCode.url, { qrColor, backgroundColor: bgColor });
    qrCode.qrCodeData = bufferToDataURL(qrBuffer);

    await qrCode.save();

    res.status(200).json({
      success: true,
      message: 'QR Code updated successfully',
      data: { qrCode }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Duplicate QR code
// @route   POST /api/qr/:id/duplicate
// @access  Private
exports.duplicateQR = async (req, res, next) => {
  try {
    const original = await QRCode.findById(req.params.id);
    if (!original) throw new ApiError('QR Code not found', 404);
    if (original.userId.toString() !== req.user.id) {
      throw new ApiError('Not authorized', 403);
    }

    const token = uuidv4();
    const requestOrigin = (req.headers.origin || '').replace(/\/$/, '');
    const frontendBase = process.env.FRONTEND_APP_URL || requestOrigin || 'http://localhost:3000';
    const menuSlug = req.user.restaurantName
      ? req.user.restaurantName.toLowerCase().replace(/\s+/g, '-')
      : 'menu';
    const url = `${frontendBase}/m/${menuSlug}/q/${token}`;

    // Generate QR image for the new URL
    const qrColor = original.customization?.qrColor || '#000000';
    const bgColor = original.customization?.backgroundColor || '#FFFFFF';
    const qrBuffer = await generateBaseQR(url, { qrColor, backgroundColor: bgColor });
    const qrCodeData = bufferToDataURL(qrBuffer);

    const duplicate = await QRCode.create({
      userId: original.userId,
      name: `${original.name} (Copy)`,
      type: original.type,
      tableNumber: null,
      token,
      qrCodeData,
      url,
      redirectUrl: url,
      designConfig: original.designConfig,
      restaurantName: original.restaurantName,
      tagline: original.tagline,
      category: original.category,
      customization: original.customization,
    });

    res.status(201).json({
      success: true,
      message: 'QR Code duplicated',
      data: { qrCode: duplicate }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get redirect URL
// @route   GET /api/qr/:id/redirect
// @access  Private
exports.getRedirectUrl = async (req, res, next) => {
  try {
    const qrCode = await QRCode.findById(req.params.id);
    if (!qrCode) throw new ApiError('QR Code not found', 404);
    if (qrCode.userId.toString() !== req.user.id) {
      throw new ApiError('Not authorized', 403);
    }

    res.status(200).json({
      success: true,
      data: { redirectUrl: qrCode.redirectUrl || qrCode.url }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update redirect URL (dynamic QR)
// @route   PUT /api/qr/:id/redirect
// @access  Private
exports.updateRedirectUrl = async (req, res, next) => {
  try {
    const qrCode = await QRCode.findById(req.params.id);
    if (!qrCode) throw new ApiError('QR Code not found', 404);
    if (qrCode.userId.toString() !== req.user.id) {
      throw new ApiError('Not authorized', 403);
    }

    const { url } = req.body;
    if (!url) throw new ApiError('URL is required', 400);

    qrCode.redirectUrl = url;
    await qrCode.save();

    res.status(200).json({
      success: true,
      message: 'Redirect URL updated',
      data: { redirectUrl: qrCode.redirectUrl }
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
    if (!qrCode) throw new ApiError('QR Code not found', 404);
    if (qrCode.userId.toString() !== req.user.id) {
      throw new ApiError('Not authorized to delete this QR Code', 403);
    }

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

    if (!qrCode) throw new ApiError('QR Code not found or inactive', 404);

    // Increment scan count
    qrCode.scans += 1;
    qrCode.lastScannedAt = new Date();

    // Store scan event for analytics
    qrCode.scanEvents.push({
      timestamp: new Date(),
      userAgent: req.headers['user-agent'] || 'unknown',
      referer: req.headers.referer || null,
    });

    // Keep only last 500 scan events to avoid document bloat
    if (qrCode.scanEvents.length > 500) {
      qrCode.scanEvents = qrCode.scanEvents.slice(-500);
    }

    await qrCode.save();

    res.status(200).json({
      success: true,
      message: 'Scan tracked successfully',
      data: {
        url: qrCode.redirectUrl || qrCode.url,
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
