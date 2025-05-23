const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Import User model

// Middleware to verify JWT token
const auth = require('../middleware/auth');

// @route   GET /api/users
// @desc    Get all users
// @access  Private (requires authentication)
router.get('/', auth, async (req, res) => {
    try {
        const users = await User.find()
            .select('-password') // Exclude passwords
            .populate('family', 'name'); // Populate the family field and select only the name
        res.json({ success: true, users });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get user profile
router.get('/profile', auth, async (req, res) => {
    try {
        // TODO: Get user from database
        res.json({ message: 'Get user profile' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
    try {
        // TODO: Update user in database
        res.json({ message: 'Update user profile' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get user's posts
router.get('/:userId/posts', auth, async (req, res) => {
    try {
        // TODO: Get user's posts from database
        res.json({ message: 'Get user posts' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get user's groups
router.get('/:userId/groups', auth, async (req, res) => {
    try {
        // TODO: Get user's groups from database
        res.json({ message: 'Get user groups' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   DELETE /api/users/:userId
// @desc    Delete a user
// @access  Private (Admin only)
router.delete('/:userId', auth, async (req, res) => {
    try {
        // Check if the user is an admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
        }

        // Find and delete the user by ID
        const user = await User.findByIdAndDelete(req.params.userId);

        // Check if the user was found and deleted
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Respond with success message
        res.json({ success: true, message: 'User deleted successfully' });

    } catch (error) {
        console.error(error.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router; 