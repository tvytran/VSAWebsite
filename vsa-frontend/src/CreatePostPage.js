import React, { useState, useEffect } from 'react';
import api from './api';
import { useNavigate } from 'react-router-dom';
import MainLayout from './MainLayout';

function CreatePostPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [family, setFamily] = useState(null); // For regular users' default family
  const [families, setFamilies] = useState([]); // For admin to select a family
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState('hangout'); // Default to 'hangout'
  const [newPost, setNewPost] = useState('');
  const [pointValue, setPointValue] = useState('');
  const [image, setImage] = useState(null); // State to store the selected image file
  const [postError, setPostError] = useState('');
  const [postLoading, setPostLoading] = useState(false);
  const [postSuccess, setPostSuccess] = useState(false); // Add success state
  const [selectedFamilyId, setSelectedFamilyId] = useState(''); // State for admin's selected family

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      try {
        // Fetch user profile
        const userRes = await api.get('/api/auth/me', {
          headers: { 'x-auth-token': token }
        });
        setUser(userRes.data.user);

        // If user is admin, fetch all families for selection
        if (userRes.data.user.role === 'admin') {
          const familiesRes = await api.get('/api/families', {
             headers: { 'x-auth-token': token }
          });
          setFamilies(familiesRes.data.families);
          if (familiesRes.data.families.length > 0) {
             setSelectedFamilyId(familiesRes.data.families[0].id);
          }
        } else if (userRes.data.user.family_id) {
          const familyRes = await api.get(`/api/families/${userRes.data.user.family_id}`, {
            headers: { 'x-auth-token': token }
          });
          setFamily(familyRes.data.family);
        } else {
          setError('You must be part of a family to create posts.');
        }
        setLoading(false);
      } catch (err) {
        console.error('Fetch error:', err.response?.data?.message || err.message);
        setError('Failed to load user or family info. Please log in again.');
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  const handleCreatePost = async (e) => {
    e.preventDefault();
    setPostError('');
    setPostLoading(true);

    // Validate image only for non-announcement posts
    if (newType !== 'announcement' && !image) {
      setPostError('Please select an image for your post.');
      setPostLoading(false);
      return;
    }

    const targetFamilyId = user?.role === 'admin' ? selectedFamilyId : family?.id;
    if (!targetFamilyId) {
      setPostError('Please select a family or join one to create a post.');
      setPostLoading(false);
      return;
    }
    const formData = new FormData();
    formData.append('title', newTitle);
    formData.append('type', newType);
    formData.append('content', newPost);
    formData.append('family_id', targetFamilyId);
    if (newType === 'hangout' && pointValue) {
        formData.append('pointValue', pointValue);
    }
    if (image) {
        formData.append('image', image);
    }
    try {
      await api.post('/api/posts', formData, {
        headers: {
          'x-auth-token': localStorage.getItem('token'),
        }
      });
      setNewTitle('');
      setNewType('hangout');
      setNewPost('');
      setPointValue('');
      setImage(null);
      setPostLoading(false);
      setPostSuccess(true);
      navigate('/dashboard');
    } catch (err) {
      console.error('Post creation error:', err.response?.data?.message || err.message);
      setPostError(err.response?.data?.message || 'Failed to create post.');
      setPostLoading(false);
    }
  };

  if (loading) {
    return <MainLayout><div>Loading...</div></MainLayout>;
  }

  // Render form only if user is not a regular user without a family
  // Admins can proceed even if they don't have a family assigned to their user object
  if (!user) {
       return <MainLayout><div>Error loading user data.</div></MainLayout>;
  }

   // If the user is a regular user and doesn't have a family
   if (user.role !== 'admin' && !family) {
      return <MainLayout><div className="text-red-600">You must be part of a family to create posts.</div></MainLayout>;
   }


  return (
    <MainLayout>
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-bold text-[#b32a2a] mb-6">Create New Post</h2>

        {error && <div className="text-red-600 mb-4">{error}</div>}
        {postError && <div className="text-red-600 mb-4">{postError}</div>}

        {/* Conditional rendering based on postSuccess */}
        {postSuccess ? (
          <div className="text-center p-6 bg-green-100 border border-green-400 text-green-700 rounded-md mb-4">
            <p className="text-lg font-semibold">Post created successfully!</p>
            <div className="mt-6 flex justify-center gap-4">
              <button
                className="bg-[#b32a2a] hover:bg-[#8a1f1f] text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-200 ease-in-out"
                onClick={() => setPostSuccess(false)} // Reset to show the form again
              >
                Create Another Post
              </button>
               <button
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-200 ease-in-out"
                onClick={() => navigate('/dashboard')} // Navigate to dashboard
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        ) : (
          /* Original Form */
          <form onSubmit={handleCreatePost} className="flex flex-col gap-4">

            {/* Family Selection for Admin */}
            {user?.role === 'admin' && families.length > 0 && (
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="familySelect">
                  Select Family:
                </label>
                <select
                  id="familySelect"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={selectedFamilyId}
                  onChange={e => setSelectedFamilyId(e.target.value)}
                  required
                  disabled={postLoading}
                >
                  {families.map(fam => (
                    <option key={fam.id} value={fam.id}>{fam.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Display Family for Regular User */}
             {user?.role !== 'admin' && family && (
              <div className="mb-4">
                 <p className="block text-gray-700 text-sm font-bold mb-2">Posting to Family: {family.name}</p>
              </div>
            )}

            {/* Post Type Selection */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="postType">
                Post Type:
              </label>
              <select
                id="postType"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={newType}
                onChange={e => setNewType(e.target.value)}
              >
                <option value="hangout">Hangout</option>
                {user?.role === 'admin' && <option value="announcement">Announcement</option>}
              </select>
            </div>

            {/* Title */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="title">
                Title:
              </label>
              <input
                id="title"
                type="text"
                placeholder="Post Title"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                required
              />
            </div>

            {/* Content */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="content">
                Content:
              </label>
              <textarea
                id="content"
                placeholder="What's happening in your family?"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-32"
                value={newPost}
                onChange={e => setNewPost(e.target.value)}
                required
              ></textarea>
            </div>

            {/* Point Value (only for Hangout) */}
            {newType === 'hangout' && (
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="pointValue">
                  Point Value:
                </label>
                <input
                  id="pointValue"
                  type="number"
                  placeholder="e.g., 10"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  value={pointValue}
                  onChange={e => setPointValue(e.target.value)}
                  min="0"
                />
              </div>
            )}

            {/* Image Upload */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="image">
                Image {newType !== 'announcement' && <span className="text-red-500">*</span>}
                {newType === 'announcement' ? ' (Optional)' : ' (Required)'}
              </label>
              <input
                type="file"
                id="image"
                accept="image/*,.heic,.heif"
                onChange={(e) => setImage(e.target.files[0])}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required={newType !== 'announcement'}
                disabled={postLoading}
              />
              <p className="text-sm text-gray-500 mt-1">
                {newType === 'announcement' 
                  ? 'Optional: Upload an image for your announcement (JPG, PNG, GIF, or HEIC)'
                  : 'Please upload an image for your post (JPG, PNG, GIF, or HEIC)'}
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-[#b32a2a] hover:bg-[#8a1f1f] text-white font-bold py-3 px-4 rounded focus:outline-none focus:shadow-outline transition duration-200 ease-in-out"
              disabled={postLoading || (user?.role !== 'admin' && !family) || (user?.role === 'admin' && families.length === 0)} // Disable if loading, regular user without family, or admin with no families
            >
              {postLoading ? 'Creating...' : 'Create Post'}
            </button>
          </form>
        )}
      </div>
    </MainLayout>
  );
}

export default CreatePostPage; 