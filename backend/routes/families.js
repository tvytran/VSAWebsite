const express = require('express');
const router = express.Router();
const Family = require('../models/Family');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for family picture uploads
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const uploadPath = path.join(__dirname, '..' , 'public', 'uploads', 'families');
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
  limits: { fileSize: 5 * 1024 * 1024 }, // Increased limit to 5MB
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
        let family = await Family.findOne({ name });
        if (family) {
            return res.status(400).json({
                success: false,
                message: 'Family with this name already exists'
            });
        }

        // Generate a unique code
        let code;
        let isUnique = false;
        while (!isUnique) {
            code = Family.generateCode();
            const existingFamily = await Family.findOne({ code });
            if (!existingFamily) {
                isUnique = true;
            }
        }

        // Create new family
        family = new Family({
            name,
            description,
            code,
            members: [req.user.id] // Add the creator as the first member
        });
        
        await family.save();
        console.log('Family successfully saved with ID:', family._id); // Log the saved family ID

        res.status(201).json({
            success: true,
            family: {
                id: family._id,
                code: family.code,
                name: family.name,
                description: family.description,
                members: family.members
            }
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   GET /api/families
// @desc    Get all families
// @access  Public
router.get('/', async (req, res) => {
    try {
        const families = await Family.find().select('-__v');
        res.json({
            success: true,
            families
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   GET /api/families/leaderboard
// @desc    Get families sorted by points
// @access  Public
router.get('/leaderboard', async (req, res) => {
    try {
        const families = await Family.find().sort({ totalPoints: -1 }).populate({
            path: 'members',
            select: 'username email',
            match: { role: { $ne: 'admin' } } // Exclude users with role 'admin'
        });
        res.json({ success: true, families });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   GET /api/families/:id
// @desc    Get family by ID
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const family = await Family.findById(req.params.id)
            .select('-__v')
            .populate('members', 'username email');
        
        if (!family) {
            return res.status(404).json({
                success: false,
                message: 'Family not found'
            });
        }

        res.json({
            success: true,
            family
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   PUT /api/families/:id
// @desc    Update family profile (name, description, picture)
// @access  Private (only members of the family)
router.put('/:id', auth, upload.single('familyPicture'), async (req, res) => {
  console.log('Backend: Reached final handler for PUT /api/families/:id.'); // Log at the start of the final handler
  console.log('Backend: req.body:', req.body);
  console.log('Backend: req.file:', req.file);
  try {
    const family = await Family.findById(req.params.id);

    if (!family) {
      return res.status(404).json({ success: false, message: 'Family not found' });
    }

    // Check if user is a member of the family
    const isMember = family.members.some(member => member.toString() === req.user.id);
    if (!isMember) {
        return res.status(403).json({ success: false, message: 'You are not authorized to update this family' });
    }

    const updateFields = {};

    // Update family name and description if provided
    if (req.body.name) updateFields.name = req.body.name;
    // Add description update if you make it editable on the frontend
    // if (req.body.description) updateFields.description = req.body.description;

    // Handle file upload for family picture
    if (req.file) {
      console.log('Backend: req.file exists, updating familyPicture field.');
      // Delete old family picture if it exists and is not the default
      if (family.familyPicture) { // Assuming no default image for families initially
        const oldImagePath = path.join(__dirname, '..' , 'public', family.familyPicture);
        fs.unlink(oldImagePath, (err) => {
          if (err) console.error('Failed to delete old family picture:', err);
        });
      }
      updateFields.familyPicture = `/uploads/families/${req.file.filename}`;
    }

    // Only proceed if there are fields to update (name or picture)
    if (Object.keys(updateFields).length === 0) {
         console.log('No name or file provided for update.', updateFields);
        // Although frontend requires name, this is a safeguard.
        // If nothing is provided, perhaps return current family data or an error.
         return res.status(400).json({ success: false, message: 'No update fields provided.' });
    }

    const updatedFamily = await Family.findByIdAndUpdate(
        req.params.id,
        { $set: updateFields },
        { new: true, runValidators: true } // Run validators on updated fields
    ).populate('members', 'username email') // Populate members again for the response
    .select('+familyPicture'); // Explicitly include familyPicture in the response

    if (!updatedFamily) {
         return res.status(404).json({ success: false, message: 'Family not found after update.' });
    }

    console.log('Backend: Sending updated family object in response:', updatedFamily);
    res.json({ success: true, family: updatedFamily });

  } catch (err) {
    console.error(err.message);
    // Handle other errors (e.g., database errors)
    res.status(500).json({ success: false, message: 'Server Error during family update.' });
  }
});

// @route   DELETE /api/families/:id
// @desc    Delete a family
// @access  Private (only admin)
router.delete('/:id', auth, async (req, res) => {
    console.log(`DELETE /api/families/${req.params.id} hit`); // Log when route is hit
    try {
        // Check if user is an admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ 
                success: false, 
                message: 'Only administrators can delete families' 
            });
        }

        const family = await Family.findById(req.params.id);
        console.log('Family found:', !!family); // Log if family is found
        if (!family) {
            console.log('Family not found for ID:', req.params.id); // Log if family not found
            return res.status(404).json({ success: false, message: 'Family not found' });
        }

        // Delete family picture if it exists
        if (family.familyPicture) {
            console.log('Attempting to delete family picture:', family.familyPicture); // Log before deleting picture
            const imagePath = path.join(__dirname, '..' , 'public', family.familyPicture);
            fs.unlink(imagePath, (err) => {
                if (err) console.error('Failed to delete family picture:', err); // Log picture deletion errors
            });
        }

        console.log('Attempting to remove family from DB:', family._id); // Log before removing family
        await family.deleteOne();
        console.log('Family successfully removed from DB:', family._id); // Log successful removal

        res.json({ success: true, message: 'Family deleted' });
    } catch (err) {
        console.error('Error during family deletion:', err); // Log any errors during deletion
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router; 