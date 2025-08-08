const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { supabase, supabaseAdmin } = require('../supabaseClient');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const heicConvert = require('heic-convert');

// Configure multer for profile picture uploads
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: function(req, file, cb) {
    // Allow images including HEIC
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif|heic|heif)$/i)) {
      return cb(new Error('Only image files (JPG, PNG, GIF, HEIC) are allowed!'), false);
    }
    cb(null, true);
  }
});

// Helper function to convert HEIC to JPEG
async function convertHeicToJpeg(buffer) {
  try {
    const jpegBuffer = await heicConvert({
      buffer: buffer,
      format: 'JPEG',
      quality: 0.9
    });
    return jpegBuffer;
  } catch (error) {
    console.error('HEIC conversion error:', error);
    throw new Error('Failed to convert HEIC image');
  }
}

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post(
    '/register',
    [
        body('username', 'Username is required').not().isEmpty().trim().escape(),
        body('email', 'Please include a valid email').isEmail().normalizeEmail(),
        body('password', 'Password does not meet requirements.')
            .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long.')
            .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter.')
            .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter.')
            .matches(/\d/).withMessage('Password must contain at least one number.')
            .matches(/[^A-Za-z0-9]/).withMessage('Password must contain at least one special character.'),
    ],
    // handleValidationErrors, // Temporarily comment out to test username duplicate check
    async (req, res) => {
    try {
        const { username, email, password, family, role = 'member' } = req.body;
        console.log('Registration request received:', { 
            username: req.body.username, 
            email: req.body.email, 
            family: req.body.family,
            hasPassword: !!req.body.password 
        });

        // Validate required fields
        if (!username || !email || !password || !family) {
            return res.status(400).json({ 
                message: 'All fields are required' 
            });
        }

        // Validate password requirements
        const passwordErrors = [];
        if (password.length < 6) passwordErrors.push('Password must be at least 6 characters long');
        if (!/[a-z]/.test(password)) passwordErrors.push('Password must contain at least one lowercase letter');
        if (!/[A-Z]/.test(password)) passwordErrors.push('Password must contain at least one uppercase letter');
        if (!/\d/.test(password)) passwordErrors.push('Password must contain at least one number');
        if (!/[^A-Za-z0-9]/.test(password)) passwordErrors.push('Password must contain at least one special character');
        
        if (passwordErrors.length > 0) {
            return res.status(400).json({ 
                message: `Password requirements not met: ${passwordErrors.join(', ')}` 
            });
        }

        // Check if username already exists
        console.log('Checking if username exists:', username);
        const { data: existingUser, error: userCheckError } = await supabaseAdmin
            .from('users')
            .select('id')
            .eq('username', username.trim())
            .single();

        console.log('Username check result:', { existingUser, userCheckError });

        if (userCheckError && userCheckError.code !== 'PGRST116') {
            console.error('Error checking username:', userCheckError);
            return res.status(500).json({ message: 'Error checking username availability' });
        }

        if (existingUser) {
            console.log('Username already exists, returning error');
            return res.status(400).json({ 
                message: 'Username already exists. Please choose a different username.' 
            });
        }

        console.log('Username is available, proceeding with registration');

        // Check if family exists
        console.log('Checking if family exists:', family);
        const { data: familyData, error: familyError } = await supabaseAdmin
            .from('families')
            .select('id, name')
            .eq('code', family.trim())
            .single();

        if (familyError) {
            console.error('Error checking family:', familyError);
            if (familyError.code === 'PGRST116') {
                return res.status(400).json({ 
                    message: 'Family code is incorrect. Please check your family code and try again.' 
                });
            }
            return res.status(500).json({ message: 'Error checking family code' });
        }

        if (!familyData) {
            return res.status(400).json({ 
                message: 'Family code is incorrect. Please check your family code and try again.' 
            });
        }

        console.log('Family found:', familyData);

        // Create user
        console.log('Creating user with family_id:', familyData.id);
        const { data: user, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: email.trim(),
            password: password,
            user_metadata: {
                username: username.trim(),
                family_id: familyData.id,
                role: role
            }
        });

        if (createError) {
            console.error('Error creating user:', createError);
            if (createError.message.includes('email')) {
                return res.status(400).json({ 
                    message: 'Email address is already registered. Please use a different email or try logging in.' 
                });
            }
            return res.status(500).json({ 
                message: 'Error creating user account. Please try again.' 
            });
        }

        console.log('User created successfully:', user.user.id);

        // Insert user profile
        const { error: profileError } = await supabaseAdmin
            .from('users')
            .insert({
                id: user.user.id,
                username: username.trim(),
                email: email.trim(),
                family_id: familyData.id,
                role: role,
                points: 0
            });

        if (profileError) {
            console.error('Error creating user profile:', profileError);
            // Try to clean up the auth user if profile creation fails
            await supabaseAdmin.auth.admin.deleteUser(user.user.id);
            return res.status(500).json({ 
                message: 'Error creating user profile. Please try again.' 
            });
        }

        console.log('User profile created successfully');

        res.status(201).json({
            message: 'User registered successfully',
            user: {
                id: user.user.id,
                username: username.trim(),
                email: email.trim(),
                family_id: familyData.id,
                role: role
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ 
            message: 'Registration failed. Please try again.' 
        });
    }
});

