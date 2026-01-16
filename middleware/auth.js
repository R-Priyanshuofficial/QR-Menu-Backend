const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to verify JWT token
exports.authenticate = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findOne({ _id: decoded.userId, isActive: true });

        if (!user) {
            return res.status(401).json({ message: 'User not found or inactive' });
        }

        req.user = user;
        req.token = token;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Please authenticate' });
    }
};

// Middleware to check if user has required role
exports.authorize = (roles = []) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        if (roles.length && !roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Not authorized to access this resource' });
        }

        next();
    };
};

// Middleware to check specific permission
exports.checkPermission = (permission) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        // Owner has all permissions
        if (req.user.role === 'owner') {
            return next();
        }

        if (!req.user.permissions || !req.user.permissions.includes(permission)) {
            return res.status(403).json({ message: 'Insufficient permissions' });
        }

        next();
    };
};
