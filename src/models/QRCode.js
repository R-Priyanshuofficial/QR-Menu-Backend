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
  // QR Code Customization Options
  customization: {
    logoUrl: {
      type: String,
      default: null
    },
    borderStyle: {
      type: String,
      enum: ['none', 'square', 'rounded', 'circular'],
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
// Note: token index is automatically created by unique: true
qrCodeSchema.index({ userId: 1, isActive: 1 });

module.exports = mongoose.model('QRCode', qrCodeSchema);

