const express = require('express');
const router = express.Router();
const { getStaff, createStaff, updateStaff, deleteStaff } = require('../controllers/staffController');
const { protect, authorize } = require('../middleware/auth');

// All routes here are protected and only accessible by owner/admin
router.use(protect, authorize('owner', 'admin'));

router.get('/', getStaff);
router.post('/', createStaff);
router.put('/:id', updateStaff);
router.delete('/:id', deleteStaff);

module.exports = router;
