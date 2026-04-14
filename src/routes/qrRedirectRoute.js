const express = require('express');
const router = express.Router();
const QRCode = require('../models/QRCode');

/**
 * Dynamic QR Redirect
 * GET /qr/:token → looks up QR by token, tracks scan, redirects to target URL
 */
router.get('/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const qrCode = await QRCode.findOne({ token, isActive: true });

    if (!qrCode) {
      return res.status(404).send('QR Code not found');
    }

    // Track scan
    qrCode.scans += 1;
    qrCode.lastScannedAt = new Date();
    qrCode.scanEvents.push({
      timestamp: new Date(),
      userAgent: req.headers['user-agent'] || 'unknown',
      referer: req.headers.referer || null,
    });

    if (qrCode.scanEvents.length > 500) {
      qrCode.scanEvents = qrCode.scanEvents.slice(-500);
    }

    await qrCode.save();

    // Redirect to target URL (or redirect URL if set)
    const targetUrl = qrCode.redirectUrl || qrCode.url;
    res.redirect(302, targetUrl);
  } catch (error) {
    console.error('QR redirect error:', error);
    res.status(500).send('Server error');
  }
});

module.exports = router;
