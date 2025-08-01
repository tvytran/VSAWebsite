import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate, Navigate } from 'react-router-dom';
import api from './api';
import MainLayout from './MainLayout';
import { supabase } from './supabaseClient';
import { useAuth } from './AuthContext';
// Import placeholder image if you have one, or use a service like Lorem Picsum
// import placeholderImage from './placeholder.jpg'; 

console.log('--- Evaluating FamilyDetails.js file ---'); // Log at file evaluation level

function FamilyDetails() {
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
  const [editPointValue, setEditPointValue] = useState('');
  const [isAuthor, setIsAuthor] = useState(false);
  const [showMenuId, setShowMenuId] = useState(null);
  const [isEditingFamily, setIsEditingFamily] = useState(false);
  const [editedFamilyName, setEditedFamilyName] = useState('');
  const [selectedFamilyFile, setSelectedFamilyFile] = useState(null);
  const [familyUploadLoading, setFamilyUploadLoading] = useState(false);
  const [familyUploadError, setFamilyUploadError] = useState('');
  const [allFamilies, setAllFamilies] = useState([]);
  const [allFamiliesLoading, setAllFamiliesLoading] = useState(true);
  const [allFamiliesError, setAllFamiliesError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const navigate = useNavigate();
  const { isLoggedIn, user, loading: authLoading } = useAuth();
  const isGuest = localStorage.getItem('isGuest') === 'true';

  // Top-level async functions
  const fetchFamily = async () => {
    if (isGuest) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await api.get(`/api/families/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.data && res.data.success && res.data.family) {
         setFamily(res.data.family);
      } else {
         setError('Received unexpected family data.');
      }
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load family info.');
      setLoading(false);
    }
  };

  const fetchPosts = async () => {
    if (isGuest) return;
    setPostsLoading(true);
    setPostsError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await api.get(`/api/posts/family/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const nonAnnouncementPosts = res.data.posts.filter(post => post.type !== 'announcement');
      setPosts(nonAnnouncementPosts);
      setPostsLoading(false);
    } catch (err) {
      setPostsError('Failed to load posts.');
      setPostsLoading(false);
    }
  };

  useEffect(() => {
    if (isGuest) return;
    const fetchCurrentUser = async () => {
      try {
        if (isLoggedIn) {
          const { data: { session } } = await supabase.auth.getSession();
          const token = session?.access_token;
          const res = await api.get('/api/auth/me', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          setCurrentUser(res.data.user);
          setCurrentUserId(res.data.user.id);
        }
      } catch (err) {
        setCurrentUser(null);
        setCurrentUserId(null);
      }
    };
    fetchCurrentUser();
  }, [isLoggedIn, isGuest]);

  useEffect(() => {
    if (isGuest) return;
    const fetchAllFamilies = async () => {
      setAllFamiliesLoading(true);
      setAllFamiliesError('');
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        const res = await api.get('/api/families', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const sortedFamilies = res.data.families.sort((a, b) => a.name.localeCompare(b.name));
        setAllFamilies(sortedFamilies);
        setAllFamiliesLoading(false);
      } catch (err) {
        setAllFamiliesError('Failed to load all families.');
        setAllFamiliesLoading(false);
      }
    };
    fetchAllFamilies();
  }, [isGuest]);

  useEffect(() => {
    if (isGuest) return;
    fetchFamily();
  }, [id, isGuest]);

  useEffect(() => {
    if (isGuest) return;
    fetchPosts();
  }, [id, isGuest]);

  useEffect(() => {
    if (isGuest) return;
    if (family) {
      setEditedFamilyName(family.name);
    }
  }, [family, isGuest]);

  // Now, after all hooks, you can safely return for guest mode
  if (isGuest) return <Navigate to="/dashboard" />;

  console.log('Rendering FamilyDetails component'); // Log component render

  // Determine the index of the current family in the allFamilies array
  const currentFamilyIndex = allFamilies.findIndex(fam => fam.id === id);
  const hasPreviousFamily = currentFamilyIndex > 0;
  const hasNextFamily = currentFamilyIndex !== -1 && currentFamilyIndex < allFamilies.length - 1;

  const navigateToPreviousFamily = () => {
    if (hasPreviousFamily) {
      const previousFamilyId = allFamilies[currentFamilyIndex - 1].id;
      navigate(`/families/${previousFamilyId}`);
    }
  };

  const navigateToNextFamily = () => {
    if (hasNextFamily) {
      const nextFamilyId = allFamilies[currentFamilyIndex + 1].id;
      navigate(`/families/${nextFamilyId}`);
    }
  };

  // Helper: check if current user is a member - now depends on currentUserId state
  // The calculation will happen on each render, but currentUserId is set in useEffect
  const isMember = family && family.members && currentUserId && family.members.some(m => (m.id || m) === currentUserId);

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
      formData.append('family_picture', selectedFamilyFile);
    }

    try {
      const res = await api.put(`/api/families/${family.id}`, formData);
      console.log('Family update successful. Response data:', res.data);
      setFamily(res.data.family); // Update family state with new data
      setIsEditingFamily(false); // Exit editing mode
      setSelectedFamilyFile(null); // Clear selected file
      setFamilyUploadLoading(false);
      // Optionally show a success message
    } catch (err) {
      console.error('Family update failed:', err);
      console.error('Family update error response:', err.response);
      setFamilyUploadError(err.response?.data?.message || 'Failed to update family.');
      setFamilyUploadLoading(false);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    setPostError('');
    setPostLoading(true);
    if (!currentUserId) {
      setPostError('User not authenticated.');
      setPostLoading(false);
      return;
    }
    try {
      let payload = {
        title: newTitle,
        type: newType,
        content: newPost,
        family: family.id
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
      const res = await api.post('/api/posts', payload);
      setNewPost('');
      setNewTitle('');
      setNewType('');
      setPointValue('');
      setPostLoading(false);
      // Refresh posts
      const postsRes = await api.get(`/api/posts/family/${family.id}`);
      setPosts(postsRes.data.posts);
      await fetchFamily();
    } catch (err) {
      setPostError(err.response?.data?.message || 'Failed to create post.');
      setPostLoading(false);
    }
  };

  const startEdit = (post) => {
    setEditingPostId(post.id);
    setEditTitle(post.title);
    setEditContent(post.content);
    const isCurrentUserAuthor = post.author_id === user?.id;
    const isCurrentUserAdmin = user?.role === 'admin';

    if (post.type === 'hangout' && (isCurrentUserAuthor || isCurrentUserAdmin)) {
      setEditPointValue(post.point_value?.toString() || '');
    } else {
      setEditPointValue('');
    }
    setIsAuthor(isCurrentUserAuthor);
    setEditError('');
  };

  const cancelEdit = () => {
    setEditingPostId(null);
    setEditTitle('');
    setEditContent('');
    setEditError('');
    setEditPointValue('');
    setIsAuthor(false);
  };

  const handleEditPost = async (e) => {
    e.preventDefault();
    setEditError('');
    setEditLoading(true);

    const postToEdit = posts.find(post => post.id === editingPostId);
    if (!postToEdit) {
        setEditError('Post not found for editing.');
        setEditLoading(false);
        return;
    }

    const updatedData = {
      title: editTitle,
      content: editContent,
    };

    const isCurrentUserAdmin = user?.role === 'admin';

    if (postToEdit.type === 'hangout' && (isAuthor || isCurrentUserAdmin)) {
         const newPointValue = parseInt(editPointValue, 10);
         if (!isNaN(newPointValue) && newPointValue >= 0) {
             updatedData.pointValue = newPointValue;
         } else {
             setEditError('Invalid point value.');
             setEditLoading(false);
             return;
         }
    }

    try {
      const res = await api.put(`/api/posts/${editingPostId}`, updatedData);
      console.log('Post update successful.');
      setEditLoading(false);
      setEditingPostId(null);
      setEditTitle('');
      setEditContent('');
      setEditPointValue('');
      setIsAuthor(false);
      const postsRes = await api.get(`/api/posts/family/${family.id}`);
      setPosts(postsRes.data.posts);
      await fetchFamily();
    } catch (err) {
      console.error('Error updating post:', err);
      setEditError(err.response?.data?.message || 'Failed to edit post.');
      setEditLoading(false);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      await api.delete(`/api/posts/${postId}`);
      // After successful deletion, re-fetch family data
      fetchFamily();
      // Optionally, re-fetch posts if you have a separate fetchPosts function
      if (typeof fetchPosts === 'function') fetchPosts();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete post.');
    }
  };

  // Handle family deletion
  const handleDeleteFamily = async () => {
    if (!window.confirm('Are you sure you want to delete this family? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/api/families/${id}`);

      alert('Family deleted successfully.');
      navigate('/families'); // Redirect to the families list page

    } catch (err) {
      console.error('Error deleting family:', err);
      alert(err.response?.data?.message || 'Failed to delete family.');
    }
  };

  const truncateText = (text) => {
    // Regex to find raw URLs
    const urlRegex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/|=~_|])/gi;
    // Regex to find markdown links [text](url)
    const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;

    const renderTextWithLinks = (contentText) => {
      const elements = [];
      let lastIndex = 0;

      let match;
      // First find markdown links
      while ((match = markdownLinkRegex.exec(contentText)) !== null) {
        const precedingText = contentText.substring(lastIndex, match.index);
        // Process preceding text for raw URLs
        if (precedingText) {
          const urlParts = precedingText.split(urlRegex);
          urlParts.forEach((part, index) => {
            if (part.match(urlRegex)) { // Check if the part is a URL
              elements.push(<a key={`url-${lastIndex}-${index}`} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{part}</a>);
            } else {
              elements.push(<span key={`text-${lastIndex}-${index}`}>{part}</span>);
            }
          });
        }

        // Add the markdown link
        const linkText = match[1];
        const linkUrl = match[2];
        elements.push(<a key={`markdown-${match.index}`} href={linkUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{linkText}</a>);

        lastIndex = markdownLinkRegex.lastIndex;
      }

      // Process any remaining text for raw URLs
      const remainingText = contentText.substring(lastIndex);
      if (remainingText) { // Check if remainingText is not empty
          const urlParts = remainingText.split(urlRegex);
          urlParts.forEach((part, index) => {
            if (part.match(urlRegex)) { // Check if the part is a URL
              elements.push(<a key={`url-end-${lastIndex}-${index}`} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{part}</a>);
            } else {
              elements.push(<span key={`text-end-${lastIndex}-${index}`}>{part}</span>);
            }
          });
      }

      return elements;
    };

    // Always render full text with links, no truncation
    return renderTextWithLinks(text);
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
        {/* Navigation Arrows */}
        <div className="flex justify-between items-center mb-4">
          <button 
            className={`text-3xl text-[#b32a2a] ${hasPreviousFamily ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
            onClick={navigateToPreviousFamily}
            disabled={!hasPreviousFamily}
          >
            {'<'}
          </button>
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
          <button 
            className={`text-3xl text-[#b32a2a] ${hasNextFamily ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
            onClick={navigateToNextFamily}
            disabled={!hasNextFamily}
          >
            {'>'}
          </button>
        </div>

        {/* Edit Profile Button - Visible to members */}
        {!isEditingFamily && isMember && (
          <div className="mb-4">
            <button
              onClick={() => setIsEditingFamily(true)}
              className="bg-[#b32a2a] hover:bg-[#8a1f1f] text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-200 ease-in-out"
            >
              Edit Profile
            </button>
          </div>
        )}

        {/* Family Image */}
        <div className="mb-6">
          {isEditingFamily ? (
            <div className="flex flex-col items-center">
               {/* Image Preview or Placeholder */}
              {(selectedFamilyFile || family.family_picture) ? (
                <img 
                  src={selectedFamilyFile ? URL.createObjectURL(selectedFamilyFile) : `${family.family_picture}?v=${new Date().getTime()}`}
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
            (family.family_picture ? (
              <img src={`${family.family_picture}?v=${new Date().getTime()}`} alt="Family" className="w-48 h-48 object-cover rounded-full mx-auto mb-4 border-4 border-[#b32a2a]" />
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
              <span key={member.id || member}>
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
          <span className="text-xl font-bold bg-[#b32a2a] text-white rounded-full px-4 py-2">{family.total_points ?? 0} pts</span>
          <span className="text-xl font-bold bg-[#b32a2a] text-white rounded-full px-4 py-2">Semester Points: {family.semester_points ?? 0} pts</span>
        </div>

        {/* Family Post Images Grid */}
        {posts.some(post => post.image_path) && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            {posts.map(post => (
              post.image_path && post.author_id && (
                <div 
                  key={post.id} 
                  className="aspect-square rounded overflow-hidden bg-gray-200 cursor-pointer hover:opacity-90 transition-opacity duration-200 relative"
                  onClick={() => navigate(`/post/${post.id}`)}
                >
                  <img
                    src={post.image_path}
                    alt="Family Post Image"
                    className="w-full h-full object-cover"
                  />
                  {/* Author Profile Picture Overlay */}
                  <div className="absolute bottom-2 right-2 w-8 h-8 rounded-full overflow-hidden border-2 border-white shadow-md">
                    {post.author_id.profile_picture ? (
                      <img 
                        src={post.author_id.profile_picture}
                        alt={post.author_id.username} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-[#b32a2a] flex items-center justify-center text-white text-xs font-bold">
                        {post.author_id.username?.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>
              )
            ))}
          </div>
        )}

        <Link to="/families" className="text-[#b32a2a] underline hover:text-[#8a1f1f]">Back to Families</Link>
      </div>
    </MainLayout>
  );
}

export default FamilyDetails; 