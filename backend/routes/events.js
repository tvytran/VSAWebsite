const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
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

// GET /api/events - List all events
router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('date', { ascending: false });
  if (error) return res.status(500).json({ success: false, message: error.message });
  res.json({ success: true, events: data });
});

// GET /api/events/:id - Get single event
router.get('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', req.params.id)
    .single();
  if (error || !data) return res.status(404).json({ success: false, message: 'Event not found' });
  res.json({ success: true, event: data });
});

// POST /api/events - Create event (admin only)
router.post('/', auth, upload.single('image'), async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admins only' });
  }
  try {
    const { name, date, description, drive_link } = req.body;
    let image_url = req.body.image_url || '';
    if (req.file) {
      let imageBuffer = req.file.buffer;
      let mimeType = req.file.mimetype;
      let fileExt = 'jpg';
      if (req.file.originalname.toLowerCase().endsWith('.heic') || req.file.originalname.toLowerCase().endsWith('.heif')) {
        imageBuffer = await convertHeicToJpeg(req.file.buffer);
        mimeType = 'image/jpeg';
      } else {
        fileExt = req.file.originalname.split('.').pop().toLowerCase();
      }
      const fileName = `events/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(process.env.SUPABASE_BUCKET)
        .upload(fileName, imageBuffer, {
          contentType: mimeType,
          upsert: true,
        });
      if (uploadError) throw uploadError;
      const { publicUrl } = supabase.storage
        .from(process.env.SUPABASE_BUCKET)
        .getPublicUrl(fileName).data;
      image_url = publicUrl;
    }
    const { data, error } = await supabase
      .from('events')
      .insert([{ name, date, description, drive_link, image_url }])
      .select()
      .single();
    if (error) return res.status(500).json({ success: false, message: error.message });
    res.status(201).json({ success: true, event: data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
});

// PUT /api/events/:id - Update event (admin only)
router.put('/:id', auth, upload.single('image'), async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admins only' });
  }
  try {
    const { name, date, description, drive_link } = req.body;
    let image_url = req.body.image_url || '';
    if (req.file) {
      let imageBuffer = req.file.buffer;
      let mimeType = req.file.mimetype;
      let fileExt = 'jpg';
      if (req.file.originalname.toLowerCase().endsWith('.heic') || req.file.originalname.toLowerCase().endsWith('.heif')) {
        imageBuffer = await convertHeicToJpeg(req.file.buffer);
        mimeType = 'image/jpeg';
      } else {
        fileExt = req.file.originalname.split('.').pop().toLowerCase();
      }
      const fileName = `events/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(process.env.SUPABASE_BUCKET)
        .upload(fileName, imageBuffer, {
          contentType: mimeType,
          upsert: true,
        });
      if (uploadError) throw uploadError;
      const { publicUrl } = supabase.storage
        .from(process.env.SUPABASE_BUCKET)
        .getPublicUrl(fileName).data;
      image_url = publicUrl;
    }
    const { data, error } = await supabase
      .from('events')
      .update({ name, date, description, drive_link, image_url })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error || !data) return res.status(404).json({ success: false, message: error?.message || 'Event not found' });
    res.json({ success: true, event: data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
});

// DELETE /api/events/:id - Delete event (admin only)
router.delete('/:id', auth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admins only' });
  }
  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', req.params.id);
  if (error) return res.status(500).json({ success: false, message: error.message });
  res.json({ success: true, message: 'Event deleted' });
});

module.exports = router; 