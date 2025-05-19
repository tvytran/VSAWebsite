const express = require('express');
const router = express.Router();
const Family = require('../models/Family');

// Temporary route to create a test family
router.post('/test-family', async (req, res) => {
    try {
        const family = new Family({
            name: 'Test Family',
            description: 'A test family for development'
        });
        
        await family.save();
        res.json({
            success: true,
            family: {
                id: family._id,
                name: family.name
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

module.exports = router; 