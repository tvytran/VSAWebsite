const express = require('express');
const router = express.Router();
const Family = require('../models/Family');
const auth = require('../middleware/auth');

// @route   POST /api/families
// @desc    Create a new family
// @access  Private (requires authentication)
router.post('/', auth, async (req, res) => {
    try {
        const { name, description } = req.body;

        // Check if family name already exists
        let family = await Family.findOne({ name });
        if (family) {
            return res.status(400).json({
                success: false,
                message: 'Family with this name already exists'
            });
        }

        // Create new family
        family = new Family({
            name,
            description,
            members: [req.user.id] // Add the creator as the first member
        });
        
        await family.save();

        res.status(201).json({
            success: true,
            family: {
                id: family._id,
                name: family.name,
                description: family.description,
                members: family.members
            }
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   GET /api/families
// @desc    Get all families
// @access  Public
router.get('/', async (req, res) => {
    try {
        const families = await Family.find().select('-__v');
        res.json({
            success: true,
            families
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   GET /api/families/:id
// @desc    Get family by ID
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const family = await Family.findById(req.params.id)
            .select('-__v')
            .populate('members', 'username email');
        
        if (!family) {
            return res.status(404).json({
                success: false,
                message: 'Family not found'
            });
        }

        res.json({
            success: true,
            family
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

module.exports = router; 