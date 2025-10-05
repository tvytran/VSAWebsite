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
    // conversion error
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
        /*
        console.log('Registration request received:', { 
            username: req.body.username, 
            email: req.body.email, 
            family: req.body.family,
            hasPassword: !!req.body.password 
        });*/

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

        // Check if username already exists (case-insensitive)
        const { count: existingCount, error: userCheckError } = await supabaseAdmin
            .from('users')
            .select('id', { count: 'exact', head: true })
            .ilike('username', username.trim());

        if (userCheckError) {
            return res.status(500).json({ message: 'Error checking username availability' });
        }

        if ((existingCount || 0) > 0) {
            return res.status(400).json({ 
                message: 'someone with this username already exists' 
            });
        }

        //

        // Check if family exists
        //
        const { data: familyData, error: familyError } = await supabaseAdmin
            .from('families')
            .select('id, name')
            .eq('code', family.trim())
            .single();

        if (familyError) {
            //
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

        //

        // Create user
        //
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
            //
            if (createError.message.includes('email')) {
                return res.status(400).json({ 
                    message: 'Email address is already registered. Please use a different email or try logging in.' 
                });
            }
            return res.status(500).json({ 
                message: 'Error creating user account. Please try again.' 
            });
        }

        //

        // Insert user profile
        const { error: profileError } = await supabaseAdmin
            .from('users')
            .insert({
                id: user.user.id,
                username: username.trim(),
                email: email.trim(),
                family_id: familyData.id,
                role: role,
                points_total: 0,
                points_semester: 0
            });

        if (profileError) {
            //
            // Try to clean up the auth user if profile creation fails
            await supabaseAdmin.auth.admin.deleteUser(user.user.id);
            return res.status(500).json({ 
                message: 'Error creating user profile. Please try again.' 
            });
        }

        //

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
        //
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
        //
        
        if (!req.user || !req.user.id) {
            //
            return res.status(401).json({ success: false, message: 'User not authenticated' });
        }
        
        //
        let { data: user, error } = await req.supabase
            .from('users')
            .select('*')
            .eq('id', req.user.id)
            .single();
        //
        
        // If user profile does not exist, create it (for Google sign-in onboarding)
        if (error && error.code === 'PGRST116') {
            //
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
                points_total: 0,
                points_semester: 0
            };
            const { data: insertedUser, error: insertError } = await req.supabase
                .from('users')
                .insert(newUser)
                .select()
                .single();
            if (insertError) {
                //
                return res.status(500).json({ success: false, message: 'Failed to create user profile.' });
            }
            user = insertedUser;
            //
        } else if (error) {
            //
            throw error;
        }
        
        if (!user) {
            //
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        //
        res.json({ success: true, user });
    } catch (error) {
        //
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile (including profile picture)
// @access  Private
router.put('/profile', auth, upload.single('profilePicture'), async (req, res) => {
  try {
    //

    // Fetch user from Supabase using the request-scoped client
    const { data: user, error: userError } = await req.supabase
      .from('users')
      .select('*')
      .eq('id', req.user.id)
      .single();
    if (userError) throw userError;
    if (!user) {
      //
      return res.status(404).json({ message: 'User not found' });
    }

    // Username change limits removed: unlimited changes allowed
    if (!req.file) {
      // If no file is uploaded but username is being updated
      if (req.body.username) {
        const rawUsername = String(req.body.username);
        const newUsername = rawUsername.trim();

        // Validate no spaces
        if (/\s/.test(newUsername)) {
          return res.status(400).json({ message: 'Username cannot contain spaces.' });
        }
        if (newUsername.length === 0) {
          return res.status(400).json({ message: 'Username cannot be empty.' });
        }

        // No rate limiting of username changes

        // Check uniqueness (case-insensitive, excluding current user)
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

        const updatePayload = { username: newUsername };
        const { data: updatedUser, error: updateError } = await req.supabase
          .from('users')
          .update(updatePayload)
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
        //
        return res.status(400).json({ message: 'Failed to convert HEIC image' });
      }
    }

    const fileName = `profiles/${user.id}_${Date.now()}.jpg`;
    //

    const { data, error } = await req.supabase.storage
      .from(process.env.SUPABASE_BUCKET)
      .upload(fileName, fileBuffer, {
        contentType: fileMimeType,
        upsert: true,
      });

    if (error) {
      //
      return res.status(500).json({ message: error.message });
    }

    const { publicUrl } = req.supabase.storage
      .from(process.env.SUPABASE_BUCKET)
      .getPublicUrl(fileName).data;
    //

    // Update user profile
    const updateData = { profile_picture: publicUrl };
    if (req.body.username) {
      const rawUsername = String(req.body.username);
      const newUsername = rawUsername.trim();

      // Validate no spaces
      if (/\s/.test(newUsername)) {
        return res.status(400).json({ message: 'Username cannot contain spaces.' });
      }
      if (newUsername.length === 0) {
        return res.status(400).json({ message: 'Username cannot be empty.' });
      }

      // No rate limiting of username changes

      // Check uniqueness (case-insensitive, excluding current user)
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
    // Map DB unique constraint errors to friendly message
    const msg = (err && (err.message || err.code || '')) || '';
    if (msg.includes('users_username_lower_unique') || msg.includes('duplicate key value') && msg.toLowerCase().includes('username')) {
      return res.status(400).json({ message: 'someone with this username already exists' });
    }
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

// @route   PUT /api/auth/password
// @desc    Update user password
// @access  Private
router.put('/password', auth, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        //

        // Get user
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', req.user.id)
            .single();
        if (error) throw error;
        if (!user) {
            //
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            //
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
        //

        res.json({ 
            success: true, 
            message: 'Password updated successfully' 
        });
    } catch (err) {
        //
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

        const { userId, familyCode, familyId } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'userId is required'
            });
        }

        // Allow clearing family by sending neither familyId nor familyCode
        let resolvedFamilyId = null;
        if (familyId) {
            // Verify by id
            const { data: famById, error: famByIdErr } = await req.supabase
                .from('families')
                .select('id')
                .eq('id', familyId)
                .single();
            if (famByIdErr) {
                return res.status(400).json({ success: false, message: 'Family not found' });
            }
            resolvedFamilyId = famById?.id || null;
        } else if (familyCode) {
            // Verify by code
            const { data: famByCode, error: famByCodeErr } = await req.supabase
                .from('families')
                .select('id')
                .eq('code', familyCode)
                .single();
            if (famByCodeErr) {
                return res.status(400).json({ success: false, message: 'Family not found' });
            }
            resolvedFamilyId = famByCode?.id || null;
        }
        
        // Update the user's family (can be null to clear)
        const { data: updatedUser, error: updateError } = await req.supabase
            .from('users')
            .update({ family_id: resolvedFamilyId })
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
        //
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
        //
        res.status(500).json({ success: false, message: err.message || 'Server error' });
    }
});

module.exports = router;    