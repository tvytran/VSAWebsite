// Vercel deployment test - Updated for deployment
const express = require('express'); //importing express
const cors = require('cors'); //importing cors
const helmet = require('helmet'); // Import helmet
const rateLimit = require('express-rate-limit'); // Import rate-limit
require('dotenv').config(); //importing dotenv

const app = express(); //creating express app

// Use helmet for security headers
app.use(helmet());

const port = process.env.PORT || 5001; //setting port

const allowedOrigins = [
  'http://localhost:3000',
  'https://www.vsacolumbia.com',
  'https://vsa-website.vercel.app',
  'https://vsa-website-git-main-tvytran.vercel.app',
  'https://vsa-website-tvytran.vercel.app',
  'https://vsa-website-git-main-tvytran.vercel.app',
  'https://vsa-website-tvytran.vercel.app'
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      // Temporarily allow all origins for debugging
      return callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json()); //using express.json
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public')); // Serve static files from the 'public' directory

// Rate limiting to prevent brute-force attacks
const authLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 100, // Limit each IP to 100 requests per windowMs
	standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: 'Too many requests from this IP, please try again after 15 minutes',
});

// Apply the rate limiter to authentication routes
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Import Supabase client
const supabase = require('./supabaseClient');

// Import routes
console.log("Requiring userRoutes");
const userRoutes = require('./routes/users');

console.log("Requiring authRoutes");
const authRoutes = require('./routes/auth');

console.log("Requiring postRoutes");
const postRoutes = require('./routes/posts');

console.log("Requiring pointsRoutes");
const pointsRoutes = require('./routes/points');

console.log("Requiring familyRoutes");
const familyRoutes = require('./routes/families');

console.log("Requiring eventsRouter");
const eventsRouter = require('./routes/events');

// Import auth middleware
const auth = require('./middleware/auth');

// Use routes

// Apply auth middleware to routes that require it
console.log("Registering /api/users");
app.use('/api/users', auth, userRoutes);

console.log("Registering /api/auth");
app.use('/api/auth', authRoutes);

// Debug route to test auth middleware
app.get('/api/auth/test', (req, res) => {
    res.json({ 
        message: 'Auth route is working',
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method
    });
});

// Debug route to test if auth middleware is working
app.get('/api/auth/test-auth', auth, (req, res) => {
    res.json({ 
        message: 'Auth middleware is working',
        user: req.user,
        timestamp: new Date().toISOString()
    });
});

// Debug route to test if the server is receiving requests
app.get('/api/debug', (req, res) => {
    res.json({
        message: 'Debug endpoint',
        headers: req.headers,
        method: req.method,
        url: req.url,
        timestamp: new Date().toISOString()
    });
});

// Posts routes - some are public (for guests), some require auth
console.log("Registering /api/posts");
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

console.log("Registering /api/points");
app.use('/api/points', auth, pointsRoutes);

console.log("Registering /api/families");
app.use('/api/families', auth, familyRoutes);

console.log("Registering /api/events");
app.use('/api/events', eventsRouter);

// Basic test route to verify the server is running
// Vercel deployment test - Updated for deployment  
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to VSA Website API' });
});

// Test route to verify API is working
app.get('/api/test', (req, res) => {
    res.json({ 
        message: 'API is working',
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method
    });
});

// Health check endpoint for debugging
app.get('/api/health', (req, res) => {
    res.json({ 
        message: 'VSA API is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        supabaseUrl: process.env.SUPABASE_URL ? 'SET' : 'NOT SET',
        supabaseKey: process.env.SUPABASE_KEY ? 'SET' : 'NOT SET',
        supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY ? 'SET' : 'NOT SET',
        jwtSecret: process.env.JWT_SECRET ? 'SET' : 'NOT SET',
        supabaseBucket: process.env.SUPABASE_BUCKET ? 'SET' : 'NOT SET'
    });
});

// Test endpoint for auth debugging
app.get('/api/test-auth', (req, res) => {
    res.json({
        message: 'Auth test endpoint',
        headers: req.headers,
        method: req.method,
        url: req.url,
        environment: process.env.NODE_ENV
    });
});

// Global error handling middleware
app.use((err, req, res, next) => {
    console.error('Error details:', {
        message: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        headers: req.headers,
        body: req.body
    });
    
    // Handle CORS errors specifically
    if (err.message === 'Not allowed by CORS') {
        return res.status(403).json({
            success: false,
            error: 'CORS Error: Request blocked by CORS policy',
            origin: req.headers.origin
        });
    }
    
    res.status(500).json({
        success: false,
        error: err.message || 'Server Error'
    });  // Send error response
});

// 404 handler for unmatched routes
app.use('*', (req, res) => {
    console.log('404 - Route not found:', req.originalUrl);
    res.status(404).json({
        success: false,
        error: 'Route not found',
        path: req.originalUrl,
        method: req.method
    });
});

// Catch-all handler for any other requests
app.use((req, res) => {
    console.log('Catch-all handler for:', req.originalUrl);
    res.status(404).json({
        success: false,
        error: 'Route not found',
        path: req.originalUrl,
        method: req.method
    });
});

// Start the server only if not in production (Vercel)
if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

// Export the Express app for Vercel
module.exports = app;




