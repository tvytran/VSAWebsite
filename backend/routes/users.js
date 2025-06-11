const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const supabase = require('../supabaseClient');
const auth = require('../middleware/auth');

// @route   GET /api/users
// @desc    Get all users
// @access  Private (requires authentication)
router.get('/', auth, async (req, res) => {
    try {
        // Get all users, exclude passwords, join family name
        const { data: users, error } = await supabase
            .from('users')
            .select('id, username, email, role, profile_picture, created_at, family_id, points_total, points_semester, families(name)');
        if (error) throw error;
        res.json({ success: true, users });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get user profile
router.get('/profile', auth, async (req, res) => {
    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('id, username, email, role, profile_picture, created_at, family_id, points_total, points_semester')
            .eq('id', req.user.id)
            .single();
        if (error) throw error;
        res.json({ success: true, user });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
    try {
        // Update user fields (add validation as needed)
        const { username, email, profile_picture } = req.body;
        const { data, error } = await supabase
            .from('users')
            .update({ username, email, profile_picture })
            .eq('id', req.user.id);
        if (error) throw error;
        res.json({ success: true, message: 'Profile updated' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get user's posts
router.get('/:userId/posts', auth, async (req, res) => {
    try {
        // Get posts by userId
        const { data: posts, error } = await supabase
            .from('posts')
            .select('*')
            .eq('author_id', req.params.userId);
        if (error) throw error;
        res.json({ success: true, posts });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get user's groups (families)
router.get('/:userId/groups', auth, async (req, res) => {
    try {
        // Get the user's family
        const { data: user, error } = await supabase
            .from('users')
            .select('family_id')
            .eq('id', req.params.userId)
            .single();
        if (error) throw error;
        if (!user || !user.family_id) return res.json({ success: true, groups: [] });
        const { data: family, error: famError } = await supabase
            .from('families')
            .select('*')
            .eq('id', user.family_id)
            .single();
        if (famError) throw famError;
        res.json({ success: true, groups: family ? [family] : [] });
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
        // Delete user by ID
        const { data, error } = await supabase
            .from('users')
            .delete()
            .eq('id', req.params.userId);
        if (error) throw error;
        if (!data || data.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   PUT /api/users/:userId/role
// @desc    Update a user's role (admin only)
// @access  Private (Admin)
router.put('/:userId/role', auth, async (req, res) => {
    try {
        // Check if requester is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only admins can change user roles'
            });
        }

        const { role } = req.body;
        if (!role || !['user', 'admin'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role. Must be either "user" or "admin"'
            });
        }

        // Update the user's role
        const { data: updatedUser, error: updateError } = await supabase
            .from('users')
            .update({ role })
            .eq('id', req.params.userId)
            .select()
            .single();

        if (updateError) throw updateError;
        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            message: 'User role updated successfully',
            user: updatedUser
        });

    } catch (err) {
        console.error('Error updating user role:', err);
        res.status(500).json({
            success: false,
            message: err.message || 'Server error'
        });
    }
});

module.exports = router; 