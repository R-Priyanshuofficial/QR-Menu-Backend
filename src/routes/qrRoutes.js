const express = require('express');
const router = express.Router();
const { 
  generateQR, 
  getAllQRCodes, 
  getQRCode, 
  updateQR,
  duplicateQR,
  getRedirectUrl,
  updateRedirectUrl,
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
router.put('/:id', protect, updateQR);
router.post('/:id/duplicate', protect, duplicateQR);
router.get('/:id/redirect', protect, getRedirectUrl);
router.put('/:id/redirect', protect, updateRedirectUrl);
router.delete('/:id', protect, deleteQRCode);

module.exports = router;
