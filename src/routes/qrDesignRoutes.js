const express = require('express');
const router = express.Router();
const { generateDesigns } = require('../controllers/qrDesignController');
const { protect } = require('../middleware/auth');

router.post('/generate-designs', protect, generateDesigns);

module.exports = router;
