// debug removed
const express = require('express');
const router = express.Router();

//
const bcrypt = require('bcrypt');

//
const jwt = require('jsonwebtoken');

//
const supabase = require('../supabaseClient');

//
const auth = require('../middleware/auth');

// @route   GET /api/users
// @desc    Get all users
// @access  Private (requires authentication)
router.get('/', auth, async (req, res) => {
    try {
        // Get all users, exclude passwords, join family name
        const { data: users, error } = await req.supabase
            .from('users')
            .select('id, username, email, role, profile_picture, created_at, family_id, points_total, points_semester, families(name)');
        if (error) throw error;
        res.json({ success: true, users });
    } catch (error) {
        // log suppressed
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get user profile
router.get('/profile', auth, async (req, res) => {
    try {
        const { data: user, error } = await req.supabase
            .from('users')
            .select('id, username, email, role, profile_picture, created_at, family_id, points_total, points_semester')
            .eq('id', req.user.id)
            .single();
        if (error) throw error;
        res.json({ success: true, user });
    } catch (error) {
        const msg = (error && (error.message || error.code || '')) || '';
        if (msg.includes('users_username_lower_unique') || (msg.includes('duplicate key value') && msg.toLowerCase().includes('username'))) {
            return res.status(400).json({ message: 'someone with this username already exists' });
        }
        res.status(500).json({ message: 'Server error' });
    }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
    try {
        const updateData = {};
        const { username, email, profile_picture } = req.body;

        if (typeof email !== 'undefined') {
            updateData.email = email;
        }
        if (typeof profile_picture !== 'undefined') {
            updateData.profile_picture = profile_picture;
        }

        if (typeof username !== 'undefined') {
            const newUsername = String(username).trim();
            if (/\s/.test(newUsername)) {
                return res.status(400).json({ message: 'Username cannot contain spaces.' });
            }
            if (newUsername.length === 0) {
                return res.status(400).json({ message: 'Username cannot be empty.' });
            }
            // If not admin, enforce 3 changes per 30 days when attempting to change to a different username
            // Fetch current user to read role and counters
            const { data: currentUser, error: meError } = await req.supabase
                .from('users')
                .select('id, role, username, username_change_count, username_change_count_30d, username_change_window_started_at')
                .eq('id', req.user.id)
                .single();
            if (meError) {
                return res.status(500).json({ message: 'Failed to read user profile' });
            }
            if (currentUser && currentUser.role !== 'admin' && newUsername !== currentUser.username) {
                const now = new Date();
                if (Object.prototype.hasOwnProperty.call(currentUser, 'username_change_count_30d') && Object.prototype.hasOwnProperty.call(currentUser, 'username_change_window_started_at')) {
                    const windowStart = currentUser.username_change_window_started_at ? new Date(currentUser.username_change_window_started_at) : null;
                    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                    let effectiveCount = currentUser.username_change_count_30d ?? 0;
                    if (!windowStart || windowStart < thirtyDaysAgo) {
                        effectiveCount = 0;
                    }
                    if (effectiveCount >= 3) {
                        return res.status(400).json({ message: 'you have reached the maximum number of username changes (3 in 30 days)' });
                    }
                } else if (Object.prototype.hasOwnProperty.call(currentUser, 'username_change_count')) {
                    const currentCount = currentUser.username_change_count ?? 0;
                    if (currentCount >= 3) {
                        return res.status(400).json({ message: 'you have reached the maximum number of username changes (3)' });
                    }
                }
            }
            // Case-insensitive uniqueness check excluding current user
            const { count: existsCount, error: checkError } = await req.supabase
                .from('users')
                .select('id', { count: 'exact', head: true })
                .ilike('username', newUsername)
                .neq('id', req.user.id);
            if (checkError) {
                return res.status(500).json({ message: 'Error checking username availability' });
            }
            if ((existsCount || 0) > 0) {
                return res.status(400).json({ message: 'someone with this username already exists' });
            }
            updateData.username = newUsername;
            // Increment change counter for non-admins
            if (currentUser && currentUser.role !== 'admin' && newUsername !== currentUser.username) {
                const now = new Date();
                updateData.username_changed_at = now.toISOString();
                if (Object.prototype.hasOwnProperty.call(currentUser, 'username_change_count_30d') && Object.prototype.hasOwnProperty.call(currentUser, 'username_change_window_started_at')) {
                    const windowStart = currentUser.username_change_window_started_at ? new Date(currentUser.username_change_window_started_at) : null;
                    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                    let effectiveCount = currentUser.username_change_count_30d ?? 0;
                    let windowStartToPersist = windowStart;
                    if (!windowStart || windowStart < thirtyDaysAgo) {
                        effectiveCount = 0;
                        windowStartToPersist = now;
                    }
                    updateData.username_change_count_30d = effectiveCount + 1;
                    updateData.username_change_window_started_at = windowStartToPersist.toISOString();
                } else if (Object.prototype.hasOwnProperty.call(currentUser, 'username_change_count')) {
                    updateData.username_change_count = (currentUser.username_change_count || 0) + 1;
                }
            }
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ message: 'No valid fields to update' });
        }

        const { data: updatedUser, error } = await req.supabase
            .from('users')
            .update(updateData)
            .eq('id', req.user.id)
            .select()
            .single();
        if (error) throw error;
        res.json({ success: true, user: updatedUser });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get user's posts
router.get('/:userId/posts', auth, async (req, res) => {
    try {
        // Get posts by userId
        const { data: posts, error } = await req.supabase
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
        const { data: user, error } = await req.supabase
            .from('users')
            .select('family_id')
            .eq('id', req.params.userId)
            .single();
        if (error) throw error;
        if (!user || !user.family_id) return res.json({ success: true, groups: [] });
        const { data: family, error: famError } = await req.supabase
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
        //
        // Check if the user is an admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
        }
        // Delete user by ID
        const { data, error } = await req.supabase
            .from('users')
            .delete()
            .eq('id', req.params.userId);
        if (error) throw error;
        if (!data || data.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        //
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
        const { data: updatedUser, error: updateError } = await req.supabase
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
        //
        res.status(500).json({
            success: false,
            message: err.message || 'Server error'
        });
    }
});

module.exports = router; 