const express = require('express');
const router = express.Router();
console.log('POSTS ROUTER FILE EXECUTED');
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const supabase = require('../supabaseClient');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: function(req, file, cb) {
    // Allow images only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
});

// @route   POST /api/posts
// @desc    Create a new post
// @access  Private
router.post('/', auth, upload.single('image'), async (req, res) => {
    try {
        console.log('Received post creation request:', {
            body: req.body,
            file: req.file,
            user: req.user,
            headers: req.headers
        });

        // Validate image
        if (!req.file) {
            return res.status(400).json({ 
                success: false, 
                message: 'An image is required for all posts.' 
            });
        }

        console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
        console.log('SUPABASE_KEY:', process.env.SUPABASE_KEY ? 'SET' : 'NOT SET');
        console.log('SUPABASE_BUCKET:', process.env.SUPABASE_BUCKET);
        const { title, type, content, family_id, pointValue } = req.body;
        // Check user and family exist
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('id, role, family_id')
            .eq('id', req.user.id)
            .single();
        if (userError) throw userError;
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        if (type === 'announcement' && user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Only admins can create announcement posts.' });
        }
        const { data: family, error: famError } = await supabase
            .from('families')
            .select('id')
            .eq('id', family_id)
            .single();
        if (famError) throw famError;
        if (!family) return res.status(404).json({ success: false, message: 'Family not found' });
        // TODO: Check if user is a member of the family if needed
        // Insert post
        const postData = {
            title,
            type,
            content,
            family_id,
            author_id: user.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            point_value: type === 'hangout' && pointValue ? parseInt(pointValue, 10) : 0
        };

        // Handle image upload with Supabase Storage
        const fileExt = req.file.originalname.split('.').pop();
        const fileName = `posts/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
            .from(process.env.SUPABASE_BUCKET)
            .upload(fileName, req.file.buffer, {
                contentType: req.file.mimetype,
                upsert: true,
            });

        if (uploadError) {
            throw uploadError;
        }

        const { publicUrl } = supabase.storage
            .from(process.env.SUPABASE_BUCKET)
            .getPublicUrl(fileName).data;

        console.log('Upload result:', uploadData, uploadError);
        console.log('Public URL:', publicUrl);
        postData.image_path = publicUrl;

        const { data: newPost, error: postError } = await supabase
            .from('posts')
            .insert(postData)
            .select()
            .single();
        if (postError) throw postError;

        // Update family points if this is a hangout post with points
        if (type === 'hangout' && postData.point_value > 0) {
            try {
                // First get the current family points
                const { data: family, error: familyError } = await supabase
                    .from('families')
                    .select('total_points, semester_points')
                    .eq('id', family_id)
                    .single();
                
                if (familyError) throw familyError;

                // Then update with the new points
                await supabase
                    .from('families')
                    .update({
                        total_points: (family.total_points || 0) + postData.point_value,
                        semester_points: (family.semester_points || 0) + postData.point_value
                    })
                    .eq('id', family_id);
                console.log(`Family points updated by ${postData.point_value} on post creation.`);
            } catch (err) {
                console.error('Failed to update family points on post creation:', err);
                // Log error but don't block the post creation
            }
        }

        res.status(201).json({ success: true, post: newPost });
    } catch (err) {
        console.error('Error in post creation:', err);
        res.status(500).json({ success: false, message: 'Server Error during post creation.' });
    }
});

// @route    GET api/posts/feed
// @desc     Get posts for the user's feed (family posts and public posts)
// @access   Private
router.get('/feed', auth, async (req, res) => {
    try {
        const { data: posts, error } = await supabase
            .from('posts')
            .select(`
                *,
                author:author_id (
                    id,
                    username,
                    profile_picture
                ),
                family:family_id (
                    id,
                    name,
                    total_points,
                    semester_points
                )
            `)
            .order('created_at', { ascending: false });
        if (error) throw error;
        // TODO: Join author and family info if needed
        res.json({ success: true, posts });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route    GET api/posts/family/:familyId
// @desc     Get posts for a specific family
// @access   Private
router.get('/family/:familyId', auth, async (req, res) => {
    try {
        const { data: posts, error } = await supabase
            .from('posts')
            .select(`
                *,
                author:author_id (
                    id,
                    username,
                    profile_picture
                ),
                family:family_id (
                    id,
                    name,
                    total_points,
                    semester_points
                )
            `)
            .eq('family_id', req.params.familyId)
            .order('created_at', { ascending: false });
        if (error) throw error;
        res.json({ success: true, posts });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// @route    GET api/posts/announcements
// @desc     Get all announcement posts (public)
// @access   Public
router.get('/announcements', async (req, res) => {
    try {
        const { data: posts, error } = await supabase
            .from('posts')
            .select(`
                *,
                author:author_id (
                    id,
                    username,
                    profile_picture
                ),
                family:family_id (
                    id,
                    name,
                    total_points,
                    semester_points
                )
            `)
            .eq('type', 'announcement')
            .order('created_at', { ascending: false });
        if (error) throw error;
        res.json({ success: true, posts });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// @route    GET api/posts/all
// @desc     Get all posts (Admin only)
// @access   Private (Admin)
router.get('/all', auth, async (req, res) => {
    try {
        // Check if user is admin
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('role')
            .eq('id', req.user.id)
            .single();
        if (userError) throw userError;
        if (!user || user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Authorization denied. Admin access required.' });
        }
        const { data: posts, error } = await supabase
            .from('posts')
            .select(`
                *,
                author:author_id (
                    id,
                    username,
                    profile_picture
                ),
                family:family_id (
                    id,
                    name,
                    total_points,
                    semester_points
                )
            `)
            .order('created_at', { ascending: false });
        if (error) throw error;
        res.json({ success: true, posts });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// @route    GET api/posts/:id
// @desc     Get post by ID
// @access   Private
router.get('/:id', auth, async (req, res) => {
    try {
        const { data: post, error } = await supabase
            .from('posts')
            .select(`
                *,
                author:author_id (
                    id,
                    username,
                    profile_picture
                ),
                family:family_id (
                    id,
                    name,
                    total_points,
                    semester_points
                )
            `)
            .eq('id', req.params.id)
            .single();
        if (error) throw error;
        if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
        res.json({ success: true, post });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// @route    DELETE api/posts/:id
// @desc     Delete a post
// @access   Private
router.delete('/:id', auth, async (req, res) => {
    try {
        // Check if post exists and user is author or admin
        const { data: post, error: postError } = await supabase
            .from('posts')
            .select('id, author_id')
            .eq('id', req.params.id)
            .single();
        if (postError) throw postError;
        if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
        if (post.author_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ success: false, message: 'User not authorized' });
        }
        const { data, error } = await supabase
            .from('posts')
            .delete()
            .eq('id', req.params.id);
        if (error) throw error;
        res.json({ success: true, message: 'Post deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// @route    PUT api/posts/like/:id
// @desc     Like a post
// @access   Private
router.put('/like/:id', auth, async (req, res) => {
  try {
    const post = await supabase
      .from('posts')
      .select('likes')
      .eq('id', req.params.id)
      .single();

    if (!post) {
        return res.status(404).json({ success: false, message: 'Post not found' });
    }

    // Check if the post has already been liked by this user
    if (post.likes.some(like => like.user.toString() === req.user.id)) {
      return res.status(400).json({ success: false, message: 'Post already liked' });
    }

    const { data: updatedPost, error } = await supabase
      .from('posts')
      .update({
        likes: [...post.likes, { user: req.user.id }],
        updated_at: new Date().toISOString()
      })
      .eq('id', req.params.id)
      .select('likes')
      .single();

    if (error) throw error;

    res.json({ success: true, likes: updatedPost.likes });
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
    const post = await supabase
      .from('posts')
      .select('likes')
      .eq('id', req.params.id)
      .single();

    if (!post) {
        return res.status(404).json({ success: false, message: 'Post not found' });
    }

    // Check if the post has NOT yet been liked by this user
    if (!post.likes.some(like => like.user.toString() === req.user.id)) {
      return res.status(400).json({ success: false, message: 'Post has not yet been liked' });
    }

    // Remove the like
    const { data: updatedPost, error } = await supabase
      .from('posts')
      .update({
        likes: post.likes.filter(
          ({ user }) => user.toString() !== req.user.id
        ),
        updated_at: new Date().toISOString()
      })
      .eq('id', req.params.id)
      .select('likes')
      .single();

    if (error) throw error;

    res.json({ success: true, likes: updatedPost.likes });
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
      const user = await supabase
        .from('users')
        .select('username, avatar')
        .eq('id', req.user.id)
        .single();
      const post = await supabase
        .from('posts')
        .select('comments')
        .eq('id', req.params.id)
        .single();

      if (!post) {
          return res.status(404).json({ success: false, message: 'Post not found.' });
      }

      const newComment = {
        text: req.body.text,
        name: user.username,
        avatar: user.avatar,
        user: req.user.id
      };

      const { data: updatedPost, error } = await supabase
        .from('posts')
        .update({
          comments: [...post.comments, newComment],
          updated_at: new Date().toISOString()
        })
        .eq('id', req.params.id)
        .select('comments')
        .single();

      if (error) throw error;

      res.json({ success: true, comments: updatedPost.comments });
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
    const post = await supabase
      .from('posts')
      .select('comments')
      .eq('id', req.params.id)
      .single();

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

    const { data: updatedPost, error } = await supabase
      .from('posts')
      .update({
        comments: post.comments.filter(
          (_, index) => index !== removeIndex
        ),
        updated_at: new Date().toISOString()
      })
      .eq('id', req.params.id)
      .select('comments')
      .single();

    if (error) throw error;

    res.json({ success: true, comments: updatedPost.comments });
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

// @route    PUT api/posts/:id
// @desc     Update a post
// @access   Private
router.put(
  '/:id',
  auth,
  [
    // Optional validation for title and content if they are editable
    // check('title', 'Title is required').not().isEmpty(),
    // check('content', 'Content is required').not().isEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, content, pointValue } = req.body; // Include pointValue

    try {
      let post = await supabase
        .from('posts')
        .select('*')
        .eq('id', req.params.id)
        .single();

      if (!post) {
        return res.status(404).json({ success: false, message: 'Post not found' });
      }

      // Check user (Allow admin to edit any post, or author to edit their own non-announcement post)
      if (post.author_id !== req.user.id && req.user.role !== 'admin') {
           // Additionally, prevent non-admins from editing announcements even if they are the author
           if(post.type === 'announcement') {
             return res.status(401).json({ success: false, message: 'Admins only can edit announcements' });
           }
           // For other post types, check if the user is the author
           if(post.author_id !== req.user.id) {
              return res.status(401).json({ success: false, message: 'User not authorized' });
           }
      }

      // Store the old point value before updating
      const oldPointValue = post.point_value ? post.point_value : 0;

      // Update post fields
      if (title !== undefined) post.title = title;
      if (content !== undefined) post.content = content;

      // Handle pointValue update for hangout posts (only if provided in request and user is admin or author)
      // Allow admin or the author of the post to edit points on a hangout post
      if (post.type === 'hangout' && (req.user.role === 'admin' || post.author_id === req.user.id) && pointValue !== undefined && pointValue !== null) {
          const newPointValue = parseInt(pointValue, 10);
          if (!isNaN(newPointValue) && newPointValue >= 0) {
              post.point_value = newPointValue;

              // Calculate point difference and update family points
              const pointDifference = newPointValue - oldPointValue;
              if (pointDifference !== 0 && post.family_id) {
                  try {
                      // First get the current family points
                      const { data: family, error: familyError } = await supabase
                          .from('families')
                          .select('total_points, semester_points')
                          .eq('id', post.family_id)
                          .single();
                      
                      if (familyError) throw familyError;

                      // Then update with the new points
                      await supabase
                          .from('families')
                          .update({
                              total_points: (family.total_points || 0) + pointDifference,
                              semester_points: (family.semester_points || 0) + pointDifference
                          })
                          .eq('id', post.family_id);
                      console.log(`Family points updated by ${pointDifference} on post edit.`);
                  } catch (err) {
                      console.error('Failed to update family points on post edit:', err);
                      // Log error but don't block the post update
                  }
              }
          } else {
               return res.status(400).json({ success: false, message: 'Invalid point value provided.' });
          }
      }

      const { data: updatedPost, error } = await supabase
        .from('posts')
        .update(post)
        .eq('id', req.params.id)
        .select('*')
        .single();

      if (error) throw error;

      res.json({ success: true, post: updatedPost });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ success: false, message: 'Server Error' });
    }
  }
);

module.exports = router; 