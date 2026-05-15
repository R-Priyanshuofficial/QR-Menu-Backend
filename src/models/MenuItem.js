const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  isDefault: { type: Boolean, default: false },
  isAvailable: { type: Boolean, default: true },
}, { _id: true });

const addonSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  isRequired: { type: Boolean, default: false },
  maxQuantity: { type: Number, default: 1, min: 1 },
}, { _id: true });

const menuItemSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price must be positive']
  },
  currency: {
    type: String,
    default: 'INR',
    trim: true,
    uppercase: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true,
    lowercase: true
  },
  image: {
    type: String,
    default: ''
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  isVeg: {
    type: Boolean,
    default: true
  },
  spiceLevel: {
    type: String,
    enum: ['none', 'mild', 'medium', 'hot', 'very-hot'],
    default: 'none'
  },
  preparationTime: {
    type: Number, // in minutes
    default: 15
  },
  isActive: {
    type: Boolean,
    default: true
  },

  // ── Extended Fields ──
  tags: {
    type: [String],
    default: []
  },
  badge: {
    type: String,
    enum: ['none', 'bestseller', 'new', 'chef-special', 'trending'],
    default: 'none'
  },
  comparePrice: {
    type: Number,
    default: 0,
    min: 0
  },
  offerPrice: {
    type: Number,
    default: 0,
    min: 0
  },
  taxPercent: {
    type: Number,
    default: 0,
    min: 0
  },
  costPrice: {
    type: Number,
    default: 0,
    min: 0
  },
  variants: {
    type: [variantSchema],
    default: []
  },
  addons: {
    type: [addonSchema],
    default: []
  },
  availability: {
    status: {
      type: String,
      enum: ['in-stock', 'out-of-stock', 'hidden', 'seasonal'],
      default: 'in-stock'
    },
    timeSlots: {
      type: [String],
      default: ['all-day']
    }
  },
  sku: {
    type: String,
    default: '',
    trim: true
  },
  calories: {
    type: Number,
    default: 0,
    min: 0
  },
  servingSize: {
    type: String,
    default: '',
    trim: true
  },
  sortOrder: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes for faster queries
menuItemSchema.index({ userId: 1, isActive: 1 });
menuItemSchema.index({ userId: 1, category: 1 });
menuItemSchema.index({ userId: 1, name: 'text', description: 'text' });

module.exports = mongoose.model('MenuItem', menuItemSchema);
