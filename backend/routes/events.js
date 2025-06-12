const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');
const auth = require('../middleware/auth');

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
router.post('/', auth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admins only' });
  }
  const { name, date, description, drive_link, image_url } = req.body;
  const { data, error } = await supabase
    .from('events')
    .insert([{ name, date, description, drive_link, image_url }])
    .select()
    .single();
  if (error) return res.status(500).json({ success: false, message: error.message });
  res.status(201).json({ success: true, event: data });
});

// PUT /api/events/:id - Update event (admin only)
router.put('/:id', auth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admins only' });
  }
  const { name, date, description, drive_link, image_url } = req.body;
  const { data, error } = await supabase
    .from('events')
    .update({ name, date, description, drive_link, image_url })
    .eq('id', req.params.id)
    .select()
    .single();
  if (error || !data) return res.status(404).json({ success: false, message: error?.message || 'Event not found' });
  res.json({ success: true, event: data });
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