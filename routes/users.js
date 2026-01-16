const express = require('express');
const User = require('../models/User');
const { authenticate, authorize, checkPermission } = require('../middleware/auth');
const router = express.Router();

// Get all staff members (owner only)
router.get('/staff', authenticate, authorize(['owner']), async (req, res) => {
    try {
        const staff = await User.find({ role: 'staff' }, { password: 0, pin: 0 });
        res.json(staff);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Create new staff member (owner only)
router.post('/staff', authenticate, authorize(['owner']), async (req, res) => {
    try {
        const { email, password, name, pin, permissions } = req.body;

        // Validate PIN is 6 digits
        if (!/^\d{6}$/.test(pin)) {
            return res.status(400).json({ message: 'PIN must be 6 digits' });
        }

        const user = new User({
            email,
            password,
            name,
            pin,
            role: 'staff',
            permissions: permissions || []
        });

        await user.save();

        // Remove sensitive data before sending response
        const userObj = user.toObject();
        delete userObj.password;
        delete userObj.pin;

        res.status(201).json(userObj);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Email already exists' });
        }
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Update staff member (owner only)
router.put('/staff/:id', authenticate, authorize(['owner']), async (req, res) => {
    try {
        const { name, email, isActive, permissions } = req.body;
        const updates = { name, email, isActive, permissions };

        // Only update password if provided
        if (req.body.password) {
            const salt = await bcrypt.genSalt(10);
            updates.password = await bcrypt.hash(req.body.password, salt);
        }

        // Only update PIN if provided and valid
        if (req.body.pin) {
            if (!/^\d{6}$/.test(req.body.pin)) {
                return res.status(400).json({ message: 'PIN must be 6 digits' });
            }
            updates.pin = req.body.pin;
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { $set: updates },
            { new: true }
        ).select('-password -pin');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Email already exists' });
        }
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Delete staff member (owner only)
router.delete('/staff/:id', authenticate, authorize(['owner']), async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get current user's permissions
router.get('/me/permissions', authenticate, (req, res) => {
    try {
        res.json({ permissions: req.user.permissions });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
