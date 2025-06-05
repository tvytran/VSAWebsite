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
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsError, setPostsError] = useState('');
  const [editingPostId, setEditingPostId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editError, setEditError] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  // State for controlling the visibility of the three dots menu
  const [showMenuId, setShowMenuId] = useState(null);

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

      // Fetch family details and posts if user is in a family
      if (userRes.data.user.family) {
        const familyId = userRes.data.user.family;
        
        // Fetch family details
        const familyRes = await api.get(`/api/families/${familyId}`, {
          headers: { 'x-auth-token': token }
        });
        setFamily(familyRes.data.family);

        // Fetch posts for the family
        setPostsLoading(true);
        setPostsError('');
        try {
          const postsRes = await api.get(`/api/posts/family/${familyId}`, {
            headers: { 'x-auth-token': token }
          });
          setPosts(postsRes.data.posts);
          setPostsLoading(false);
        } catch (err) {
          setPostsError('Failed to load family posts.');
          setPostsLoading(false);
        }

      }
      setLoading(false);
    } catch (err) {
      setError('Failed to load user info or family. Please log in again.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [navigate]);

  // Helper: check if current user is the logged-in user (always true on profile page)
  // This is kept for consistency with FamilyDetails post logic if needed later
  const userId = user?._id;
  const isMember = family && user && family.members.some(m => (m._id || m) === userId);

  // Handle file selection
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Check file type (optional, but good practice)
      if (!file.type.startsWith('image/')) {
        setUploadError('Please select an image file.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageToCrop(reader.result); // reader.result is the data URL
        setSelectedFile(file); // Store the original file for potential use or info
        setUploadError(''); // Clear previous errors
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle profile picture upload (now accepts cropped blob)
  const handleProfilePictureUpload = async (croppedBlob) => {
    // Use the croppedBlob directly
    if (!croppedBlob) {
      setUploadError('No image data to upload.');
      return;
    }

    setUploadLoading(true);
    setUploadError('');

    const formData = new FormData();
    // Append the cropped blob with a filename and type
    formData.append('profilePicture', croppedBlob, 'profile.jpeg'); // Provide a filename and type

    try {
      const token = localStorage.getItem('token');
      const res = await api.put('/api/auth/profile', formData, {
        headers: {
          'x-auth-token': token,
          // 'Content-Type': 'multipart/form-data' // Axios sets this automatically with FormData
        }
      });
      setUser(res.data.user); // Update user state with the new profile picture path
      setSelectedFile(null); // Clear selected file
      setImageToCrop(null); // Close the cropper modal
      setUploadLoading(false);
      // Optionally show a success message
    } catch (err) {
      console.error('Profile picture upload failed:', err.response?.data || err.message || err);
      setUploadError(err.response?.data?.message || 'Failed to upload profile picture.');
      setUploadLoading(false);
    }
  };

  // Function to close the cropper modal
  const handleCropperCancel = () => {
    setImageToCrop(null);
    setSelectedFile(null); // Clear the selected file as well
    setUploadError(''); // Clear any errors
  };

  const startEdit = (post) => {
    setEditingPostId(post._id);
    setEditTitle(post.title);
    setEditContent(post.content);
    setEditError('');
  };

  const cancelEdit = () => {
    setEditingPostId(null);
    setEditTitle('');
    setEditContent('');
    setEditError('');
  };

  const handleEditPost = async (e, postId) => {
    e.preventDefault();
    setEditError('');
    setEditLoading(true);
    try {
      const token = localStorage.getItem('token');
      await api.put(`/api/posts/${postId}`, {
        title: editTitle,
        content: editContent
      }, {
        headers: { 'x-auth-token': token }
      });
      setEditLoading(false);
      setEditingPostId(null);
      setEditTitle('');
      setEditContent('');
      // Refresh posts
       const postsRes = await api.get(`/api/posts/family/${family._id}`, {
        headers: { 'x-auth-token': token }
      });
      setPosts(postsRes.data.posts);
      await fetchUserData(); // Refresh family info (especially points)
    } catch (err) {
      setEditError(err.response?.data?.message || 'Failed to edit post.');
      setEditLoading(false);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      const token = localStorage.getItem('token');
      await api.delete(`/api/posts/${postId}`, {
        headers: { 'x-auth-token': token }
      });
      // Refresh posts
      const postsRes = await api.get(`/api/posts/family/${family._id}`, {
        headers: { 'x-auth-token': token }
      });
      setPosts(postsRes.data.posts);
      await fetchUserData(); // Refresh family info (especially points)
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete post.');
    }
  };

  // Handle username edit
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

    if (!editedUsername.trim()) {
        setUsernameEditError('Username cannot be empty.');
        setUsernameEditLoading(false);
        return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await api.put('/api/auth/profile', 
        { username: editedUsername },
        {
          headers: {
            'x-auth-token': token,
          }
        }
      );

      if (res.data.success) {
        setUser(res.data.user); // Update user state with the new username
        localStorage.setItem('user', JSON.stringify(res.data.user)); // Update user in localStorage
        setIsEditingUsername(false);
        setEditedUsername('');
      } else {
         setUsernameEditError(res.data.message || 'Failed to update username.');
      }
      setUsernameEditLoading(false);

    } catch (err) {
      console.error('Username update failed:', err.response?.data || err.message || err);
      setUsernameEditError(err.response?.data?.message || 'Failed to update username.');
      setUsernameEditLoading(false);
    }
  };

  if (loading) {
    return <MainLayout><div className="text-xl text-[#b32a2a]">Loading profile and family info...</div></MainLayout>;
  }

  if (error) {
    return <MainLayout><div className="text-xl text-red-600">{error}</div></MainLayout>;
  }

  if (!user) {
    return <MainLayout><div className="text-xl text-gray-600">User not found.</div></MainLayout>;
  }

  return (
    <MainLayout>
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-md p-8">
        <h2 className="mb-6 text-2xl font-bold text-[#b32a2a]">Profile</h2>
        
        {/* User Info */}
        <div className="mb-6 pb-6 border-b border-gray-200">
          <div className="mb-4">
            <span className="font-semibold">Username:</span> 
            {isEditingUsername ? (
              <form onSubmit={handleSaveUsername} className="inline-block ml-2">
                <input
                  type="text"
                  value={editedUsername}
                  onChange={(e) => setEditedUsername(e.target.value)}
                  className="border rounded px-2 py-1 mr-2 text-gray-700"
                  disabled={usernameEditLoading}
                />
                <button 
                  type="submit" 
                  className="bg-[#b32a2a] hover:bg-[#8a1f1f] text-white text-sm py-1 px-3 rounded mr-2" 
                  disabled={usernameEditLoading}
                >
                  {usernameEditLoading ? 'Saving...' : 'Save'}
                </button>
                <button 
                  type="button" 
                  onClick={cancelEditUsername} 
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 text-sm py-1 px-3 rounded"
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
                {user.profilePicture ? (
                  <img 
                    src={user.profilePicture} 
                    alt={user.username} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-[#b32a2a] flex items-center justify-center text-white font-bold text-4xl">
                    {user.username?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
               {/* File input for new profile picture */}
               {/* We style the label to look like a button */}
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

        {/* Image Cropper Modal (conditionally rendered) */}
        {imageToCrop && (
          <ImageCropperModal
            imageUrl={imageToCrop}
            onCropComplete={handleProfilePictureUpload} // Pass the upload function
            onCancel={handleCropperCancel} // Pass the cancel function
          />
        )}

        {/* Family Info */}
        {family ? (
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-[#b32a2a] mb-4">{family.name}</h3>
            
            {/* View Family Button */}
            <Link to={`/families/${family._id}`}>
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
                    <li key={member._id || member}>
                      {member.username || member.email || member}
                    </li>
                  ))
                ) : (
                  <li className="text-gray-500">No members yet.</li>
                )}
              </ul>
            </div>

            {/* Family Posts */}
            <div className="mb-4">
              <span className="font-semibold">Posts:</span>
              {postsLoading ? (
                <div className="text-gray-500">Loading posts...</div>
              ) : postsError ? (
                <div className="text-red-600">{postsError}</div>
              ) : posts.length > 0 ? (
                <ul className="list-disc ml-6 mt-2">
                  {posts.map(post => (
                     <li key={post._id} className={`mb-4 rounded-lg shadow-md p-4 relative ${post.type === 'announcement' ? 'bg-[#fff3e6] border-2 border-[#b32a2a]' : 'bg-white'}`}>
                      {editingPostId === post._id ? (
                        <form onSubmit={(e) => handleEditPost(e, post._id)} className="mb-2 flex flex-col gap-2">
                          <input
                            className="p-2 border border-gray-300 rounded-lg"
                            value={editTitle}
                            onChange={e => setEditTitle(e.target.value)}
                            required
                            disabled={editLoading}
                          />
                          <textarea
                            className="p-2 border border-gray-300 rounded-lg"
                            value={editContent}
                            onChange={e => setEditContent(e.target.value)}
                            required
                            disabled={editLoading}
                          />
                          <div className="flex gap-2">
                            <button type="submit" className="px-4 py-1 bg-[#b32a2a] text-white rounded-lg hover:bg-[#8a1f1f]" disabled={editLoading}>
                              {editLoading ? 'Saving...' : 'Save'}
                            </button>
                            <button type="button" className="px-4 py-1 bg-gray-300 rounded-lg" onClick={cancelEdit} disabled={editLoading}>
                              Cancel
                            </button>
                          </div>
                          {editError && <div className="text-red-600 mt-2">{editError}</div>}
                        </form>
                      ) : (
                        <>
                          <div className="flex items-center mb-2">
                            <div className="w-10 h-10 rounded-full overflow-hidden mr-3">
                              {post.author_id?.profilePicture ? (
                                <img 
                                  src={post.author_id.profilePicture}
                                  alt={post.author_id.username} 
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-[#b32a2a] flex items-center justify-center text-white font-bold">
                                  {post.author_id?.username?.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-800">
                                {post.author_id?.username}
                                {post.type === 'announcement' && (
                                  <span className="ml-2 text-[#b32a2a] font-bold">(Admin)</span>
                                )}
                              </div>
                              <div className="text-xs text-gray-500">{new Date(post.createdAt).toLocaleString()}</div>
                            </div>
                          </div>
                          <div className="ml-13">
                            {post.type === 'announcement' && (
                              <div className="mb-2">
                                <span className="bg-[#b32a2a] text-white px-3 py-1 rounded-full text-sm font-semibold">
                                  Announcement
                                </span>
                              </div>
                            )}
                            <h3 className={`text-lg font-bold mb-2 ${post.type === 'announcement' ? 'text-[#b32a2a]' : 'text-gray-800'}`}>
                              {post.title}
                            </h3>
                            <div className="text-gray-700 mb-2 whitespace-pre-wrap">
                              {post.content}
                              {post.hangoutDetails?.pointValue > 0 && (
                                <span className="ml-2 text-blue-600 font-semibold">[{post.hangoutDetails.pointValue} pts]</span>
                              )}
                            </div>
                            {/* Three dots menu for edit/delete */}
                            {isMember && user?._id === post.author_id?._id && (
                              <div className="absolute top-4 right-4">
                                <button 
                                  onClick={() => setShowMenuId(showMenuId === post._id ? null : post._id)}
                                  className="text-gray-500 hover:text-gray-700 focus:outline-none"
                                >
                                  &#8226;&#8226;&#8226;
                                </button>
                                {showMenuId === post._id && (
                                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
                                    <button
                                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                      onClick={() => {
                                         startEdit(post);
                                         setShowMenuId(null); // Close menu after selecting edit
                                      }}
                                    >
                                      Edit
                                    </button>
                                    <button
                                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                                      onClick={() => {
                                        handleDeletePost(post._id);
                                        setShowMenuId(null); // Close menu after selecting delete
                                      }}
                                    >
                                      Delete
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-gray-500">No posts yet.</div>
              )}
            </div>
          </div>
        ) : (
          <div className="mb-4 text-gray-500">Not in a family</div>
        )}
      </div>
    </MainLayout>
  );
}

export default Profile; 