// @route  /api/auth/login
// @desc    Login user
// @access  Public
router.post(
    '/login',
    [
        body('email', 'Please include a valid email').isEmail().normalizeEmail(),
        body('password', 'Password is required').exists(),
    ],
    handleValidationErrors,
    async (req, res) => {
    try {
        const { email, password } = req.body;
        // Check if user exists using the admin client to bypass RLS
        const { data: user, error: userError } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('email', email)
            .single();
        if (userError && userError.code !== 'PGRST116') throw userError;
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
        // Create a Supabase-compatible JWT token
        const payload = {
            sub: user.id,
            role: user.role,
        };
        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '24h' },
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
                        family_id: user.family_id
                    }
                });
            }
        );
    } catch (err) {
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
});

// Get current user
router.get('/me', auth, async (req, res) => {
    try {
        console.log('=== /me route called ===');
        console.log('Request headers:', req.headers);
        console.log('Request method:', req.method);
        console.log('Request URL:', req.url);
        console.log('User from auth middleware:', req.user);
        
        if (!req.user || !req.user.id) {
            console.error('No user found in request');
            return res.status(401).json({ success: false, message: 'User not authenticated' });
        }
        
        console.log('Fetching user with id:', req.user.id);
        let { data: user, error } = await req.supabase
            .from('users')
            .select('*')
            .eq('id', req.user.id)
            .single();
        console.log('Supabase user:', user, 'Error:', error);
        
        // If user profile does not exist, create it (for Google sign-in onboarding)
        if (error && error.code === 'PGRST116') {
            console.log('User profile not found, creating new profile for user:', req.user.id);
            const email = req.user.email || null;
            
            // Generate a username from email if available
            let username = null;
            if (email) {
                username = email.split('@')[0]; // Use part before @ as username
                // Add a random number to make it unique
                username = username + Math.floor(Math.random() * 1000);
            } else {
                username = 'user_' + req.user.id.substring(0, 8);
            }
            
            const newUser = {
                id: req.user.id,
                username: username,
                email: email,
                family_id: null,
                role: 'member',
                points: 0
            };
            const { data: insertedUser, error: insertError } = await req.supabase
                .from('users')
                .insert(newUser)
                .select()
                .single();
            if (insertError) {
                console.error('Error creating user profile for Google user:', insertError);
                return res.status(500).json({ success: false, message: 'Failed to create user profile.' });
            }
            user = insertedUser;
            console.log('Created new user profile:', user);
        } else if (error) {
            console.error('Error fetching user:', error);
            throw error;
        }
        
        if (!user) {
            console.log('User not found for ID:', req.user.id);
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        console.log('Returning user profile:', user);
        res.json({ success: true, user });
    } catch (error) {
        console.error('ME route error:', error);
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile (including profile picture)
// @access  Private
router.put('/profile', auth, upload.single('profilePicture'), async (req, res) => {
  try {
    console.log('Token decoded successfully:', req.user);

    // Fetch user from Supabase using the request-scoped client
    const { data: user, error: userError } = await req.supabase
      .from('users')
      .select('*')
      .eq('id', req.user.id)
      .single();
    if (userError) throw userError;
    if (!user) {
      console.log('User not found for ID:', req.user.id);
      return res.status(404).json({ message: 'User not found' });
    }

    if (!req.file) {
      // If no file is uploaded but username is being updated
      if (req.body.username) {
        const { data: updatedUser, error: updateError } = await req.supabase
          .from('users')
          .update({ username: req.body.username })
          .eq('id', req.user.id)
          .select()
          .single();
        if (updateError) throw updateError;
        return res.json({ success: true, user: updatedUser });
      }
      return res.status(400).json({ message: 'No file uploaded' });
    }

    let fileBuffer = req.file.buffer;
    let fileMimeType = req.file.mimetype;

    // Convert HEIC to JPEG if necessary
    if (req.file.originalname.toLowerCase().endsWith('.heic') || 
        req.file.originalname.toLowerCase().endsWith('.heif')) {
      try {
        fileBuffer = await convertHeicToJpeg(req.file.buffer);
        fileMimeType = 'image/jpeg';
      } catch (error) {
        console.error('HEIC conversion failed:', error);
        return res.status(400).json({ message: 'Failed to convert HEIC image' });
      }
    }

    const fileName = `profiles/${user.id}_${Date.now()}.jpg`;
    console.log('Uploading to Supabase:', fileName);

    const { data, error } = await req.supabase.storage
      .from(process.env.SUPABASE_BUCKET)
      .upload(fileName, fileBuffer, {
        contentType: fileMimeType,
        upsert: true,
      });

    if (error) {
      console.log('Supabase upload error:', error);
      return res.status(500).json({ message: error.message });
    }

    const { publicUrl } = req.supabase.storage
      .from(process.env.SUPABASE_BUCKET)
      .getPublicUrl(fileName).data;
    console.log('Supabase public URL:', publicUrl);

    // Update user profile
    const updateData = { profile_picture: publicUrl };
    if (req.body.username) {
      updateData.username = req.body.username;
    }

    const { data: updatedUser, error: updateError } = await req.supabase
      .from('users')
      .update(updateData)
      .eq('id', req.user.id)
      .select()
      .single();
    if (updateError) throw updateError;

    res.json({ success: true, user: updatedUser });
  } catch (err) {
    console.error('Error in profile picture upload route:', err);
    res.status(500).json({ message: err.message || 'Server error' });
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
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', req.user.id)
            .single();
        if (error) throw error;
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
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Save user
        const { data: updatedUser, error: updateError } = await supabase
            .from('users')
            .update({ password: hashedPassword })
            .eq('id', req.user.id)
            .select()
            .single();
        if (updateError) throw updateError;
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

// @route   PUT /api/auth/user/family
// @desc    Update a user's family (admin only)
// @access  Private (Admin)
router.put('/user/family', auth, async (req, res) => {
    try {
        // Check if requester is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only admins can change user families'
            });
        }

        const { userId, familyCode } = req.body;

        if (!userId || !familyCode) {
            return res.status(400).json({
                success: false,
                message: 'Both userId and familyCode are required'
            });
        }

        // Verify the family exists
        const { data: family, error: familyError } = await supabase
            .from('families')
            .select('id')
            .eq('code', familyCode)
            .single();
        
        if (familyError) throw familyError;
        if (!family) {
            return res.status(404).json({
                success: false,
                message: 'Family not found'
            });
        }

        // Update the user's family
        const { data: updatedUser, error: updateError } = await supabase
            .from('users')
            .update({ family_id: family.id })
            .eq('id', userId)
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
            message: 'User family updated successfully',
            user: updatedUser
        });

    } catch (err) {
        console.error('Error updating user family:', err);
        res.status(500).json({
            success: false,
            message: err.message || 'Server error'
        });
    }
});

// @route   PUT /api/auth/join-family
// @desc    Join a family by code (for authenticated users)
// @access  Private
router.put('/join-family', auth, async (req, res) => {
    try {
        const { family_code } = req.body;
        if (!family_code) {
            return res.status(400).json({ success: false, message: 'Family code is required' });
        }
        // Find the family by code
        const { data: family, error: familyError } = await req.supabase
            .from('families')
            .select('id')
            .eq('code', family_code)
            .single();
        if (familyError) {
            return res.status(500).json({ success: false, message: 'Error checking family code' });
        }
        if (!family) {
            return res.status(400).json({ success: false, message: 'Family code is incorrect. Please check your family code and try again.' });
        }
        // Update the user's family_id
        const { data: updatedUser, error: updateError } = await req.supabase
            .from('users')
            .update({ family_id: family.id })
            .eq('id', req.user.id)
            .select()
            .single();
        if (updateError) {
            return res.status(500).json({ success: false, message: 'Failed to update user family.' });
        }
        res.json({ success: true, user: updatedUser });
    } catch (err) {
        console.error('Error in join-family endpoint:', err);
        res.status(500).json({ success: false, message: err.message || 'Server error' });
    }
});

module.exports = router;    