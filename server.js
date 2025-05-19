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

// Import routes
const userRoutes = require('./routes/users');
const groupRoutes = require('./routes/groups');
const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');

// Use routes
app.use('/api/users', userRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);

// Basic test route to verify the server is running
app.get('/', (req, res) => {
    res.send('VSA Social Media API is running!');
  });

  // Connect to MongoDB database
mongoose.connect(process.env.MONGODB_URI)   // Connection string from .env file
.then(() => console.log('MongoDB connected successfully'))      // Log success
.catch(err => console.log('MongoDB connection error:', err));   // Log failure


// Global error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);                 // Log error details to the console
    res.status(500).json({ message: 'Something went wrong on the server!' });  // Send error response
  });

  // Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);  // Log that server has started
  });




