const express = require('express');
const router = express.Router();
console.log('POSTS ROUTER FILE EXECUTED');
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const supabase = require('../supabaseClient');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const heicConvert = require('heic-convert');

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
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
    console.error('Error converting HEIC to JPEG:', error);
    throw new Error('Failed to convert HEIC image to JPEG');
  }
}

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

        const { title, type, content, family_id, pointValue } = req.body;

        // Check if user exists
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('id, role, family_id')
            .eq('id', req.user.id)
            .single();
        if (userError) throw userError;
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        // Check if user is admin for announcement posts
        if (type === 'announcement' && user.role !== 'admin') {
            return res.status(403).json({ 
                success: false, 
                message: 'Only administrators can create announcements.' 
            });
        }

        // Validate image only for non-announcement posts
        if (type !== 'announcement' && !req.file) {
            return res.status(400).json({ 
                success: false, 
                message: 'An image is required for non-announcement posts.' 
            });
        }

        console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
        console.log('SUPABASE_KEY:', process.env.SUPABASE_KEY ? 'SET' : 'NOT SET');
        console.log('SUPABASE_BUCKET:', process.env.SUPABASE_BUCKET);
        // Check user and family exist
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
            point_value: type === 'hangout' && pointValue ? parseInt(pointValue, 10) : 0,
            likes: [], // Initialize empty likes array
            comments: [] // Initialize empty comments array
        };

        // Handle image upload with Supabase Storage if an image was provided
        if (req.file) {
            let imageBuffer = req.file.buffer;
            let mimeType = req.file.mimetype;
            let fileExt = 'jpg'; // Default to jpg

            // Convert HEIC to JPEG if needed
            if (req.file.originalname.toLowerCase().endsWith('.heic') || 
                req.file.originalname.toLowerCase().endsWith('.heif')) {
                try {
                    imageBuffer = await convertHeicToJpeg(req.file.buffer);
                    mimeType = 'image/jpeg';
                } catch (error) {
                    return res.status(400).json({
                        success: false,
                        message: 'Failed to process HEIC image. Please try converting it to JPEG first.'
                    });
                }
            } else {
                fileExt = req.file.originalname.split('.').pop().toLowerCase();
            }

            const fileName = `posts/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from(process.env.SUPABASE_BUCKET)
                .upload(fileName, imageBuffer, {
                    contentType: mimeType,
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
        }

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

// @route    GET api/posts/public
// @desc     Get public posts for guests (announcements and hangouts)
// @access   Public
router.get('/public', async (req, res) => {
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
            .in('type', ['announcement', 'hangout'])
            .order('created_at', { ascending: false });
        if (error) throw error;
        res.json({ success: true, posts });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// @route    GET api/posts/public/:id
// @desc     Get public post by ID (for guests)
// @access   Public
router.get('/public/:id', async (req, res) => {
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
            .in('type', ['announcement', 'hangout'])
            .single();
        if (error) throw error;
        if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
        res.json({ success: true, post });
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
        // Fetch the post to get its type, point_value, and family_id
        const { data: post, error: postError } = await supabase
            .from('posts')
            .select('id, type, point_value, family_id, author_id')
            .eq('id', req.params.id)
            .single();
        if (postError) throw postError;
        if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

        // Only allow author or admin to delete
        if (post.author_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ success: false, message: 'User not authorized' });
        }

        // If it's a hangout with points, subtract from family
        if (post.type === 'hangout' && post.point_value > 0 && post.family_id) {
            // Get current family points
            const { data: family, error: familyError } = await supabase
                .from('families')
                .select('total_points, semester_points')
                .eq('id', post.family_id)
                .single();
            if (familyError) throw familyError;

            // Subtract points
            await supabase
                .from('families')
                .update({
                    total_points: Math.max(0, (family.total_points || 0) - post.point_value),
                    semester_points: Math.max(0, (family.semester_points || 0) - post.point_value)
                })
                .eq('id', post.family_id);
        }

        // Delete the post
        const { error } = await supabase
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
    // Fetch the latest likes array
    const { data: post, error: fetchError } = await supabase
      .from('posts')
      .select('likes')
      .eq('id', req.params.id)
      .single();

    if (fetchError) throw fetchError;
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const likes = Array.isArray(post.likes) ? post.likes : [];
    if (likes.some(like => (like.user || '').trim() === (req.user.id || '').trim())) {
      return res.status(400).json({ success: false, message: 'Post already liked' });
    }

    const updatedLikes = [...likes, { user: req.user.id }];

    // Update the post with the new likes array
    const { error: updateError } = await supabase
      .from('posts')
      .update({
        likes: updatedLikes,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.params.id);

    if (updateError) throw updateError;

    // Re-fetch the post to get the latest likes array
    const { data: latestPost, error: latestError } = await supabase
      .from('posts')
      .select('likes')
      .eq('id', req.params.id)
      .single();

    if (latestError) throw latestError;

    res.json({ success: true, likes: latestPost.likes });
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
    // Fetch the latest likes array
    const { data: post, error: fetchError } = await supabase
      .from('posts')
      .select('likes')
      .eq('id', req.params.id)
      .single();

    if (fetchError) throw fetchError;
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const likes = Array.isArray(post.likes) ? post.likes : [];

    // Remove the like for the current user
    const updatedLikes = likes.filter(
      like => (like.user || '').trim() !== (req.user.id || '').trim()
    );

    // Update the post with the new likes array
    const { error: updateError } = await supabase
      .from('posts')
      .update({
        likes: updatedLikes,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.params.id);

    if (updateError) throw updateError;

    // Re-fetch the post to get the latest likes array
    const { data: latestPost, error: latestError } = await supabase
      .from('posts')
      .select('likes')
      .eq('id', req.params.id)
      .single();

    if (latestError) throw latestError;

    res.json({ success: true, likes: latestPost.likes });
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
      // Get user information including profile picture
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, username, profile_picture')
        .eq('id', req.user.id)
        .single();

      if (userError) throw userError;
      if (!userData) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      // Get post and its comments
      const { data: post, error: postError } = await supabase
        .from('posts')
        .select('comments')
        .eq('id', req.params.id)
        .single();

      if (postError) throw postError;
      if (!post) {
        return res.status(404).json({ success: false, message: 'Post not found' });
      }

      const comments = Array.isArray(post.comments) ? post.comments : [];
      const newComment = {
        id: Date.now().toString(), // Generate a unique ID for the comment
        text: req.body.text,
        user: req.user.id,
        username: userData.username,
        profile_picture: userData.profile_picture,
        created_at: new Date().toISOString()
      };

      const { data: updatedPost, error: updateError } = await supabase
        .from('posts')
        .update({
          comments: [...comments, newComment],
          updated_at: new Date().toISOString()
        })
        .eq('id', req.params.id)
        .select('comments')
        .single();

      if (updateError) throw updateError;

      res.json({ success: true, comments: updatedPost.comments });
    } catch (err) {
      console.error('Error in comment creation:', err);
      res.status(500).json({ success: false, message: 'Server Error' });
    }
  }
);

// @route    PUT api/posts/comment/:id/:comment_id
// @desc     Edit a comment
// @access   Private
router.put('/comment/:id/:comment_id', auth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Comment text is required' });
    }

    // Get post and its comments
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('comments')
      .eq('id', req.params.id)
      .single();

    if (postError) throw postError;
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const comments = Array.isArray(post.comments) ? post.comments : [];
    const commentIndex = comments.findIndex(c => c.id === req.params.comment_id);

    if (commentIndex === -1) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    // Check if user is the comment author or an admin
    const comment = comments[commentIndex];
    if (comment.user !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, message: 'Not authorized to edit this comment' });
    }

    // Update the comment
    comments[commentIndex] = {
      ...comment,
      text: text.trim(),
      updated_at: new Date().toISOString()
    };

    const { data: updatedPost, error: updateError } = await supabase
      .from('posts')
      .update({
        comments: comments,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.params.id)
      .select('comments')
      .single();

    if (updateError) throw updateError;

    res.json({ success: true, comments: updatedPost.comments });
  } catch (err) {
    console.error('Error in comment edit:', err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// @route    DELETE api/posts/comment/:id/:comment_id
// @desc     Delete comment
// @access   Private
router.delete('/comment/:id/:comment_id', auth, async (req, res) => {
  try {
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('comments')
      .eq('id', req.params.id)
      .single();

    if (postError) throw postError;
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const comments = Array.isArray(post.comments) ? post.comments : [];
    const comment = comments.find(c => c.id === req.params.comment_id);

    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    // Check if user is the comment author or an admin
    if (comment.user !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, message: 'Not authorized to delete this comment' });
    }

    const updatedComments = comments.filter(c => c.id !== req.params.comment_id);

    const { data: updatedPost, error: updateError } = await supabase
      .from('posts')
      .update({
        comments: updatedComments,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.params.id)
      .select('comments')
      .single();

    if (updateError) throw updateError;

    res.json({ success: true, comments: updatedPost.comments });
  } catch (err) {
    console.error('Error in comment deletion:', err);
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
      // Only select the fields we need
      const { data: post, error: fetchError } = await supabase
        .from('posts')
        .select('id, author_id, type, point_value, family_id')
        .eq('id', req.params.id)
        .single();

      if (fetchError) throw fetchError;
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
      const oldPointValue = post.point_value || 0;

      // Update post fields
      const updateData = {
        updated_at: new Date().toISOString()
      };
      
      if (title !== undefined) updateData.title = title;
      if (content !== undefined) updateData.content = content;

      // Handle pointValue update for hangout posts (only if provided in request and user is admin or author)
      if (post.type === 'hangout' && (req.user.role === 'admin' || post.author_id === req.user.id) && pointValue !== undefined && pointValue !== null) {
          const newPointValue = parseInt(pointValue, 10);
          if (!isNaN(newPointValue) && newPointValue >= 0) {
              updateData.point_value = newPointValue;

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

      // Update the post with only the fields we want to change
      const { data: updatedPost, error: updateError } = await supabase
        .from('posts')
        .update(updateData)
        .eq('id', req.params.id)
        .select(`
          id,
          title,
          content,
          type,
          point_value,
          author_id,
          family_id,
          created_at,
          updated_at,
          image_path,
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
        .single();

      if (updateError) throw updateError;

      res.json({ success: true, post: updatedPost });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ success: false, message: 'Server Error' });
    }
  }
);

// Get posts by user ID
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;

    // First, get all regular posts
    const { data: regularPosts, error: regularError } = await supabase
      .from('posts')
      .select(`
        *,
        author:users!posts_author_id_fkey (
          id,
          username,
          profile_picture
        ),
        family:families!posts_family_id_fkey (
          id,
          name
        )
      `)
      .eq('author_id', userId)
      .neq('type', 'announcement')
      .order('created_at', { ascending: false });

    if (regularError) throw regularError;

    // Then, get only the three most recent announcements
    const { data: announcements, error: announcementError } = await supabase
      .from('posts')
      .select(`
        *,
        author:users!posts_author_id_fkey (
          id,
          username,
          profile_picture
        ),
        family:families!posts_family_id_fkey (
          id,
          name
        )
      `)
      .eq('author_id', userId)
      .eq('type', 'announcement')
      .order('created_at', { ascending: false })
      .limit(3);

    if (announcementError) throw announcementError;

    // Combine the posts, with announcements first
    const posts = [...announcements, ...regularPosts];

    res.json({ posts });
  } catch (err) {
    console.error('Error fetching user posts:', err);
    res.status(500).json({ message: 'Failed to fetch user posts' });
  }
});

module.exports = router; 