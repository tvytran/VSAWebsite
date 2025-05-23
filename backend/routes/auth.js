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

const upload = multer({
  storage: storage,
  limits: { fileSize: 5000000 }, // Increased limit to 5MB
  fileFilter: function(req, file, cb) {
    // Allow images only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
});

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

        // Hash password
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
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Handle file upload
    if (req.file) {
      // Delete old profile picture if it exists and is not the default
      if (user.profilePicture && user.profilePicture !== '/uploads/profiles/default.png') { // Assuming a default image path
        const oldImagePath = path.join(__dirname, '..' , 'public', user.profilePicture);
        fs.unlink(oldImagePath, (err) => {
          if (err) console.error('Failed to delete old profile picture:', err);
        });
      }
      user.profilePicture = `/uploads/profiles/${req.file.filename}`;
    }

    // Update username if provided and is different
    if (req.body.username && req.body.username !== user.username) {
        // Check if username already exists
        const existingUserWithUsername = await User.findOne({ username: req.body.username });
        if (existingUserWithUsername) {
            return res.status(400).json({ success: false, message: 'Username already taken' });
        }
        user.username = req.body.username;
    }

    // Update other profile fields if needed (e.g., email - handle validation/constraints carefully)
    // If you want to update other fields, add them here with appropriate validation

    await user.save();

    // Return updated user data (excluding password)
    const updatedUser = await User.findById(req.user.id).select('-password');
    res.json({ success: true, user: updatedUser });

  } catch (err) {
    console.error('Error in profile picture upload route:', err);
    // Handle multer errors specifically
    if (err.message === 'Only image files are allowed!') {
         return res.status(400).json({ success: false, message: err.message });
    }
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, message: 'File size limit (5MB) exceeded' });
    }
    res.status(500).json({ success: false, message: 'Server Error' });
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