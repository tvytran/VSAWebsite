const express = require('express');
const router = express.Router();
console.log('POSTS ROUTER FILE EXECUTED');
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const Post = require('../models/Post');
const User = require('../models/User');
const Family = require('../models/Family');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const uploadPath = path.join(__dirname, '..', 'public', 'uploads', 'posts');
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
  fileFilter: function(req, file, cb) {
    // Allow images only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
});

// @route    POST api/posts
// @desc     Create a post
// @access   Private
router.post(
  '/',
  auth,
  upload.single('image'), // Use multer middleware here for single image upload
  [
    check('title', 'Title is required').not().isEmpty(),
    check('type', 'Type is required').not().isEmpty(),
    check('content', 'Content is required').not().isEmpty(),
    check('family', 'Family ID is required').isMongoId()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // If there are validation errors from express-validator, return them
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    // Handle multer file filter errors
    if (req.fileValidationError) {
        return res.status(400).json({ success: false, message: req.fileValidationError });
    }
     if (req.fileTypeError) {
        return res.status(400).json({ success: false, message: req.fileTypeError });
    }

    try {
      const user = await User.findById(req.user.id).select('-password');
      const family = await Family.findById(req.body.family);

      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      // Add this check for announcement posts
      if (req.body.type === 'announcement' && user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Only admins can create announcement posts.' });
      }

      if (!family) {
        return res.status(404).json({ success: false, message: 'Family not found' });
      }

      // Check if user is a member of the specified family
      const isMember = family.members.some(member => member.toString() === req.user.id);
      if (!isMember) {
          return res.status(403).json({ success: false, message: 'You must be a member of this family to post.' });
      }

      const { title, type, content, pointValue } = req.body;

      const postData = {
        title,
        type,
        content,
        family: family.id,
        author: user.id,
      };

      // If type is hangout and pointValue is provided, add it to hangoutDetails
      if (type === 'hangout' && pointValue !== undefined && pointValue !== null) {
        postData.hangoutDetails = { pointValue: parseInt(pointValue, 10) };
      }

      // If an image was uploaded, add the file path to the postData
      if (req.file) {
        postData.imageUrl = `/uploads/posts/${req.file.filename}`;
      }

      const newPost = new Post(postData);

      const post = await newPost.save();

      // If it's a hangout post with points, update family points
      // Note: Checking post.hangoutDetails?.pointValue as it's nested now
      if (post.type === 'hangout' && post.hangoutDetails?.pointValue > 0) {
          console.log('Adding family points.');
          try {
              const pointsToAdd = post.hangoutDetails.pointValue;
              await Family.findByIdAndUpdate(
                  post.family,
                  {
                      $inc: {
                          totalPoints: pointsToAdd,
                          semesterPoints: pointsToAdd
                      }
                  },
                  { new: true }
              );
              console.log('Family points updated successfully on post creation.');
          } catch (err) {
              console.error('Failed to update family points on post creation:', err);
              // Decide here if failing to update points should stop post creation.
              // Currently, it will just log the error and the post will still be created.
          }
      }

      res.status(201).json({ success: true, post });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ success: false, message: 'Server Error' });
    }
  }
);

