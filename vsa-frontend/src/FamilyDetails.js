import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import MainLayout from './MainLayout';
// Import placeholder image if you have one, or use a service like Lorem Picsum
// import placeholderImage from './placeholder.jpg'; 

console.log('--- Evaluating FamilyDetails.js file ---'); // Log at file evaluation level

function FamilyDetails() {
  console.log('Rendering FamilyDetails component'); // Log component render
  console.log('Token in localStorage on render:', localStorage.getItem('token')); // Log token on render
  const { id } = useParams();
  const [family, setFamily] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [postsError, setPostsError] = useState('');
  const [newPost, setNewPost] = useState('');
  const [postError, setPostError] = useState('');
  const [postLoading, setPostLoading] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState('');
  const [pointValue, setPointValue] = useState('');
  const [editingPostId, setEditingPostId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editError, setEditError] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  // State for editing family details
  const [isEditingFamily, setIsEditingFamily] = useState(false);
  const [editedFamilyName, setEditedFamilyName] = useState('');
  const [selectedFamilyFile, setSelectedFamilyFile] = useState(null);
  const [familyUploadLoading, setFamilyUploadLoading] = useState(false);
  const [familyUploadError, setFamilyUploadError] = useState('');

  // State for current user ID
  const [currentUserId, setCurrentUserId] = useState(null);

  const navigate = useNavigate();

  // Effect to get the current user ID from token
  useEffect(() => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setCurrentUserId(payload.user.id);
        console.log('Current User ID set:', payload.user.id); // Log when user ID is set
      } else {
         console.log('No token found in localStorage.'); // Log if no token is found
      }
    } catch (e) {
      console.error('Error decoding token:', e);
      setCurrentUserId(null); // Ensure userId is null if token is invalid
    }
  }, []); // Empty dependency array means this effect runs once after initial render

  const fetchFamily = async () => {
    console.log(`Attempting to fetch family with ID: ${id}`); // Log the ID being fetched
    try {
      const token = localStorage.getItem('token');
      const config = token ? { headers: { 'x-auth-token': token } } : {};
      console.log('Fetching family - Token available:', !!token); // Log token availability before fetch

      const res = await axios.get(`http://localhost:5001/api/families/${id}`, config);
      console.log('Family fetch successful:', res.data); // Log successful response
      if (res.data && res.data.success && res.data.family) {
         setFamily(res.data.family);
      } else {
         // Handle unexpected successful response format
         console.error('Family fetch received unexpected data format:', res.data);
         setError('Received unexpected family data.');
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching family:', err); // Log the error object
      setError(err.response?.data?.message || 'Failed to load family info.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFamily();
    // eslint-disable-next-line
  }, [id]);

  useEffect(() => {
    const fetchPosts = async () => {
      setPostsLoading(true);
      setPostsError('');
      
      const token = localStorage.getItem('token');
      console.log('Fetching posts - Token available:', !!token); // Log token availability before fetch
      if (!token) {
        // If no token, we can't fetch private posts, so show no posts.
        setPosts([]);
        setPostsLoading(false);
        return;
      }

      try {
        const res = await axios.get(`http://localhost:5001/api/posts/family/${id}`, {
          headers: { 'x-auth-token': token }
        });
        setPosts(res.data.posts);
        setPostsLoading(false);
      } catch (err) {
        setPostsError('Failed to load posts.');
        setPostsLoading(false);
      }
    };
    fetchPosts();
    // eslint-disable-next-line
  }, [id]);

  // Effect to set initial edited name when family data is loaded
  useEffect(() => {
    if (family) {
      setEditedFamilyName(family.name);
    }
  }, [family]);

  // Helper: check if current user is a member - now depends on currentUserId state
  // The calculation will happen on each render, but currentUserId is set in useEffect
  const isMember = family && family.members && currentUserId && family.members.some(m => (m._id || m) === currentUserId);

  // Handle file selection for family picture
  const handleFamilyFileChange = (event) => {
    setSelectedFamilyFile(event.target.files[0]);
    setFamilyUploadError(''); // Clear previous errors on new file selection
  };

  // Handle family profile update
  const handleFamilyUpdate = async (e) => {
    e.preventDefault();
    setFamilyUploadLoading(true);
    setFamilyUploadError('');

    const formData = new FormData();
    formData.append('name', editedFamilyName); // Always send the name
    // Add other fields if you want to make them editable
    // formData.append('description', editedFamilyDescription);

    if (selectedFamilyFile) {
      formData.append('familyPicture', selectedFamilyFile);
    }

    try {
      const token = localStorage.getItem('token');
      console.log('Updating family - Token available:', !!token); // Log token availability before update
      const res = await axios.put(`http://localhost:5001/api/families/${family._id}`, formData, {
        headers: {
          'x-auth-token': token,
          'Content-Type': 'multipart/form-data'
        }
      });
      setFamily(res.data.family); // Update family state with new data
      setIsEditingFamily(false); // Exit editing mode
      setSelectedFamilyFile(null); // Clear selected file
      setFamilyUploadLoading(false);
      // Optionally show a success message
    } catch (err) {
      console.error('Family update failed:', err);
      setFamilyUploadError(err.response?.data?.message || 'Failed to update family.');
      setFamilyUploadLoading(false);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    setPostError('');
    setPostLoading(true);
    
    if (!currentUserId) { // Ensure userId is available before posting
         setPostError('User not authenticated.');
         setPostLoading(false);
         return;
    }

    try {
      const token = localStorage.getItem('token');
      console.log('Creating post - Token available:', !!token); // Log token availability before create
      let payload = {
        title: newTitle,
        type: newType,
        content: newPost,
        family: family._id
      };
      if (newType === 'hangout') {
        const numPoints = Number(pointValue);
        if (isNaN(numPoints) || numPoints < 0) {
          setPostError('Point value must be a non-negative number.');
          setPostLoading(false);
          return;
        }
        payload.pointValue = numPoints;
      }
      await axios.post('http://localhost:5001/api/posts', payload, {
        headers: { 'x-auth-token': token }
      });
      setNewPost('');
      setNewTitle('');
      setNewType('');
      setPointValue('');
      setPostLoading(false);
      // Refresh posts
      const res = await axios.get(`http://localhost:5001/api/posts/family/${family._id}`, {
        headers: { 'x-auth-token': token }
      });
      setPosts(res.data.posts);
      await fetchFamily();
    } catch (err) {
      setPostError(err.response?.data?.message || 'Failed to create post.');
      setPostLoading(false);
    }
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

  const handleEditPost = async (e) => {
    e.preventDefault();
    setEditError('');
    setEditLoading(true);
    try {
      const token = localStorage.getItem('token');
      console.log('Editing post - Token available:', !!token); // Log token availability before edit
      await axios.put(`http://localhost:5001/api/posts/${editingPostId}`, {
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
      const res = await axios.get(`http://localhost:5001/api/posts/family/${family._id}`, {
        headers: { 'x-auth-token': token }
      });
      setPosts(res.data.posts);
      await fetchFamily();
    } catch (err) {
      setEditError(err.response?.data?.message || 'Failed to edit post.');
      setEditLoading(false);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    
    if (!currentUserId) { // Ensure userId is available before deleting
         alert('User not authenticated.');
         return;
    }

    try {
      const token = localStorage.getItem('token');
      console.log('Deleting post - Token available:', !!token); // Log token availability before delete
      await axios.delete(`http://localhost:5001/api/posts/${postId}`, {
        headers: { 'x-auth-token': token }
      });
      // Refresh posts
      const res = await axios.get(`http://localhost:5001/api/posts/family/${family._id}`, {
        headers: { 'x-auth-token': token }
      });
      setPosts(res.data.posts);
      await fetchFamily();
    } catch (err) {
      alert('Failed to delete post.');
    }
  };

  // Handle family deletion
  const handleDeleteFamily = async () => {
    if (!window.confirm('Are you sure you want to delete this family? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      console.log('Deleting family - Token available:', !!token); // Log token availability before delete
      if (!token) {
        alert('You must be logged in to delete a family.');
        return;
      }

      await axios.delete(`http://localhost:5001/api/families/${id}`, {
        headers: { 'x-auth-token': token }
      });

      alert('Family deleted successfully.');
      navigate('/families'); // Redirect to the families list page

    } catch (err) {
      console.error('Error deleting family:', err);
      alert(err.response?.data?.message || 'Failed to delete family.');
    }
  };

  if (loading) {
    return <MainLayout><div className="text-xl text-[#b32a2a]">Loading family...</div></MainLayout>;
  }
  if (error) {
    return <MainLayout><div className="text-xl text-red-600">{error}</div></MainLayout>;
  }
  if (!family) {
    console.log('FamilyDetails: Family not found or still loading.', { family, loading, error }); // Log state if family is null
    return <MainLayout><div className="text-xl text-gray-600">Family not found.</div></MainLayout>;
  }
  
  console.log('Rendering FamilyDetails for family:', family);
  console.log('FamilyDetails posts state:', posts);

  return (
    <MainLayout>
      <div className="w-full max-w-4xl mx-auto bg-[#faecd8] p-6 rounded-lg shadow-md text-center">
        {/* Navigation Arrows (Placeholder) */}
        <div className="flex justify-between items-center mb-4">
          <button className="text-3xl text-[#b32a2a]">{'<'}</button>
          {isEditingFamily ? (
            <input
              type="text"
              value={editedFamilyName}
              onChange={e => setEditedFamilyName(e.target.value)}
              className="text-3xl font-bold text-[#b32a2a] text-center bg-white border border-gray-300 rounded px-2 py-1"
              disabled={familyUploadLoading}
            />
          ) : (
            <div>
              <h2 className="text-3xl font-bold text-[#b32a2a]">{family.name}</h2>
              <p className="text-sm text-gray-600">VSA Family</p>
            </div>
          )}
          <button className="text-3xl text-[#b32a2a] ">{'>'}</button>
        </div>

        {/* Admin Actions (Delete) - Visible to members */}
        {isMember && !isEditingFamily && (
          <div className="mb-6">
            <button
              onClick={handleDeleteFamily}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-200 ease-in-out"
            >
              Delete Family
            </button>
          </div>
        )}

        {/* Family Image */}
        <div className="mb-6">
          {isEditingFamily ? (
            <div className="flex flex-col items-center">
               {/* Image Preview or Placeholder */}
              {(selectedFamilyFile || family.familyPicture) ? (
                <img 
                  src={selectedFamilyFile ? URL.createObjectURL(selectedFamilyFile) : `http://localhost:5001${family.familyPicture}`}
                  alt="Family" 
                  className="w-48 h-48 object-cover rounded-full mb-4 border-4 border-[#b32a2a]"
                />
              ) : (
                <div className="w-48 h-48 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-6xl font-bold mb-4 border-4 border-[#b32a2a]">
                  {family.name?.charAt(0).toUpperCase()}
                </div>
              )}
               {/* File input for new family picture */}
               {/* Style label as a button */}
               <label htmlFor="familyPictureInput" className="px-4 py-2 bg-white border-2 border-[#b32a2a] text-[#b32a2a] font-semibold rounded-md cursor-pointer hover:bg-[#f5e6d6] transition duration-200 ease-in-out">
                 Change Picture
                 <input 
                   id="familyPictureInput"
                   type="file" 
                   accept="image/*" 
                   onChange={handleFamilyFileChange} 
                   className="hidden"
                 />
               </label>
               {selectedFamilyFile && (
                <div className="mt-2 text-sm text-gray-600">
                  Selected file: {selectedFamilyFile.name}
                </div>
              )}
            </div>
          ) : (
            (family.familyPicture ? (
              <img src={`http://localhost:5001${family.familyPicture}`} alt="Family" className="w-48 h-48 object-cover rounded-full mx-auto mb-4 border-4 border-[#b32a2a]" />
            ) : (
              <div className="w-48 h-48 rounded-full bg-[#b32a2a] flex items-center justify-center text-white text-6xl font-bold mx-auto mb-4 border-4 border-[#b32a2a]">
                {family.name?.charAt(0).toUpperCase()}
              </div>
            ))
          )}
        </div>

        {/* Family Edit Form (conditionally rendered) */}
        {isEditingFamily && isMember && (
          <form onSubmit={handleFamilyUpdate} className="mb-6 p-4 border border-gray-300 rounded-md bg-white">
            <h4 className="text-xl font-bold mb-4">Edit Family Profile</h4>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="familyName">
                Family Name:
              </label>
              <input
                id="familyName"
                type="text"
                value={editedFamilyName}
                onChange={e => setEditedFamilyName(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
                disabled={familyUploadLoading}
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="familyPicture">
                Family Picture:
              </label>
              <input
                id="familyPicture"
                type="file"
                accept="image/*"
                onChange={handleFamilyFileChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#b32a2a] file:text-white hover:file:bg-[#8a1f1f]"
                disabled={familyUploadLoading}
              />
            </div>
            {familyUploadError && <div className="text-red-600 text-sm mb-4">{familyUploadError}</div>}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setIsEditingFamily(false)} // Cancel button
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded mr-2 focus:outline-none focus:shadow-outline"
                disabled={familyUploadLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-[#b32a2a] hover:bg-[#8a1f1f] text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                disabled={familyUploadLoading || !editedFamilyName} // Disable if loading or name is empty
              >
                {familyUploadLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}

        {/* Members List */}
        <div className="mb-6 text-lg text-[#b32a2a] font-semibold">
          {family.members && family.members.length > 0 ? (
            family.members.map((member, index) => (
              <span key={member._id || member}>
                {member.username || member.email || member}
                {index < family.members.length - 1 && ' • '}
              </span>
            ))
          ) : (
            <span>No members yet.</span>
          )}
        </div>

        {/* Total Points */}
        <div className="mb-6">
          <span className="text-xl font-bold bg-[#b32a2a] text-white rounded-full px-4 py-2">{family.totalPoints || 0} pts</span>
        </div>

        {/* Image Grid (Placeholder) */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {/* Replace with actual image mapping */}
          <div className="bg-gray-300 aspect-square rounded"></div>
          <div className="bg-gray-300 aspect-square rounded"></div>
          <div className="bg-gray-300 aspect-square rounded"></div>
          <div className="bg-gray-300 aspect-square rounded"></div>
          <div className="bg-gray-300 aspect-square rounded"></div>
          <div className="bg-gray-300 aspect-square rounded"></div>
        </div>

        {/* Family Posts - Keep existing post creation form and list */}
        <div className="w-full max-w-2xl mx-auto">
          <h3 className="text-2xl font-bold text-[#b32a2a] mb-4">Posts</h3>
          {isMember && (
            <form onSubmit={handleCreatePost} className="my-4 flex flex-col md:flex-row gap-2">
              <input
                className="flex-1 p-2 border border-gray-300 rounded-lg"
                placeholder="Title"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                required
                disabled={postLoading}
              />
              <select
                className="p-2 border border-gray-300 rounded-lg"
                value={newType}
                onChange={e => setNewType(e.target.value)}
                required
                disabled={postLoading}
              >
                <option value="">Select type</option>
                <option value="post">Post</option>
                <option value="hangout">Hangout</option>
              </select>
              {newType === 'hangout' && (
                <input
                  className="p-2 border border-gray-300 rounded-lg"
                  type="number"
                  min="0"
                  placeholder="Point Value"
                  value={pointValue}
                  onChange={e => setPointValue(e.target.value)}
                  required
                  disabled={postLoading}
                  style={{ width: 120 }}
                />
              )}
              <textarea
                className="flex-1 p-2 border border-gray-300 rounded-lg"
                placeholder="Write a new post..."
                value={newPost}
                onChange={e => setNewPost(e.target.value)}
                required
                disabled={postLoading}
              />
              <button
                type="submit"
                className="px-6 py-2 bg-[#b32a2a] text-white rounded-lg hover:bg-[#8a1f1f] transition"
                disabled={postLoading}
              >
                {postLoading ? 'Posting...' : 'Post'}
              </button>
            </form>
          )}
          {postError && <div className="text-red-600 mb-2">{postError}</div>}
          {postsLoading ? (
            <div className="text-gray-500">Loading posts...</div>
          ) : postsError ? (
            <div className="text-red-600">{postsError}</div>
          ) : posts.length > 0 ? (
            <ul className="list-disc ml-6 mt-2">
              {posts.map(post => (
                 <li key={post._id} className="mb-2">
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
                      {editError && <div className="text-red-600">{editError}</div>}
                    </form>
                  ) : (
                    <>
                      <span className="font-bold">{post.title}</span>
                      {post.family?.name && (
                        <span className="ml-2 text-gray-600 text-sm">({post.family.name})</span>
                      )}
                      <div className="ml-2 text-gray-700">
                        {post.content}
                        {post.pointValue !== undefined && post.pointValue !== null && (
                          <span className="ml-2 text-blue-600 font-semibold">[{post.pointValue} pts]</span>
                        )}
                      </div>
                      <span className="ml-2 text-xs text-gray-400">{new Date(post.createdAt).toLocaleString()}</span>
                      {isMember && post.author?._id === currentUserId && ( // Check if current user is the author
                        <>
                          <button
                            className="ml-2 px-2 py-1 bg-yellow-300 rounded hover:bg-yellow-400 text-xs"
                            onClick={() => startEdit(post)}
                          >
                            Edit
                          </button>
                          <button
                            className="ml-2 px-2 py-1 bg-red-400 rounded hover:bg-red-500 text-xs text-white"
                            onClick={() => handleDeletePost(post._id)}
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-gray-500">No posts yet.</div>
          )}
        </div>
        <Link to="/families" className="text-[#b32a2a] underline hover:text-[#8a1f1f]">Back to Families</Link>
      </div>
    </MainLayout>
  );
}

export default FamilyDetails; 