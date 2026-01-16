const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authenticate, authorize } = require('../middleware/auth');
const router = express.Router();

// Register a new owner (only for initial setup)
router.post('/register', async (req, res) => {
    try {
        // Check if any owner exists
        const ownerExists = await User.findOne({ role: 'owner' });
        if (ownerExists) {
            return res.status(400).json({ message: 'An owner already exists' });
        }

        const { email, password, name, pin } = req.body;

        // Validate PIN is 6 digits
        if (!/^\d{6}$/.test(pin)) {
            return res.status(400).json({ message: 'PIN must be 6 digits' });
        }

        const user = new User({
            email,
            password,
            name,
            pin,
            role: 'owner',
            permissions: ['dashboard', 'menu', 'orders', 'reports', 'settings', 'staff']
        });

        await user.save();

        // Generate token
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                permissions: user.permissions
            },
            token
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Email already exists' });
        }
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password, pin } = req.body;

        // Find user by email
        const user = await User.findOne({ email, isActive: true });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Verify password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Verify PIN
        if (!user.verifyPin(pin)) {
            return res.status(400).json({ message: 'Invalid PIN' });
        }

        // Generate token
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.json({
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                permissions: user.permissions
            },
            token
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get current user
router.get('/me', authenticate, async (req, res) => {
    try {
        res.json({
            user: {
                id: req.user._id,
                name: req.user.name,
                email: req.user.email,
                role: req.user.role,
                permissions: req.user.permissions
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
