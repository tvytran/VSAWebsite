// Vercel deployment test - Updated for deployment
const express = require('express'); //importing express
const cors = require('cors'); //importing cors
require('dotenv').config(); //importing dotenv

const app = express(); //creating express app

const port = process.env.PORT || 5001; //setting port

const allowedOrigins = [
  'http://localhost:3000',
  'https://anhchiem.vercel.app'
];
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
//
app.use(express.json()); //using express.json
app.use('/uploads', express.static('uploads')); // Serve uploaded files (for photos)
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public')); // Serve static files from the 'public' directory

// Import Supabase client
const supabase = require('./supabaseClient');

// @route    GET api/posts/announcements
// @desc     Get all announcement posts (public) - Defined early to avoid auth middleware
// @access   Public
app.get('/api/posts/announcements', async (req, res) => {
    console.log('Handling public /api/posts/announcements route directly in server.js');
    try {
        const { data: announcements, error } = await supabase
            .from('posts')
            .select('*')
            .eq('type', 'announcement')
            .order('created_at', { ascending: false });
        if (error) throw error;
        res.json({ success: true, posts: announcements });
    } catch (err) {
        console.error('Error in public announcements route:', err.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// Import routes
const userRoutes = require('./routes/users');
const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');
const pointsRoutes = require('./routes/points');
const familyRoutes = require('./routes/families');

// Import auth middleware
const auth = require('./middleware/auth');

// Use routes

// Public route for announcements - handle directly before authenticated routes
app.use('/api/posts/announcements', postRoutes);

// Apply auth middleware to routes that require it
app.use('/api/users', auth, userRoutes);
app.use('/api/auth', (req, res, next) => {
    // Skip auth middleware for login and register routes
    if (req.path === '/login' || req.path === '/register') {
        return next();
    }
    // Apply auth middleware for all other auth routes
    auth(req, res, next);
}, authRoutes);
app.use('/api/posts', auth, (req, res, next) => {
    // This check is technically redundant if the announcements route is handled first, but as a safeguard:
    if (req.path === '/announcements') {
        return next(); // Skip auth - should have been handled by the specific route above
    }
    next(); // Continue with auth middleware for other post routes
}, postRoutes);
app.use('/api/points', auth, pointsRoutes);
app.use('/api/families', auth, familyRoutes);

// Basic test route to verify the server is running
// Vercel deployment test - Updated for deployment  
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to VSA Website API' });
});

// Global error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);                 // Log error details to the console
    res.status(500).json({
        success: false,
        error: err.message || 'Server Error'
    });  // Send error response
  });

// Start the server only if not in production (Vercel)
if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

// Export the Express app for Vercel
module.exports = app;




