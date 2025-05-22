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
        const users = await User.find().select('-password'); // Exclude passwords
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

module.exports = router; 