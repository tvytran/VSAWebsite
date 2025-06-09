const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const supabase = require('../supabaseClient');
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

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
    try {
        const { username, email, password, family, role } = req.body;
        console.log('Registration attempt:', { username, email, role, family });

        // Check if user already exists
        const { data: existingUser, error: userError } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .single();
        if (userError && userError.code !== 'PGRST116') throw userError;
        if (existingUser) {
            return res.status(400).json({ 
                success: false, 
                message: 'User already exists' 
            });
        }

        // Look up the family by code (if not admin)
        let familyId = null;
        if (family && role !== 'admin') {
            const { data: familyDoc, error: famError } = await supabase
                .from('families')
                .select('id')
                .eq('code', family)
                .single();
            if (famError) throw famError;
            if (!familyDoc) {
                return res.status(400).json({ success: false, message: 'Invalid family code' });
            }
            familyId = familyDoc.id;
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        const { data: newUser, error: insertError } = await supabase
            .from('users')
            .insert([{ username, email, password: hashedPassword, family_id: familyId, role: role || 'member', created_at: new Date().toISOString() }])
            .select()
            .single();
        if (insertError) throw insertError;

        // Create JWT token
        const payload = {
            user: {
                id: newUser.id,
                role: newUser.role
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET || 'fallback_secret_key',
            { expiresIn: '24h' },
            (err, token) => {
                if (err) throw err;
                res.json({
                    success: true,
                    token,
                    user: {
                        id: newUser.id,
                        username: newUser.username,
                        email: newUser.email,
                        role: newUser.role,
                        family_id: newUser.family_id
                    }
                });
            }
        );
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ 
            success: false, 
            message: err.message || 'Server error' 
        });
    }
});

// @route  /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        // Check if user exists
        const { data: user, error: userError } = await supabase
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
        // Create JWT token
        const payload = {
            user: {
                id: user.id,
                role: user.role
            }
        };
        jwt.sign(
            payload,
            process.env.JWT_SECRET || 'fallback_secret_key',
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
        console.log('Fetching user with id:', req.user.id);
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', req.user.id)
            .single();
        console.log('Supabase user:', user, 'Error:', error);
        if (error) throw error;
        if (!user) {
            console.log('User not found for ID:', req.user.id);
            return res.status(404).json({ success: false, message: 'User not found' });
        }
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

    // Fetch user from Supabase
    const { data: user, error: userError } = await supabase
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
        const { data: updatedUser, error: updateError } = await supabase
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

    const { data, error } = await supabase.storage
      .from(process.env.SUPABASE_BUCKET)
      .upload(fileName, fileBuffer, {
        contentType: fileMimeType,
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

    // Update user profile
    const updateData = { profile_picture: publicUrl };
    if (req.body.username) {
      updateData.username = req.body.username;
    }

    const { data: updatedUser, error: updateError } = await supabase
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

module.exports = router;    