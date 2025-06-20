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
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public')); // Serve static files from the 'public' directory

// Import Supabase client
const supabase = require('./supabaseClient');

// Import routes
const userRoutes = require('./routes/users');
const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');
const pointsRoutes = require('./routes/points');
const familyRoutes = require('./routes/families');
const eventsRouter = require('./routes/events');

// Import auth middleware
const auth = require('./middleware/auth');

// Use routes

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

// Posts routes - some are public (for guests), some require auth
app.use('/api/posts', (req, res, next) => {
    // Public routes that don't require authentication
    const publicRoutes = ['/announcements', '/public'];
    const isPublicRoute = publicRoutes.some(route => req.path.startsWith(route));
    
    if (isPublicRoute) {
        return next(); // Skip auth for public routes
    }
    
    // Apply auth middleware for protected routes
    auth(req, res, next);
}, postRoutes);

app.use('/api/points', auth, pointsRoutes);
app.use('/api/families', auth, familyRoutes);
app.use('/api/events', eventsRouter);

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




