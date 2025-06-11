const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const heicConvert = require('heic-convert');

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
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

// @route   POST /api/families
// @desc    Create a new family
// @access  Private (requires authentication)
router.post('/', auth, async (req, res) => {
    try {
        const { name, description } = req.body;
        // Check if family name already exists
        const { data: existing, error: findError } = await supabase
            .from('families')
            .select('id')
            .eq('name', name)
            .single();
        if (findError && findError.code !== 'PGRST116') throw findError;
        if (existing) {
            return res.status(400).json({ success: false, message: 'Family with this name already exists' });
        }
        // Generate a unique code (simple random for now)
        let code = Math.random().toString(36).substring(2, 8).toUpperCase();
        // Create new family
        const { data: family, error } = await supabase
            .from('families')
            .insert([{ name, description, code, total_points: 0, semester_points: 0, created_at: new Date().toISOString() }])
            .select()
            .single();
        if (error) throw error;
        res.status(201).json({ success: true, family });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   GET /api/families
// @desc    Get all families
// @access  Public
router.get('/', async (req, res) => {
    try {
        const { data: families, error } = await supabase
            .from('families')
            .select('*');
        if (error) throw error;
        res.json({ success: true, families });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   GET /api/families/leaderboard
// @desc    Get families sorted by points
// @access  Public
router.get('/leaderboard', async (req, res) => {
    try {
        // First get all families with their points
        const { data: families, error } = await supabase
            .from('families')
            .select(`
                *,
                members:users (
                    id,
                    username,
                    email
                )
            `)
            .order('total_points', { ascending: false });
        
        if (error) throw error;

        // Format the response to ensure consistent data structure
        const formattedFamilies = families.map(family => ({
            ...family,
            members: family.members || [],
            total_points: family.total_points || 0,
            semester_points: family.semester_points || 0
        }));

        res.json({ success: true, families: formattedFamilies });
    } catch (err) {
        console.error('Leaderboard error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   GET /api/families/:id
// @desc    Get family by ID
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const { data: family, error } = await supabase
            .from('families')
            .select('*')
            .eq('id', req.params.id)
            .single();
        if (error) throw error;
        if (!family) {
            return res.status(404).json({ success: false, message: 'Family not found' });
        }
        // Get members (users with this family_id)
        const { data: members, error: membersError } = await supabase
            .from('users')
            .select('id, username, email')
            .eq('family_id', req.params.id);
        if (membersError) throw membersError;
        family.members = members;
        res.json({ success: true, family });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   PUT /api/families/:id
// @desc    Update family profile (name, description, picture)
// @access  Private (admin or family members)
router.put('/:id', auth, upload.single('familyPicture'), async (req, res) => {
  try {
    console.log('Family update request received:', {
      userId: req.user.id,
      familyId: req.params.id,
      userRole: req.user.role,
      hasFile: !!req.file,
      fileName: req.file?.originalname,
      fileSize: req.file?.size,
      fileType: req.file?.mimetype
    });

    // If user is admin, allow update without membership check
    if (req.user.role !== 'admin') {
      // For non-admin users, check if they are a member
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('id', req.user.id)
        .eq('family_id', req.params.id)
        .single();
      
      if (userError) throw userError;
      if (!user) {
        return res.status(403).json({ 
          success: false, 
          message: 'You are not authorized to update this family' 
        });
      }
    }

    const updateFields = {};
    if (req.body.name) updateFields.name = req.body.name;
    if (req.body.description) updateFields.description = req.body.description;
    if (req.file) {
      // Handle file upload if present
      const fileName = `families/${req.params.id}_${Date.now()}.jpg`;
      const { data: fileData, error: fileError } = await supabase.storage
        .from('family-pictures')
        .upload(fileName, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: true
        });
      
      if (fileError) throw fileError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('family-pictures')
        .getPublicUrl(fileName);
      
      updateFields.family_picture = publicUrl;
    }

    // Update the family
    const { data: updatedFamily, error: updateError } = await supabase
      .from('families')
      .update(updateFields)
      .eq('id', req.params.id)
      .select()
      .single();

    if (updateError) {
      console.error('Database update error:', updateError);
      throw updateError;
    }

    if (!updatedFamily) {
      return res.status(404).json({
        success: false,
        message: 'Family not found'
      });
    }

    console.log('Family updated successfully:', updatedFamily);

    // Fetch family members separately
    const { data: members, error: membersError } = await supabase
      .from('users')
      .select('id, username, email, profile_picture')
      .eq('family_id', req.params.id);

    if (membersError) {
      console.error('Error fetching members:', membersError);
      throw membersError;
    }

    // Combine family data with members
    const familyWithMembers = {
      ...updatedFamily,
      members: members || []
    };

    console.log('Sending response with updated family data');
    res.json({ success: true, family: familyWithMembers });
  } catch (err) {
    console.error('Error updating family:', err);
    res.status(500).json({ 
      success: false, 
      message: err.message || 'Server error' 
    });
  }
});

// @route   DELETE /api/families/:id
// @desc    Delete a family
// @access  Private (only admin)
router.delete('/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Only administrators can delete families' });
        }
        const { data, error } = await supabase
            .from('families')
            .delete()
            .eq('id', req.params.id);
        if (error) throw error;
        if (!data || data.length === 0) {
            return res.status(404).json({ success: false, message: 'Family not found' });
        }
        res.json({ success: true, message: 'Family deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router; 