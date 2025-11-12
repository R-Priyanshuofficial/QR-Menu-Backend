const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  printBill,
  testPrinter,
  getPrinterStatus
} = require('../controllers/printerController');

/**
 * Thermal Printer Routes
 * All routes are protected (owner only)
 */

// Get printer service status
router.get('/status', protect, getPrinterStatus);

// Test printer connection
router.post('/test', protect, testPrinter);

// Print bill to thermal printer
router.post('/print', protect, printBill);

module.exports = router;
