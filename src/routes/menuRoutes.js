const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  uploadMenuWithOCR,
  getOwnerMenu,
  getPublicMenu,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
  deleteAllMenuItems,
  updateMenu
} = require('../controllers/menuController');
const { protect } = require('../middleware/auth');

// Configure multer for file uploads (memory storage for AI Vision processing)
const storage = multer.memoryStorage();

// Supported formats for AI Vision models (Gemini, OpenAI, Groq)
const SUPPORTED_MIMETYPES = [
  // Common image formats
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/webp',
  'image/gif',
  'image/bmp',
  'image/tiff',
  'image/tif',
  // Apple formats
  'image/heic',
  'image/heif',
  // PDF
  'application/pdf'
];

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept all AI-supported image formats and PDFs
    const isSupported = SUPPORTED_MIMETYPES.includes(file.mimetype.toLowerCase()) || 
                       file.mimetype.startsWith('image/');
    
    if (isSupported) {
      cb(null, true);
    } else {
      cb(new Error(`File type not supported. Accepted formats: JPEG, PNG, WEBP, GIF, BMP, TIFF, HEIC, HEIF, PDF`), false);
    }
  }
});

// Protected routes (require authentication) - MUST come before public routes
router.post('/upload', protect, upload.single('menuFile'), uploadMenuWithOCR);
router.get('/owner', protect, getOwnerMenu);
router.put('/', protect, updateMenu);

// Menu item CRUD
router.post('/items', protect, addMenuItem);
router.put('/items/:id', protect, updateMenuItem);
router.delete('/items/:id', protect, deleteMenuItem);
router.delete('/items', protect, deleteAllMenuItems);

// Public routes - MUST come last to avoid catching protected routes
router.get('/:slug', getPublicMenu);

module.exports = router;
