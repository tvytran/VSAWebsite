import React, { useEffect, useState } from 'react';
import api from './api';
import { Link, useNavigate } from 'react-router-dom';
import MainLayout from './MainLayout';
import ImageCropperModal from './components/ImageCropperModal';

function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
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

  const fetchUserData = async () => {
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

      // Fetch family details if user is in a family
      if (userRes.data.user.family_id) {
        const familyId = userRes.data.user.family_id;
        
        // Fetch family details
        const familyRes = await api.get(`/api/families/${familyId}`, {
          headers: { 'x-auth-token': token }
        });
        setFamily(familyRes.data.family);
      }

      // Fetch user's posts
      setPostsLoading(true);
      try {
        const postsRes = await api.get(`/api/posts/user/${userRes.data.user.id}`, {
          headers: { 'x-auth-token': token }
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
  }, [navigate]);

  // Handle file selection
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setUploadError('Please select an image file.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageToCrop(reader.result);
        setSelectedFile(file);
        setUploadError('');
      };
      reader.readAsDataURL(file);
    }
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

    try {
      const token = localStorage.getItem('token');
      const res = await api.put('/api/auth/profile', formData, {
        headers: {
          'x-auth-token': token,
        }
      });
      setUser(res.data.user);
      setSelectedFile(null);
      setImageToCrop(null);
      setUploadLoading(false);
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
    setEditedUsername(user.username);
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
    try {
      const token = localStorage.getItem('token');
      const res = await api.put('/api/auth/profile', {
        username: editedUsername
      }, {
        headers: { 'x-auth-token': token }
      });
      setUser(res.data.user);
      setIsEditingUsername(false);
      setUsernameEditLoading(false);
    } catch (err) {
      setUsernameEditError(err.response?.data?.message || 'Failed to update username.');
      setUsernameEditLoading(false);
    }
  };

  if (loading) {
    return <MainLayout><div>Loading...</div></MainLayout>;
  }

  if (!user) {
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
                  required
                  disabled={usernameEditLoading}
                />
                <button 
                  type="submit" 
                  className="bg-[#b32a2a] hover:bg-[#8a1f1f] text-white text-sm py-1 px-3 rounded"
                  disabled={usernameEditLoading}
                >
                  {usernameEditLoading ? 'Saving...' : 'Save'}
                </button>
                <button 
                  type="button" 
                  onClick={cancelEditUsername} 
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 text-sm py-1 px-3 rounded ml-2"
                  disabled={usernameEditLoading}
                >
                  Cancel
                </button>
              </form>
            ) : (
              <span className="ml-2">
                {user.username}
                <button 
                  onClick={startEditUsername} 
                  className="ml-2 text-indigo-600 hover:text-indigo-900 text-sm"
                >
                  Edit
                </button>
              </span>
            )}
          </div>
          {usernameEditError && <div className="text-red-600 text-sm mb-2">{usernameEditError}</div>}
          <div className="mb-4">
            <span className="font-semibold">Email:</span> {user.email}
          </div>
          <div className="mb-4">
            <span className="font-semibold">Role:</span> {user.role}
          </div>
          {user.points && (
            <div className="mb-4">
              <span className="font-semibold">Points:</span> {user.points.total || 0}
            </div>
          )}

          {/* Profile Picture Section */}
          <div className="mb-4">
            <span className="font-semibold block mb-2">Profile Picture:</span>
            <div className="flex items-center">
              <div className="w-20 h-20 rounded-full overflow-hidden mr-4 border-2 border-[#b32a2a]">
                {user.profile_picture ? (
                  <img 
                    src={user.profile_picture} 
                    alt={user.username} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-[#b32a2a] flex items-center justify-center text-white font-bold text-4xl">
                    {user.username?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <label htmlFor="profilePictureInput" className="px-4 py-2 bg-white border-2 border-[#b32a2a] text-[#b32a2a] font-semibold rounded-md cursor-pointer hover:bg-[#f5e6d6] transition duration-200 ease-in-out">
                Change Picture
                <input 
                  id="profilePictureInput"
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileChange} 
                  className="hidden"
                />
              </label>
            </div>
            {selectedFile && (
              <div className="mt-4 text-sm text-gray-600">
                Selected file: {selectedFile.name}
              </div>
            )}
          </div>
        </div>

        {/* Image Cropper Modal */}
        {imageToCrop && (
          <ImageCropperModal
            imageUrl={imageToCrop}
            onCropComplete={handleProfilePictureUpload}
            onCancel={handleCropperCancel}
          />
        )}

        {/* Family Info */}
        {family ? (
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-[#b32a2a] mb-4">{family.name}</h3>
            
            {/* View Family Button */}
            <Link to={`/families/${family.id}`}>
              <button className="mb-4 px-4 py-2 bg-[#b32a2a] text-white font-semibold rounded-md hover:bg-[#8a1f1f]">
                View Family Page
              </button>
            </Link>

            <p className="mb-4 text-gray-700">{family.description}</p>
            <div className="mb-4">
              <span className="font-semibold">Total Points:</span> {family.totalPoints || 0}
            </div>
            <div className="mb-4">
              <span className="font-semibold">Semester Points:</span> {family.semesterPoints || 0}
            </div>
            <div className="mb-4">
              <span className="font-semibold">Members:</span>
              <ul className="list-disc ml-6 mt-2">
                {family.members && family.members.length > 0 ? (
                  family.members.map(member => (
                    <li key={member.id || member}>
                      {member.username || member.email || member}
                    </li>
                  ))
                ) : (
                  <li className="text-gray-500">No members yet.</li>
                )}
              </ul>
            </div>
          </div>
        ) : (
          <div className="text-gray-600">
            You are not currently part of any family.
          </div>
        )}

        {/* User's Posts Section */}
        <div className="mt-8">
          <h3 className="text-xl font-bold text-[#b32a2a] mb-4">Your Posts</h3>
          {postsLoading ? (
            <div className="text-gray-500">Loading your posts...</div>
          ) : postsError ? (
            <div className="text-red-600">{postsError}</div>
          ) : userPosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {userPosts.map(post => (
                <div 
                  key={post.id} 
                  className={`relative rounded-lg overflow-hidden shadow-md ${
                    post.type === 'announcement' ? 'bg-[#fff3e6] border-2 border-[#b32a2a]' : 'bg-white'
                  }`}
                >
                  {post.image_path && (
                    <div className="aspect-w-16 aspect-h-9">
                      <img
                        src={post.image_path}
                        alt={post.title}
                        className="w-full h-48 object-cover"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    {post.type === 'announcement' && (
                      <span className="inline-block bg-[#b32a2a] text-white px-2 py-1 rounded-full text-xs font-semibold mb-2">
                        Announcement
                      </span>
                    )}
                    <h4 className="font-semibold text-gray-800 mb-2 line-clamp-2">{post.title}</h4>
                    <p className="text-gray-600 text-sm mb-2 line-clamp-3">{post.content}</p>
                    {post.point_value > 0 && (
                      <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-semibold">
                        {post.point_value} pts
                      </span>
                    )}
                    <div className="text-xs text-gray-500 mt-2">
                      {new Date(post.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <Link 
                    to={`/families/${post.family_id}`}
                    className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-all duration-200"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500">You haven't made any posts yet.</div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}

export default Profile; 