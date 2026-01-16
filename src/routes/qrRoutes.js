const express = require('express');
const router = express.Router();
const { 
  generateQR, 
  getAllQRCodes, 
  getQRCode, 
  deleteQRCode, 
  trackScan,
  getAvatars
} = require('../controllers/qrController');
const { protect } = require('../middleware/auth');
const { qrValidation, validate } = require('../middleware/validator');

// Public routes
router.post('/scan/:token', trackScan);
router.get('/avatars', getAvatars);

// Protected routes
router.post('/generate', protect, qrValidation, validate, generateQR);
router.get('/', protect, getAllQRCodes);
router.get('/:id', protect, getQRCode);
router.delete('/:id', protect, deleteQRCode);

module.exports = router;

