const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Post = require('../models/Post');
const Family = require('../models/Family');

// Create a new post (can be regular post or family hangout)
router.post('/', auth, async (req, res) => {
    try {
        const { title, type, content, family, pointValue } = req.body;
        if (!title || !type || !content || !family) {
            return res.status(400).json({ success: false, message: 'Title, type, content, and family are required.' });
        }
        // Check if user is a member of the family
        const fam = await Family.findById(family);
        if (!fam || !fam.members.map(id => id.toString()).includes(req.user.id)) {
            return res.status(403).json({ success: false, message: 'You are not a member of this family.' });
        }
        // Create the post
        const post = await Post.create({
            title,
            type,
            content,
            family,
            author: req.user.id,
            createdAt: new Date(),
            ...(type === 'hangout' && pointValue ? { pointValue } : {})
        });
        // Update family points if hangout with pointValue
        if (type === 'hangout' && pointValue) {
            await Family.findByIdAndUpdate(
                family,
                {
                    $inc: {
                        totalPoints: Number(pointValue),
                        semesterPoints: Number(pointValue)
                    }
                }
            );
        }
        res.status(201).json({ success: true, post });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
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

// Get all posts for the feed (all families, sorted by date)
router.get('/feed', auth, async (req, res) => {
    try {
        const posts = await Post.find({})
            .sort({ createdAt: -1 })
            .populate('author', 'username email')
            .populate('family', 'name');
        res.json({ success: true, posts });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
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

// Edit a post (only family members, only title and content)
router.put('/:postId', auth, async (req, res) => {
    try {
        const { title, content } = req.body;
        if (!title || !content) {
            return res.status(400).json({ success: false, message: 'Title and content are required.' });
        }
        const post = await Post.findById(req.params.postId);
        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found.' });
        }
        // Check if user is a member of the post's family
        const fam = await Family.findById(post.family);
        if (!fam || !fam.members.map(id => id.toString()).includes(req.user.id)) {
            return res.status(403).json({ success: false, message: 'You are not allowed to edit this post.' });
        }
        // Update only title and content
        post.title = title;
        post.content = content;
        await post.save();
        res.json({ success: true, post });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Delete a post (only family members)
router.delete('/:postId', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);
        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found.' });
        }
        // Check if user is a member of the post's family
        const fam = await Family.findById(post.family);
        if (!fam || !fam.members.map(id => id.toString()).includes(req.user.id)) {
            return res.status(403).json({ success: false, message: 'You are not allowed to delete this post.' });
        }
        // Subtract points if hangout with pointValue
        if (post.type === 'hangout' && post.pointValue) {
            await Family.findByIdAndUpdate(
                post.family,
                {
                    $inc: {
                        totalPoints: -Math.abs(post.pointValue),
                        semesterPoints: -Math.abs(post.pointValue)
                    }
                }
            );
        }
        await post.deleteOne();
        res.json({ success: true, message: 'Post deleted.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
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

// Get all posts for a specific family
router.get('/family/:familyId', auth, async (req, res) => {
    try {
        const posts = await Post.find({ family: req.params.familyId })
            .sort({ createdAt: -1 });
        res.json({ success: true, posts });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router; 