const express = require('express'); //importing express
const mongoose = require('mongoose'); //importing mongoose
const cors = require('cors'); //importing cors
require('dotenv').config(); //importing dotenv

const app = express(); //creating express app

const port = process.env.PORT || 5001; //setting port

//middleware
app.use(cors()); //using cors
app.use(express.json()); //using express.json
app.use('/uploads', express.static('uploads')); // Serve uploaded files (for photos)
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public')); // Serve static files from the 'public' directory

// Import routes
const userRoutes = require('./routes/users');
const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');
const pointsRoutes = require('./routes/points');
const familyRoutes = require('./routes/families');

// Use routes
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/points', pointsRoutes);
app.use('/api/families', familyRoutes);

// Basic test route to verify the server is running
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to VSA Website API' });
});

// Database Connection
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vsa_website', {
            // These options are no longer needed in newer versions of Mongoose
            // but included for compatibility
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

// Connect to database
connectDB();

// Global error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);                 // Log error details to the console
    res.status(500).json({
        success: false,
        error: err.message || 'Server Error'
    });  // Send error response
  });

  // Start the server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);  // Log that server has started
  });




