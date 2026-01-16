const InventoryItem = require('../models/InventoryItem');
const ApiError = require('../utils/ApiError');

// @desc    Get all inventory items
// @route   GET /api/inventory
// @access  Private (owner/admin/manager)
exports.getInventory = async (req, res, next) => {
    try {
        const ownerId = req.user.role === 'staff' ? req.user.ownerId : req.user._id;
        console.log(`[Inventory] Fetching items for ownerId: ${ownerId}`);

        const items = await InventoryItem.find({ ownerId }).sort({ name: 1 });
        console.log(`[Inventory] Found ${items.length} items`);

        res.status(200).json({
            success: true,
            count: items.length,
            data: items
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Add new inventory item
// @route   POST /api/inventory
// @access  Private (owner/admin/manager)
exports.addItem = async (req, res, next) => {
    try {
        const { name, quantity, unit, minLevel, costPerUnit } = req.body;
        const ownerId = req.user.role === 'staff' ? req.user.ownerId : req.user._id;
        console.log(`[Inventory] Adding item for ownerId: ${ownerId}, User Role: ${req.user.role}`);

        // Check if item already exists (case-insensitive)
        const existingItem = await InventoryItem.findOne({ 
            name: { $regex: new RegExp(`^${name}$`, 'i') },
            ownerId 
        });
        
        if (existingItem) {
            console.log(`[Inventory] Item already exists: ${name} (matches ${existingItem.name})`);
            return res.status(409).json({
                success: false,
                message: 'Item with this name already exists',
                existingItem
            });
        }

        const item = await InventoryItem.create({
            name,
            quantity,
            unit,
            minLevel,
            costPerUnit,
            ownerId
        });
        console.log(`[Inventory] Item created: ${item._id}`);

        res.status(201).json({
            success: true,
            data: item
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update inventory item
// @route   PUT /api/inventory/:id
// @access  Private (owner/admin/manager)
exports.updateItem = async (req, res, next) => {
    try {
        const { name, quantity, unit, minLevel, costPerUnit } = req.body;
        const ownerId = req.user.role === 'staff' ? req.user.ownerId : req.user._id;

        let item = await InventoryItem.findOne({ _id: req.params.id, ownerId });

        if (!item) {
            throw new ApiError('Item not found', 404);
        }

        if (name) item.name = name;
        if (quantity !== undefined) item.quantity = quantity;
        if (unit) item.unit = unit;
        if (minLevel !== undefined) item.minLevel = minLevel;
        if (costPerUnit !== undefined) item.costPerUnit = costPerUnit;

        await item.save();

        res.status(200).json({
            success: true,
            data: item
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete inventory item
// @route   DELETE /api/inventory/:id
// @access  Private (owner/admin/manager)
exports.deleteItem = async (req, res, next) => {
    try {
        const ownerId = req.user.role === 'staff' ? req.user.ownerId : req.user._id;

        const item = await InventoryItem.findOne({ _id: req.params.id, ownerId });

        if (!item) {
            throw new ApiError('Item not found', 404);
        }

        await item.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Item deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};
