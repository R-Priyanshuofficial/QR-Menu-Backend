const mongoose = require('mongoose');

const qrCodeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'QR Code name is required'],
    trim: true
  },
  type: {
    type: String,
    enum: ['global', 'table'],
    default: 'global'
  },
  tableNumber: {
    type: String,
    trim: true
  },
  token: {
    type: String,
    required: true,
    unique: true
  },
  qrCodeData: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  // Dynamic QR: changeable redirect URL (separate from the encoded URL)
  redirectUrl: {
    type: String,
    default: null
  },
  scans: {
    type: Number,
    default: 0
  },
  lastScannedAt: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // ─── NEW: Full Design Config (single source of truth) ───
  designConfig: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  restaurantName: {
    type: String,
    trim: true
  },
  tagline: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    enum: ['restaurant', 'cafe', 'bar', 'bakery', 'cloud-kitchen', 'food-truck', 'other'],
    default: 'restaurant'
  },
  // Brand theme reference
  brandThemeId: {
    type: String,
    default: null
  },
  // Scan analytics events
  scanEvents: [{
    timestamp: { type: Date, default: Date.now },
    userAgent: String,
    referer: String,
  }],
  // Legacy: basic customization (kept for backward compat)
  customization: {
    logoUrl: {
      type: String,
      default: null
    },
    borderStyle: {
      type: String,
      default: 'none'
    },
    borderColor: {
      type: String,
      default: '#000000'
    },
    qrColor: {
      type: String,
      default: '#000000'
    },
    backgroundColor: {
      type: String,
      default: '#FFFFFF'
    },
    showTableNumber: {
      type: Boolean,
      default: false
    },
    avatarId: {
      type: String,
      default: null
    }
  }
}, {
  timestamps: true
});

// Index for faster queries
qrCodeSchema.index({ userId: 1, isActive: 1 });
qrCodeSchema.index({ token: 1 });

module.exports = mongoose.model('QRCode', qrCodeSchema);
