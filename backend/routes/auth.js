const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Family = require('../models/Family');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

// Configure multer for profile picture uploads
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const uploadPath = path.join(__dirname, '..' , 'public', 'uploads', 'profiles');
    // Create the directory if it doesn't exist
    fs.mkdir(uploadPath, { recursive: true }, (err) => {
      if (err) return cb(err, null);
      cb(null, uploadPath);
    });
  },
  filename: function(req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: multer.memoryStorage() });

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
    try {
        const { username, email, password, family, role } = req.body;
        console.log('Registration attempt:', { username, email, role });

        // Check if user already exists
        let user = await User.findOne({ email });
        if (user) {
            console.log('User already exists:', email);
            return res.status(400).json({ 
                success: false, 
                message: 'User already exists' 
            });
        }

        // Find family by ID or code (only if not admin)
        let familyId = null;
        if (family && role !== 'admin') {
            let familyQuery = {};
            // Check if the provided family string is a valid MongoDB ObjectId
            if (mongoose.Types.ObjectId.isValid(family)) {
                familyQuery = { $or: [{ _id: family }, { code: family }] };
            } else {
                // If not a valid ObjectId, only search by code
                familyQuery = { code: family };
            }

            const familyDoc = await Family.findOne(familyQuery);
            
            if (familyDoc) {
                familyId = familyDoc._id;
            } else {
                console.log('Invalid family ID or code:', family);
                return res.status(400).json({
                    success: false,
                    message: 'Invalid family ID or code'
                });
            }
        }

        // Create new user
        user = new User({
            username,
            email,
            password,
            family: familyId,
            role: role || 'member' // Default to member if role not specified
        });

        console.log('Creating new user:', {
            username: user.username,
            email: user.email,
            role: user.role,
            family: user.family
        });

        // Hash password slay
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        // Save user
        await user.save();
        console.log('User successfully saved to database:', user._id);

        // Add user to family's members array if family is set and user is not admin
        if (user.family && user.role !== 'admin') {
            const result = await Family.findByIdAndUpdate(
                user.family,
                { $addToSet: { members: user._id } },
                { new: true }
            );
            console.log('Family update result:', result);
        }

        // Create JWT token
        const payload = {
            user: {
                id: user.id,
                role: user.role
            }
        };

        console.log('Creating JWT token with payload:', payload);
        console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);

        jwt.sign(
            payload,
            process.env.JWT_SECRET || 'fallback_secret_key',
            { expiresIn: '24h' },
            (err, token) => {
                if (err) {
                    console.error('Error creating JWT token:', err);
                    throw err;
                }
                console.log('JWT token created successfully');
                res.json({
                    success: true,
                    token,
                    user: {
                        id: user.id,
                        username: user.username,
                        email: user.email,
                        role: user.role,
                        family: user.family
                    }
                });
            }
        );
    } catch (err) {
        console.error('Registration error:', err.message);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log('Login attempt for email:', email);

        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            console.log('User not found for email:', email);
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid credentials' 
            });
        }

        console.log('User found:', {
            id: user._id,
            email: user.email,
            role: user.role
        });

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log('Password mismatch for user:', email);
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid credentials' 
            });
        }

        console.log('Password verified for user:', email);

        // Create JWT token
        const payload = {
            user: {
                id: user.id,
                role: user.role
            }
        };

        console.log('Creating JWT token with payload:', payload);
        console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);

        jwt.sign(
            payload,
            process.env.JWT_SECRET || 'fallback_secret_key',
            { expiresIn: '24h' },
            (err, token) => {
                if (err) {
                    console.error('Error creating JWT token:', err);
                    throw err;
                }
                console.log('JWT token created successfully');
                res.json({
                    success: true,
                    token,
                    user: {
                        id: user.id,
                        username: user.username,
                        email: user.email,
                        role: user.role,
                        family: user.family
                    }
                });
            }
        );
    } catch (err) {
        console.error('Login error:', err.message);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
});

// Get current user
router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.json({ success: true, user });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile (including profile picture)
// @access  Private
router.put('/profile', auth, upload.single('profilePicture'), async (req, res) => {
  try {
    console.log('Token decoded successfully:', req.user);

    const user = await User.findById(req.user.id);
    console.log('User found:', user);

    if (!user) {
      console.log('User not found');
      return res.status(404).json({ message: 'User not found' });
    }

    if (!req.file) {
      console.log('No file uploaded');
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const supabase = require('../supabaseClient');
    const fileExt = req.file.originalname.split('.').pop();
    const fileName = `profiles/${user._id}_${Date.now()}.${fileExt}`;
    console.log('Uploading to Supabase:', fileName);

    const { data, error } = await supabase.storage
      .from(process.env.SUPABASE_BUCKET)
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: true,
      });

    if (error) {
      console.log('Supabase upload error:', error);
      return res.status(500).json({ message: error.message });
    }

    const { publicUrl } = supabase.storage
      .from(process.env.SUPABASE_BUCKET)
      .getPublicUrl(fileName).data;
    console.log('Supabase public URL:', publicUrl);

    // Debug log before updating user
    console.log('About to update user with new profile picture:', user._id);

    user.profilePicture = publicUrl;
    await user.save();

    // Debug log after updating user
    console.log('User updated with new profile picture.');

    res.json({ success: true, profilePicture: publicUrl });
  } catch (err) {
    console.error('Error in profile picture upload route:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/auth/password
// @desc    Update user password
// @access  Private
router.put('/password', auth, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        console.log('Password update attempt for user:', req.user.id);

        // Get user
        const user = await User.findById(req.user.id);
        if (!user) {
            console.log('User not found for ID:', req.user.id);
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            console.log('Current password mismatch for user:', req.user.id);
            return res.status(400).json({ 
                success: false, 
                message: 'Current password is incorrect' 
            });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);

        // Save user
        await user.save();
        console.log('Password successfully updated for user:', req.user.id);

        res.json({ 
            success: true, 
            message: 'Password updated successfully' 
        });
    } catch (err) {
        console.error('Password update error:', err.message);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
});

module.exports = router;    