const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long']
  },
  email: {
    type: String,
    required: false,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long'],
    select: false
  },
  phone: {
    type: String,
    trim: true
  },
  restaurantName: {
    type: String,
    trim: true
  },
  restaurantAddress: {
    type: String,
    trim: true
  },
  restaurantDescription: {
    type: String,
    trim: true
  },
  restaurantLogo: {
    type: String,
    trim: true
  },
  upiId: {
    type: String,
    trim: true
  },
  staffRole: {
    type: String,
    enum: ['admin', 'manager', 'waiter', 'kitchen', 'cashier'],
    default: null
  },
  role: {
    type: String,
    enum: ['owner', 'admin', 'staff'],
    default: 'owner'
  },
  // For staff accounts, link back to owner user
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  permissions: {
    type: [String],
    default: []
  },
  // Optional: store 6-digit staff PIN in plain text for owner reference
  staffPin: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to get public profile
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
