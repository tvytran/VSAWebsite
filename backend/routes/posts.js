const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Create a new post (can be regular post or family hangout)
router.post('/', auth, async (req, res) => {
    try {
        const { 
            content,
            isHangout,        // Boolean to indicate if this is a hangout post
            hangoutDetails,   // Only required if isHangout is true
            // hangoutDetails: {
            //     date,
            //     time,
            //     location,
            //     pointValue,    // Points awarded for attending
            //     type,          // e.g., "cultural", "social", "academic"
            //     familyId       // ID of the family organizing the hangout
            // }
            photos           // Optional array of photo URLs
        } = req.body;
        
        // TODO: Verify user is a member of the specified family
        // TODO: Create post and hangout record
        res.status(201).json({ message: 'Post created successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all posts (with filters)
router.get('/', auth, async (req, res) => {
    try {
        const { 
            isHangout,      // Filter for hangout posts only
            familyId,       // Filter by family
            type,           // Filter by hangout type
            upcoming,       // Filter upcoming hangouts
            past,          // Filter past hangouts
            pointValue,     // Filter by point value
            page = 1, 
            limit = 10 
        } = req.query;
        
        // TODO: Get posts from database with filters
        res.json({ message: 'Get posts' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get a specific post
router.get('/:postId', auth, async (req, res) => {
    try {
        // TODO: Get post details including:
        // - Basic post info
        // - Hangout details (if it's a hangout)
        // - Organizing family info
        // - Attendance list (if it's a hangout)
        // - Point value (if it's a hangout)
        // - Photos
        res.json({ message: 'Get specific post' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Update a post (any family member can update their family's posts)
router.put('/:postId', auth, async (req, res) => {
    try {
        const { content, hangoutDetails } = req.body;
        // TODO: Verify user is a member of the post's family
        // TODO: Update post and hangout details
        res.json({ message: 'Post updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete a post (any family member can delete their family's posts)
router.delete('/:postId', auth, async (req, res) => {
    try {
        // TODO: Verify user is a member of the post's family
        // TODO: Delete post and associated hangout
        res.json({ message: 'Post deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Mark attendance for a hangout post (any family member can mark attendance)
router.post('/:postId/attendance', auth, async (req, res) => {
    try {
        const { attendees } = req.body; // Array of user IDs who attended
        // TODO: Verify user is a member of the post's family
        // TODO: Mark attendance and award points
        res.json({ message: 'Attendance marked successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Add photos to a post (any family member can add photos)
router.post('/:postId/photos', auth, async (req, res) => {
    try {
        // TODO: Verify user is a member of the post's family
        // TODO: Handle photo upload
        res.json({ message: 'Photos added successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Like/Unlike a post
router.post('/:postId/like', auth, async (req, res) => {
    try {
        // TODO: Toggle like status
        res.json({ message: 'Like status updated' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Add comment to a post
router.post('/:postId/comments', auth, async (req, res) => {
    try {
        const { content } = req.body;
        // TODO: Add comment
        res.status(201).json({ message: 'Comment added successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all hangouts for a specific family
router.get('/family/:familyId/hangouts', auth, async (req, res) => {
    try {
        const { 
            upcoming,    // Filter upcoming hangouts
            past,       // Filter past hangouts
            page = 1, 
            limit = 10 
        } = req.query;
        
        // TODO: Get all hangouts organized by this family
        res.json({ message: 'Get family hangouts' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router; 