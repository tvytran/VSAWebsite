import React, { useEffect, useState } from 'react';
import api from './api';
import { Link, useNavigate } from 'react-router-dom';
import MainLayout from './MainLayout';
import ImageCropperModal from './components/ImageCropperModal';
import heic2any from 'heic2any';
import { useAuth } from './AuthContext';
import { supabase } from './supabaseClient';

function Profile() {
  const navigate = useNavigate();
  const [family, setFamily] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userPosts, setUserPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsError, setPostsError] = useState('');

  // State for profile picture upload
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // State for image cropping modal
  const [imageToCrop, setImageToCrop] = useState(null);

  // State for username editing
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [editedUsername, setEditedUsername] = useState('');
  const [usernameEditLoading, setUsernameEditLoading] = useState(false);
  const [usernameEditError, setUsernameEditError] = useState('');

  const { isLoggedIn, user: authUser, updateUser } = useAuth();
  console.log('Profile page - isLoggedIn:', isLoggedIn, 'user:', authUser);

  // Fetch user/family/posts using Supabase token
  const fetchUserData = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) {
      navigate('/login');
      return;
    }
    try {
      // Fetch user profile
      const userRes = await api.get('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      // Optionally update context user
      if (updateUser) updateUser(userRes.data.user);

      // Fetch family details if user is in a family
      if (userRes.data.user.family_id) {
        const familyId = userRes.data.user.family_id;
        // Fetch family details
        const familyRes = await api.get(`/api/families/${familyId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setFamily(familyRes.data.family);
      } else {
        setFamily(null);
      }

      // Fetch user's posts
      setPostsLoading(true);
      try {
        const postsRes = await api.get(`/api/posts/user/${userRes.data.user.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setUserPosts(postsRes.data.posts);
      } catch (err) {
        setPostsError('Failed to load your posts.');
      }
      setPostsLoading(false);
      setLoading(false);
    } catch (err) {
      setError('Failed to load user info or family. Please log in again.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
    // eslint-disable-next-line
  }, [navigate]);

  // Handle file selection
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    let processedFile = file;
    if (file.type === 'image/heic' || file.name.toLowerCase().endsWith('.heic')) {
      try {
        const convertedBlob = await heic2any({ blob: file, toType: 'image/jpeg' });
        processedFile = new File([convertedBlob], file.name.replace(/\.heic$/i, '.jpg'), { type: 'image/jpeg' });
      } catch (err) {
        alert('Failed to convert HEIC image. Please try another file.');
        return;
      }
    }
    // Now use processedFile for cropping/uploading
    const reader = new FileReader();
    reader.onloadend = () => {
      setImageToCrop(reader.result);
      setSelectedFile(processedFile);
    };
    reader.readAsDataURL(processedFile);
    setUploadError('');
  };

  // Handle profile picture upload
  const handleProfilePictureUpload = async (croppedBlob) => {
    if (!croppedBlob) {
      setUploadError('No image data to upload.');
      return;
    }

    setUploadLoading(true);
    setUploadError('');

    const formData = new FormData();
    formData.append('profilePicture', croppedBlob, 'profile.jpeg');

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) {
      setUploadError('No authentication token.');
      setUploadLoading(false);
      return;
    }

    try {
      const res = await api.put('/api/auth/profile', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });
      if (updateUser) updateUser(res.data.user);
      setSelectedFile(null);
      setImageToCrop(null);
      setUploadLoading(false);
      await fetchUserData();
    } catch (err) {
      console.error('Profile picture upload failed:', err.response?.data || err.message || err);
      setUploadError(err.response?.data?.message || 'Failed to upload profile picture.');
      setUploadLoading(false);
    }
  };

  // Function to close the cropper modal
  const handleCropperCancel = () => {
    setImageToCrop(null);
    setSelectedFile(null);
    setUploadError('');
  };

  const startEditUsername = () => {
    setIsEditingUsername(true);
    setEditedUsername(authUser.username);
    setUsernameEditError('');
  };

  const cancelEditUsername = () => {
    setIsEditingUsername(false);
    setEditedUsername('');
    setUsernameEditError('');
  };

  const handleSaveUsername = async (e) => {
    e.preventDefault();
    setUsernameEditLoading(true);
    setUsernameEditError('');
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) {
      setUsernameEditError('No authentication token.');
      setUsernameEditLoading(false);
      return;
    }
    try {
      const res = await api.put('/api/auth/profile', {
        username: editedUsername
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (updateUser) updateUser(res.data.user);
      setIsEditingUsername(false);
      setUsernameEditLoading(false);
      await fetchUserData();
    } catch (err) {
      setUsernameEditError(err.response?.data?.message || 'Failed to update username.');
      setUsernameEditLoading(false);
    }
  };

  if (loading) {
    return <MainLayout><div>Loading...</div></MainLayout>;
  }

  if (!authUser) {
    return <MainLayout><div>Error loading user data.</div></MainLayout>;
  }

  return (
    <MainLayout>
      <div className="w-full max-w-2xl mx-auto bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-bold text-[#b32a2a] mb-6">Profile</h2>
        {error && <div className="text-red-600 mb-4">{error}</div>}

        {/* User Info */}
        <div className="mb-6">
          <div className="mb-4">
            <span className="font-semibold">Username:</span>
            {isEditingUsername ? (
              <form onSubmit={handleSaveUsername} className="inline-flex items-center ml-2">
                <input
                  type="text"
                  value={editedUsername}
                  onChange={e => setEditedUsername(e.target.value)}
                  className="border border-gray-300 rounded px-2 py-1 mr-2"
                  disabled={usernameEditLoading}
                />
                <button type="submit" className="px-3 py-1 bg-[#b32a2a] text-white rounded hover:bg-[#8a1f1f] transition duration-200" disabled={usernameEditLoading}>Save</button>
                <button type="button" className="ml-2 px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition duration-200" onClick={cancelEditUsername} disabled={usernameEditLoading}>Cancel</button>
              </form>
            ) : (
              <span className="ml-2">{authUser.username} <button className="ml-2 text-blue-600 underline text-sm" onClick={startEditUsername}>Edit</button></span>
            )}
            {usernameEditError && <div className="text-red-600 mt-2">{usernameEditError}</div>}
          </div>
          <div className="mb-4">
            <span className="font-semibold">Email:</span> <span className="ml-2">{authUser.email}</span>
          </div>
          <div className="mb-4">
            <span className="font-semibold">Total Points:</span> <span className="ml-2">{authUser.points_total}</span>
          </div>
          <div className="mb-4">
            <span className="font-semibold">Semester Points:</span> <span className="ml-2">{authUser.points_semest}</span>
          </div>
        </div>
        {/* Profile Picture Section */}
        <div className="mb-8">
          <span className="font-semibold block mb-2">Profile Picture:</span>
          {authUser.profile_picture ? (
            <img
              src={authUser.profile_picture}
              alt="Profile"
              className="w-32 h-32 rounded-full object-cover mb-2 border-4 border-[#e0c9a6]"
            />
          ) : (
            <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center text-4xl text-gray-500 mb-2 border-4 border-[#e0c9a6]">
              {authUser.username ? authUser.username.charAt(0).toUpperCase() : '?'}
            </div>
          )}
          <input
            type="file"
            accept="image/*,image/heic"
            onChange={handleFileChange}
            id="profilePictureInput"
            className="hidden"
            disabled={uploadLoading}
          />
          <label htmlFor="profilePictureInput" className="px-4 py-2 bg-white border-2 border-[#b32a2a] text-[#b32a2a] font-semibold rounded-md cursor-pointer hover:bg-[#f5e6d6] transition duration-200 ease-in-out">
            {uploadLoading ? 'Uploading...' : 'Change Profile Picture'}
          </label>
          {uploadError && <div className="text-red-600 mt-2">{uploadError}</div>}
        </div>
        {/* Image Cropper Modal */}
        {imageToCrop && (
          <ImageCropperModal
            image={imageToCrop}
            onCropComplete={handleProfilePictureUpload}
            onCancel={handleCropperCancel}
            loading={uploadLoading}
          />
        )}
        {/* Family Info */}
        <div className="mb-8">
          <span className="font-semibold block mb-2">Family:</span>
          {family ? (
            <div className="bg-[#e0c9a6] rounded-lg p-4 mb-2">
              <Link to={`/families/${family.id}`} className="font-bold text-[#b32a2a] hover:underline">
                {family.name}
              </Link>
            </div>
          ) : (
            <span className="text-gray-600">Not in a family yet.</span>
          )}
        </div>
        {/* User's Posts */}
        <div className="mb-8">
          <span className="font-semibold block mb-2">Your Posts:</span>
          {postsLoading ? (
            <div>Loading posts...</div>
          ) : postsError ? (
            <div className="text-red-600">{postsError}</div>
          ) : userPosts.length === 0 ? (
            <div className="text-gray-600">You haven't posted yet.</div>
          ) : (
            <ul className="space-y-2">
              {userPosts.map(post => (
                <li key={post.id} className="bg-[#faecd8] rounded-lg p-4">
                  <Link to={`/post/${post.id}`} className="text-[#b32a2a] font-semibold hover:underline">
                    {post.title}
                  </Link>
                  <span className="ml-2 text-gray-600 text-sm">{new Date(post.created_at).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </MainLayout>
  );
}

export default Profile; 