const User = require('../models/User');
const ApiError = require('../utils/ApiError');

// @desc    Get all staff users for current owner
// @route   GET /api/staff
// @access  Private (owner/admin)
exports.getStaff = async (req, res, next) => {
    try {
        const ownerId = req.user._id;

        // Staff are users linked to this owner and role === 'staff'
        const staff = await User.find({
            role: 'staff',
            ownerId,
        }).select('-password');

        res.status(200).json({
            success: true,
            data: { staff },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create a new staff user
// @route   POST /api/staff
// @access  Private (owner/admin)
exports.createStaff = async (req, res, next) => {
    try {
        const { name, email, phone, permissions, pin, staffRole } = req.body;

        if (!name) {
            throw new ApiError('Name is required', 400);
        }

        if (!email && !phone) {
            throw new ApiError('Either email or phone number is required', 400);
        }

        if (!pin || !/^\d{6}$/.test(pin)) {
            throw new ApiError('PIN must be a 6-digit number', 400);
        }

        // If email provided, ensure not in use
        if (email) {
            const existingByEmail = await User.findOne({ email });
            if (existingByEmail) {
                throw new ApiError('A user with this email already exists', 400);
            }
        }

        // If phone provided, ensure not in use
        if (phone) {
            const existingByPhone = await User.findOne({ phone });
            if (existingByPhone) {
                throw new ApiError('A user with this phone already exists', 400);
            }
        }

        const plainPassword = pin;

        const user = await User.create({
            name,
            email: email || undefined,
            phone: phone || undefined,
            password: plainPassword,
            restaurantName: req.user.restaurantName,
            role: 'staff',
            ownerId: req.user._id,
            permissions: Array.isArray(permissions) ? permissions : [],
            staffPin: plainPassword,
            staffRole: staffRole || 'waiter', // Default to waiter if not specified
        });

        const publicUser = user.toJSON();

        res.status(201).json({
            success: true,
            message: 'Staff account created successfully',
            data: {
                user: publicUser,
                tempPassword: plainPassword,
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update staff user (permissions / status / basic info)
// @route   PUT /api/staff/:id
// @access  Private (owner/admin)
exports.updateStaff = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, email, phone, isActive, permissions, staffRole } = req.body;

        const user = await User.findById(id);
        if (!user || user.role !== 'staff') {
            throw new ApiError('Staff user not found', 404);
        }

        // Optional: ensure same restaurant
        if (user.restaurantName !== req.user.restaurantName) {
            throw new ApiError('Not authorized to modify this staff user', 403);
        }

        if (name !== undefined) user.name = name;
        if (email !== undefined) user.email = email;
        if (phone !== undefined) user.phone = phone;
        if (typeof isActive === 'boolean') user.isActive = isActive;
        if (Array.isArray(permissions)) user.permissions = permissions;
        if (staffRole !== undefined) user.staffRole = staffRole;

        await user.save();

        res.status(200).json({
            success: true,
            message: 'Staff updated successfully',
            data: { user: user.toJSON() },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete staff user
// @route   DELETE /api/staff/:id
// @access  Private (owner/admin)
exports.deleteStaff = async (req, res, next) => {
    try {
        const { id } = req.params;

        const user = await User.findById(id);
        if (!user || user.role !== 'staff') {
            throw new ApiError('Staff user not found', 404);
        }

        if (user.restaurantName !== req.user.restaurantName) {
            throw new ApiError('Not authorized to delete this staff user', 403);
        }

        await user.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Staff user deleted successfully',
        });
    } catch (error) {
        next(error);
    }
};
