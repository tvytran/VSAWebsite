const express = require('express');
const router = express.Router();
const { supabase, supabaseAdmin } = require('../supabaseClient');
const auth = require('../middleware/auth');

// No built-in defaults; show nothing until admin sets links
const DEFAULT_LINKS = [];

// Public: get quick links for login page
router.get('/quick-links', async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    const { data, error } = await supabaseAdmin
      .from('settings')
      .select('value')
      .eq('key', 'quick_links')
      .single();
    if (error) {
      // If table missing or row missing, fall back
      return res.json({ success: true, links: DEFAULT_LINKS });
    }
    const links = Array.isArray(data?.value) ? data.value.slice(0,10) : DEFAULT_LINKS;
    const normalized = links
      .filter(l => l && typeof l.label === 'string' && typeof l.url === 'string')
      .map(l => ({ label: l.label, url: l.url }));
    res.json({ success: true, links: normalized.slice(0,10) });
  } catch (err) {
    res.json({ success: true, links: DEFAULT_LINKS });
  }
});

// Admin only: update quick links
router.put('/quick-links', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admins only' });
    }
    const links = Array.isArray(req.body?.links) ? req.body.links : [];
    // Basic validation
    const sanitized = links
      .filter(l => l && typeof l.label === 'string' && typeof l.url === 'string')
      .map(l => ({ label: l.label.trim(), url: l.url.trim() }));
    if (sanitized.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one link required' });
    }
    if (sanitized.length > 10) {
      return res.status(400).json({ success: false, message: 'A maximum of 10 links are allowed' });
    }

    // Upsert into settings table
    const { data, error } = await supabaseAdmin
      .from('settings')
      .upsert({ key: 'quick_links', value: sanitized.slice(0,10) }, { onConflict: 'key' })
      .select('key')
      .single();
    if (error) {
      return res.status(500).json({ success: false, message: 'Failed to save links. Ensure table "settings(key text primary key, value jsonb)" exists.' });
    }
    res.json({ success: true, links: sanitized });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
});

module.exports = router;


