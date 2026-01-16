const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
    getInventory,
    addItem,
    updateItem,
    deleteItem
} = require('../controllers/inventoryController');

router.use(protect);
// Allow owner, admin, and manager to manage inventory
router.use(authorize('owner', 'admin', 'manager'));

router.route('/')
    .get(getInventory)
    .post(addItem);

router.route('/:id')
    .put(updateItem)
    .delete(deleteItem);

module.exports = router;
