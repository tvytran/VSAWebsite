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
        const { username, email, password, family } = req.body;

        // Check if user already exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ 
                success: false, 
                message: 'User already exists' 
            });
        }

        // Find family by ID or code
        let familyId = null;
        if (family) {
            const familyDoc = await Family.findOne({
                $or: [
                    { _id: family },
                    { code: family }
                ]
            });
            if (familyDoc) {
                familyId = familyDoc._id;
            } else {
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
            family: familyId
        });

        // Hash password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        // Save user
        await user.save();

        console.log('User registered:', user._id, 'Family:', user.family);

        // Add user to family's members array if family is set
        if (user.family) {
            const result = await Family.findByIdAndUpdate(
                user.family,
                { $addToSet: { members: user._id } }, // $addToSet prevents duplicates
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

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE },
            (err, token) => {
                if (err) throw err;
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
        console.error(err.message);
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

        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid credentials' 
            });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid credentials' 
            });
        }

        // Create JWT token
        const payload = {
            user: {
                id: user.id,
                role: user.role
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE },
            (err, token) => {
                if (err) throw err;
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
        console.error(err.message);
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

    // Update other profile fields if needed (e.g., username, email - handle validation/constraints carefully)
    // For now, only allowing profile picture update as per the explicit request
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

module.exports = router; 