const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function(req, file, cb) {
    // Allow images only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
});

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
// @access  Private (only members of the family)
router.put('/:id', auth, upload.single('familyPicture'), async (req, res) => {
  try {
    // Check if user is a member
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', req.user.id)
      .eq('family_id', req.params.id)
      .single();
    if (userError) throw userError;
    if (!user) {
      return res.status(403).json({ success: false, message: 'You are not authorized to update this family' });
    }

    const updateFields = {};
    if (req.body.name) updateFields.name = req.body.name;

    // Handle file upload for family picture with Supabase Storage
    if (req.file) {
      const fileExt = req.file.originalname.split('.').pop();
      const fileName = `families/${req.params.id}_${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(process.env.SUPABASE_BUCKET)
        .upload(fileName, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: true,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { publicUrl } = supabase.storage
        .from(process.env.SUPABASE_BUCKET)
        .getPublicUrl(fileName).data;

      updateFields.family_picture = publicUrl;
    }

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ success: false, message: 'No update fields provided.' });
    }

    const { data: updatedFamily, error } = await supabase
      .from('families')
      .update(updateFields)
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;
    res.json({ success: true, family: updatedFamily });
  } catch (err) {
    console.error('Error in family update route:', err);
    res.status(500).json({ success: false, message: 'Server Error during family update.' });
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