// @route    GET api/posts/feed
// @desc     Get posts for the user's feed (family posts and public posts)
// @access   Private
router.get('/feed', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('family');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let posts = [];

    if (user.family) {
      // Get posts from the user's family, sorted by date
      // Populate author and family, also select hangoutDetails for pointValue
      const familyPosts = await Post.find({ family: user.family._id })
        .populate('author', ['username', 'profilePicture', 'email'])
        .populate('family', ['name'])
        .select('+hangoutDetails')
        .sort({ createdAt: -1 });
      posts = [...familyPosts];
    }

    // TODO: Implement logic for public posts if needed

    res.json({ posts });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route    GET api/posts/family/:familyId
// @desc     Get posts for a specific family
// @access   Private
router.get('/family/:familyId', auth, async (req, res) => {
  try {
    const familyId = req.params.familyId;
     // Populate author and family, also select hangoutDetails for pointValue
    const posts = await Post.find({ family: familyId })
      .populate('author', ['username', 'profilePicture', 'email'])
      .populate('family', ['name'])
      .select('+hangoutDetails')
      .sort({ createdAt: -1 });

    if (!posts || posts.length === 0) { // Check for empty array as well
      return res.status(404).json({ success: false, message: 'No posts found for this family' });
    }

    res.json({ success: true, posts });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// @route    GET api/posts/:id
// @desc     Get post by ID
// @access   Private
router.get('/:id', auth, async (req, res) => {
  try {
     // Populate author and family, also select hangoutDetails for pointValue
    const post = await Post.findById(req.params.id)
      .populate('author', ['username', 'profilePicture', 'email'])
      .populate('family', ['name'])
      .select('+hangoutDetails');

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    res.json({ success: true, post });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// @route    DELETE api/posts/:id
// @desc     Delete a post
// @access   Private
router.delete('/:id', auth, async (req, res) => {
  try {
    console.log('Attempting to delete post:', req.params.id);
    const post = await Post.findById(req.params.id);

    if (!post) {
      console.log('Post not found:', req.params.id);
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    console.log('Post found:', post._id);
    console.log('Authenticated user ID:', req.user.id);
    console.log('Post author ID:', post.author.toString());

    // Check user
    if (post.author.toString() !== req.user.id) {
      console.log('User not authorized to delete this post.');
      return res.status(401).json({ success: false, message: 'User not authorized' });
    }

    console.log('User authorized. Proceeding with deletion steps.');

    // Subtract points if hangout with pointValue (check nested pointValue)
    if (post.type === 'hangout' && post.hangoutDetails?.pointValue > 0) {
        console.log('Subtracting family points, ensuring not negative.');
        try {
            const pointsToSubtract = post.hangoutDetails.pointValue;
            // Fetch the family again to get the current points
            const currentFamily = await Family.findById(post.family);

            if (currentFamily) {
                 // Calculate new points, ensuring they don't go below zero
                const newTotalPoints = Math.max(0, currentFamily.totalPoints - pointsToSubtract);
                const newSemesterPoints = Math.max(0, currentFamily.semesterPoints - pointsToSubtract);

                await Family.findByIdAndUpdate(
                    post.family,
                    {
                        $set: {
                            totalPoints: newTotalPoints,
                            semesterPoints: newSemesterPoints
                        }
                    },
                    { new: true, runValidators: false } // Use $set with calculated values
                );
                console.log('Family points updated successfully (capped at zero).');
            } else {
                 console.error('Family not found for point update during post deletion.');
            }
        } catch (err) {
            console.error('Error updating family points during post deletion:', err);
            // Continue with post deletion even if points update fails
        }
    }

    // Remove the image file if it exists
    if (post.imageUrl) {
        console.log('Attempting to delete image file:', post.imageUrl);
        const imagePath = path.join(__dirname, '..', 'public', post.imageUrl);
        fs.unlink(imagePath, (err) => {
            if (err) console.error('Failed to delete image file:', err);
            else console.log('Image file deleted successfully.');
        });
    }

    console.log('Attempting to delete post from database.');
    await post.deleteOne(); // Use deleteOne instead of remove
    console.log('Post deleted from database.');

    res.json({ success: true, message: 'Post removed' });
  } catch (err) {
    console.error('Error during post deletion:', err.message);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// @route    PUT api/posts/like/:id
// @desc     Like a post
// @access   Private
router.put('/like/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
        return res.status(404).json({ success: false, message: 'Post not found' });
    }

    // Check if the post has already been liked by this user
    if (post.likes.some(like => like.user.toString() === req.user.id)) {
      return res.status(400).json({ success: false, message: 'Post already liked' });
    }

    post.likes.unshift({ user: req.user.id });

    await post.save();

    res.json({ success: true, likes: post.likes });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// @route    PUT api/posts/unlike/:id
// @desc     Unlike a post
// @access   Private
router.put('/unlike/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
        return res.status(404).json({ success: false, message: 'Post not found' });
    }

    // Check if the post has NOT yet been liked by this user
    if (!post.likes.some(like => like.user.toString() === req.user.id)) {
      return res.status(400).json({ success: false, message: 'Post has not yet been liked' });
    }

    // Remove the like
    post.likes = post.likes.filter(
      ({ user }) => user.toString() !== req.user.id
    );

    await post.save();

    res.json({ success: true, likes: post.likes });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// @route    POST api/posts/comment/:id
// @desc     Comment on a post
// @access   Private
router.post(
  '/comment/:id',
  auth,
  check('text', 'Text is required').not().isEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await User.findById(req.user.id).select('-password');
      const post = await Post.findById(req.params.id);

      if (!post) {
          return res.status(404).json({ success: false, message: 'Post not found.' });
      }

      const newComment = {
        text: req.body.text,
        name: user.username, // Use username
        avatar: user.avatar, // Use avatar if available
        user: req.user.id
      };

      post.comments.unshift(newComment);

      await post.save();

      res.json({ success: true, comments: post.comments });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ success: false, message: 'Server Error' });
    }
  }
);

// @route    DELETE api/posts/comment/:id/:comment_id
// @desc     Delete comment
// @access   Private
router.delete('/comment/:id/:comment_id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
        return res.status(404).json({ success: false, message: 'Post not found.' });
    }

    // Pull out comment
    const comment = post.comments.find(
      comment => comment.id === req.params.comment_id
    );

    // Make sure comment exists
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment does not exist' });
    }

    // Check user
    if (comment.user.toString() !== req.user.id) {
      return res.status(401).json({ success: false, message: 'User not authorized' });
    }

    // Get remove index
    const removeIndex = post.comments
      .map(comment => comment.id)
      .indexOf(req.params.comment_id);

    post.comments.splice(removeIndex, 1);

    await post.save();

    res.json({ success: true, comments: post.comments });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// @route    GET api/posts/family/:familyId/hangouts
// @desc     Get all hangouts for a specific family
// @access   Private
router.get('/family/:familyId/hangouts', auth, async (req, res) => {
    try {
        const { 
            upcoming,    // Filter upcoming hangouts
            past,       // Filter past hangouts
            page = 1, 
            limit = 10 
        } = req.query;
        
        // TODO: Get all hangouts organized by this family
        res.json({ message: 'Get family hangouts' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// @route    GET api/posts/announcements
// @desc     Get all announcement posts (public)
// @access   Public
router.get('/announcements', async (req, res) => {
  console.log('Received request for /api/posts/announcements');
  console.log('Request Headers:', req.headers);
  try {
    console.log('Attempting to fetch announcements from DB');
    const announcements = await Post.find({ type: 'announcement' })
      .populate('author', ['username', 'profilePicture'])
      .populate('family', ['name'])
      .sort({ createdAt: -1 });

    console.log('Successfully fetched announcements', announcements.length, 'announcements found');
    res.json({ success: true, posts: announcements });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

module.exports = router; 