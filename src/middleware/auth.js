const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');

exports.protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw new ApiError('Not authorized to access this route', 401);
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        throw new ApiError('User not found', 404);
      }

      if (!req.user.isActive) {
        throw new ApiError('User account is deactivated', 403);
      }

      next();
    } catch (error) {
      throw new ApiError('Invalid or expired token', 401);
    }
  } catch (error) {
    next(error);
  }
};

// Optional: Role-based authorization
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new ApiError(`User role '${req.user.role}' is not authorized to access this route`, 403));
    }
    next();
  };
};
