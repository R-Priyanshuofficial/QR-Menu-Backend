const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const generateToken = require('../utils/generateToken');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, phone, restaurantName } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ApiError('User with this email already exists', 400);
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      phone,
      restaurantName
    });

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          restaurantName: user.restaurantName
        },
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email: identifier, password, role: requestedRole } = req.body;

    if (!identifier) {
      throw new ApiError('Email or phone is required', 400);
    }

    // Find user by email (if contains @) or by phone otherwise
    let user = null;
    if (identifier.includes('@')) {
      user = await User.findOne({ email: identifier }).select('+password');
    } else {
      user = await User.findOne({ phone: identifier }).select('+password');
    }

    if (!user) {
      throw new ApiError('Invalid email or password', 401);
    }

    // Check if account is active
    if (!user.isActive) {
      throw new ApiError('Your account has been deactivated', 403);
    }

    // Check password
    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      throw new ApiError('Invalid email or password', 401);
    }

    // If frontend specified a login mode (owner/staff), enforce it
    if (requestedRole && user.role && requestedRole !== user.role) {
      // Do not leak too much info but give a useful message
      if (requestedRole === 'staff' && user.role !== 'staff') {
        throw new ApiError('This account is an owner account. Please use the Owner tab to login.', 403);
      }
      if (requestedRole === 'owner' && user.role === 'staff') {
        throw new ApiError('This account is a staff account. Please use the Staff tab to login.', 403);
      }

      throw new ApiError('This account cannot be used with the selected login type.', 403);
    }

    // Generate token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          restaurantName: user.restaurantName,
          role: user.role,
          permissions: user.permissions || []
        },
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone, restaurantName, restaurantAddress, restaurantDescription, restaurantLogo } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, phone, restaurantName, restaurantAddress, restaurantDescription, restaurantLogo },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};
