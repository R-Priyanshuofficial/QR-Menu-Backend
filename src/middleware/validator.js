const { body, validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

// Validation middleware to check errors
exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const message = errors.array().map(err => err.msg).join(', ');
    throw new ApiError(message, 400);
  }
  next();
};

// Register validation rules
exports.registerValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2 }).withMessage('Name must be at least 2 characters long'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),

  body('restaurantName')
    .optional()
    .trim()
];

// Login validation rules (email OR phone in the same field)
exports.loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email or phone is required'),

  body('password')
    .notEmpty().withMessage('Password is required')
];

// QR Code validation rules
exports.qrValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('QR Code name is required'),

  body('type')
    .notEmpty().withMessage('QR Code type is required')
    .isIn(['global', 'table']).withMessage('Type must be either global or table'),

  body('tableNumber')
    .if(body('type').equals('table'))
    .notEmpty().withMessage('Table number is required for table QR codes')
];
