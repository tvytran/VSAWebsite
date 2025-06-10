import React, { useEffect, useState, useRef } from 'react';
import api from './api';
import MainLayout from './MainLayout';
import { Link, useLocation } from 'react-router-dom';
import { HeartIcon as HeartOutline, ChatBubbleOvalLeftIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid';
// import { PlusCircleIcon } from '@heroicons/react/24/solid'; // Temporarily remove icon import

function DashboardHome() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  
  const isLoggedIn = !!localStorage.getItem('token');
  const isGuest = localStorage.getItem('isGuest') === 'true';
  const location = useLocation(); // Get the current location

  // State for editing
  const [editingPostId, setEditingPostId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editError, setEditError] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editPointValue, setEditPointValue] = useState('');
  const [isAuthor, setIsAuthor] = useState(false);

  // State for controlling the visibility of the three dots menu
  const [showMenuId, setShowMenuId] = useState(null);

  // State for search functionality
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredPosts, setFilteredPosts] = useState([]);

  const [expandedPosts, setExpandedPosts] = useState({});

  const [commentText, setCommentText] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentError, setCommentError] = useState('');

  const commentInputRefs = useRef({});

  const fetchPosts = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const userFromStorage = JSON.parse(localStorage.getItem('user') || '{}');
      
      let postsUrl = '/api/posts/feed'; // Default for regular users

      // If user is admin, fetch all posts
      if (userFromStorage && userFromStorage.role === 'admin') {
          postsUrl = '/api/posts/all';
      }

      console.log('Fetching posts from:', postsUrl); // Debug log
      const res = await api.get(postsUrl, {
        headers: { 'x-auth-token': token }
      });
      
      if (!res.data || !res.data.posts) {
        throw new Error('Invalid response format from server');
      }

      // Ensure posts are sorted by creation date descending
      const sortedPosts = res.data.posts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setPosts(sortedPosts || []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching posts:', err); // Debug log
      setError(err.response?.data?.message || err.message || 'Failed to load posts. Please try again later.');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      // Fetch user data
      const fetchUserData = async () => {
        try {
          const token = localStorage.getItem('token');
          const res = await api.get('/api/auth/me', {
            headers: { 'x-auth-token': token }
          });
          setUser(res.data.user);
        } catch (err) {
          console.error('Failed to fetch user data:', err);
          // Optionally clear token if invalid
          localStorage.removeItem('token');
          window.location.reload();
        }
      };
      fetchUserData();
      fetchPosts();
    } else {
      setLoading(false);
      setPosts([]);
    }
  }, [isLoggedIn, location.pathname]); // Add location.pathname as a dependency

  // Effect to filter posts whenever posts or searchTerm changes
  useEffect(() => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    const filtered = posts.filter(post => 
      post.title.toLowerCase().includes(lowerCaseSearchTerm) ||
      post.content.toLowerCase().includes(lowerCaseSearchTerm) ||
      post.author.username?.toLowerCase().includes(lowerCaseSearchTerm)
    );
    setFilteredPosts(filtered);
  }, [posts, searchTerm]);

   const startEdit = (post) => {
    setEditingPostId(post.id);
    setEditTitle(post.title);
    setEditContent(post.content);
    const currentUser = JSON.parse(localStorage.getItem('user'));
    const isCurrentUserAuthor = post.author.id === currentUser?.id;
    const isCurrentUserAdmin = currentUser?.role === 'admin';

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

  const handleEditPost = async (e, postId) => {
    e.preventDefault();
    setEditError('');
    setEditLoading(true);

    try {
      // Fetch the latest post data from the backend
      const token = localStorage.getItem('token');
      const res = await api.get(`/api/posts/${postId}`, {
        headers: { 'x-auth-token': token }
      });
      const postToEdit = res.data.post; // Use the fresh post data

      if (!postToEdit) {
        // This case should ideally not happen if the GET was successful, but good for safety
        setEditError('Could not retrieve post details for editing.');
        setEditLoading(false);
        return;
      }

      // Re-check authorization based on the fresh post data
      const currentUser = JSON.parse(localStorage.getItem('user'));
      const isCurrentUserAuthor = postToEdit.author.id === currentUser?.id;
      const isCurrentUserAdmin = currentUser?.role === 'admin';

      if (!isCurrentUserAuthor && !isCurrentUserAdmin) {
          setEditError('You are not authorized to edit this post.');
          setEditLoading(false);
          return;
      }

      const updatedData = {
        title: editTitle,
        content: editContent,
      };

      if (postToEdit.type === 'hangout' && (isCurrentUserAuthor || isCurrentUserAdmin)) {
        const newPointValue = parseInt(editPointValue, 10);
        if (!isNaN(newPointValue) && newPointValue >= 0) {
          updatedData.pointValue = newPointValue;
        } else {
          setEditError('Invalid point value.');
          setEditLoading(false);
          return;
        }
      }

      // Proceed with the PUT request to update the post
      await api.put(`/api/posts/${postId}`, updatedData, {
        headers: { 'x-auth-token': token }
      });

      setEditLoading(false);
      setEditingPostId(null);
      setEditTitle('');
      setEditContent('');
      setEditPointValue('');
      setIsAuthor(false);

      // Refresh the posts list after successful edit
      fetchPosts();

    } catch (err) {
      console.error('Error during post edit:', err.response?.data?.message || err.message);
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
      // After successful deletion, refetch posts based on user role
      const userFromStorage = JSON.parse(localStorage.getItem('user') || '{}');
      let postsUrl = '/api/posts/feed';
       if (userFromStorage && userFromStorage.role === 'admin') {
           postsUrl = '/api/posts/all';
       }

      const res = await api.get(postsUrl, {
        headers: { 'x-auth-token': token }
      });
      const sortedPosts = res.data.posts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setPosts(sortedPosts || []);

    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete post.');
    }
  };

  const toggleExpand = (id) => {
    setExpandedPosts(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const truncateText = (text, id) => {
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

  const handleLike = async (postId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await api.put(`/api/posts/like/${postId}`, {}, {
        headers: { 'x-auth-token': token }
      });
      if (res.data.success) {
        setPosts(posts.map(post =>
          post.id === postId
            ? { ...post, likes: res.data.likes }
            : post
        ));
      }
    } catch (err) {
      console.error('Error liking post:', err);
    }
  };

  const handleUnlike = async (postId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await api.put(`/api/posts/unlike/${postId}`, {}, {
        headers: { 'x-auth-token': token }
      });
      if (res.data.success) {
        setPosts(posts.map(post =>
          post.id === postId
            ? { ...post, likes: res.data.likes }
            : post
        ));
      }
    } catch (err) {
      console.error('Error unliking post:', err);
    }
  };

  const handleComment = async (postId, e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setCommentLoading(true);
    setCommentError('');
    try {
      const token = localStorage.getItem('token');
      const res = await api.post(`/api/posts/comment/${postId}`, 
        { text: commentText },
        { headers: { 'x-auth-token': token } }
      );
      if (res.data.success) {
        // Update the post in the local state
        setPosts(posts.map(post => 
          post.id === postId 
            ? { ...post, comments: res.data.comments }
            : post
        ));
        setCommentText('');
      }
    } catch (err) {
      setCommentError(err.response?.data?.message || 'Failed to add comment');
    } finally {
      setCommentLoading(false);
    }
  };

  return (
    <MainLayout>
      {/* Welcome Message for Logged-in Users */}
      {isLoggedIn && user && (
        <div className="w-full max-w-2xl text-center mb-6">
          <h2 className="text-2xl font-bold text-[#b32a2a] mb-4">Welcome, {user.username}!</h2>
          <p className="text-gray-700 mb-4">Check out the latest posts from your family and the VSA community.</p>
        </div>
      )}

      {/* Guest Welcome Section */}
      {!isLoggedIn && !isGuest && (
        <div className="w-full max-w-2xl text-center mb-6">
          <h2 className="text-2xl font-bold text-[#b32a2a] mb-4">Welcome!</h2>
          <p className="text-gray-700 mb-4">
            Please log in or register to access all features.
          </p>
          <div className="flex justify-center space-x-4">
            <Link to="/login" className="px-6 py-3 bg-[#b32a2a] text-white rounded-lg hover:bg-[#8a1f1f] transition font-semibold text-lg">Login</Link>
            <Link to="/register" className="px-6 py-3 bg-[#b32a2a] text-white rounded-lg hover:bg-[#8a1f1f] transition font-semibold text-lg">Register</Link>
             <button 
              onClick={() => {
                localStorage.setItem('isGuest', 'true');
                window.location.reload();
              }}
              className="px-6 py-3 bg-[#b32a2a] text-white rounded-lg hover:bg-[#8a1f1f] transition font-semibold text-lg"
            >
              Continue as Guest
            </button>
          </div>
        </div>
      )}

       {/* Guest View Content */}
       {isGuest && (
        <>
          <div className="w-full max-w-2xl text-center mb-6">
            <h2 className="text-2xl font-bold text-[#b32a2a] mb-4">Welcome, Guest!</h2>
            <p className="text-gray-700 mb-4">Explore the VSA community and see what we're all about.</p>
            <div className="mt-4 text-gray-600">
              <p>Want to join the VSA community?</p>
              <div className="flex justify-center space-x-4 mt-2">
                <Link to="/login" className="px-6 py-3 bg-white border-2 border-[#b32a2a] text-[#b32a2a] rounded-lg hover:bg-[#f5e6d6] transition font-semibold text-lg">Login</Link>
                <Link to="/register" className="px-6 py-3 bg-white border-2 border-[#b32a2a] text-[#b32a2a] rounded-lg hover:bg-[#f5e6d6] transition font-semibold text-lg">Register</Link>
              </div>
            </div>
          </div>

          {/* Placeholder Posts for Guest View */}
          <div className="w-full max-w-2xl space-y-6">
            {/* Placeholder Post 1 */}
            <div className="bg-gray-100 rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                <div className="ml-3">
                  <div className="h-4 w-24 bg-gray-300 rounded"></div>
                  <div className="h-3 w-32 bg-gray-200 rounded mt-2"></div>
                </div>
              </div>
              <div className="h-6 w-3/4 bg-gray-300 rounded mb-3"></div>
              <div className="space-y-2">
                <div className="h-4 w-full bg-gray-200 rounded"></div>
                <div className="h-4 w-5/6 bg-gray-200 rounded"></div>
                <div className="h-4 w-4/6 bg-gray-200 rounded"></div>
              </div>
            </div>

            {/* Placeholder Post 2 */}
            <div className="bg-gray-100 rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                <div className="ml-3">
                  <div className="h-4 w-24 bg-gray-300 rounded"></div>
                  <div className="h-3 w-32 bg-gray-200 rounded mt-2"></div>
                </div>
              </div>
              <div className="h-6 w-3/4 bg-gray-300 rounded mb-3"></div>
              <div className="space-y-2">
                <div className="h-4 w-full bg-gray-200 rounded"></div>
                <div className="h-4 w-5/6 bg-gray-200 rounded"></div>
              </div>
            </div>

            {/* Placeholder Post 3 */}
            <div className="bg-gray-100 rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                <div className="ml-3">
                  <div className="h-4 w-24 bg-gray-300 rounded"></div>
                  <div className="h-3 w-32 bg-gray-200 rounded mt-2"></div>
                </div>
              </div>
              <div className="h-6 w-3/4 bg-gray-300 rounded mb-3"></div>
              <div className="space-y-2">
                <div className="h-4 w-full bg-gray-200 rounded"></div>
                <div className="h-4 w-5/6 bg-gray-200 rounded"></div>
                <div className="h-4 w-4/6 bg-gray-200 rounded"></div>
              </div>
            </div>

            {/* Login Prompt */}
            <div className="text-center py-6">
              <p className="text-gray-600 mb-4">Log in to see the full post feed and interact with the community</p>
              <div className="flex justify-center space-x-4">
                <Link to="/login" className="px-6 py-3 bg-[#b32a2a] text-white rounded-lg hover:bg-[#8a1f1f] transition font-semibold text-lg">Login</Link>
                <Link to="/register" className="px-6 py-3 bg-white border-2 border-[#b32a2a] text-[#b32a2a] rounded-lg hover:bg-[#f5e6d6] transition font-semibold text-lg">Register</Link>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Search Bar */}
      {isLoggedIn && (
        <div className="w-full max-w-2xl flex items-center mb-6 relative">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search posts by title, content, or author..."
              className="w-full border-2 border-[#b32a2a] rounded-lg px-4 py-3 pl-10 text-lg focus:outline-none focus:border-[#8a1f1f] focus:ring-2 focus:ring-[#b32a2a] focus:ring-opacity-50 transition-all duration-200"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-[#b32a2a]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}

      {isLoggedIn ? (
        <div className="w-full max-w-2xl mx-auto">
          {loading ? (
            <div className="text-center text-[#b32a2a] text-lg py-8">Loading posts...</div>
          ) : error ? (
            <div className="text-center text-red-600 text-lg py-8">{error}</div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center text-gray-600 text-lg py-8">{searchTerm ? 'No posts match your search.' : 'No posts yet.'}</div>
          ) : (
            <div className="space-y-4">
              {filteredPosts.map(post => (
                <div 
                  key={post.id} 
                  className={`rounded-lg shadow-sm p-3 hover:shadow-md transition-shadow duration-200 ${
                    post.type === 'announcement' ? 'bg-red-100 border-4 border-solid border-[#b32a2a]' : 'bg-white border border-gray-200'
                  }`}
                >
                  {post.image_path && (
                    <div className="mb-3">
                      <img 
                        src={post.image_path}
                        alt="Post" 
                        className="w-full h-96 object-contain rounded-t-lg" 
                      />
                    </div>
                  )}
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 rounded-full overflow-hidden mr-3">
                      {post.author.profile_picture ? (
                        <img 
                          src={post.author.profile_picture}
                          alt={post.author.username} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-[#b32a2a] flex items-center justify-center text-white font-bold">
                          {post.author.username?.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">
                        {post.author.username}
                        {post.family.name && (
                          <span className="ml-2 text-gray-600 text-sm">({post.family.name})</span>
                        )}
                        {post.type === 'announcement' && (
                          <span className="ml-2 text-[#b32a2a] font-bold">(Admin)</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">{new Date(post.created_at).toLocaleString()}</div>
                    </div>

                    {/* Three dots menu for edit/delete - visible only to author */}
                    {isLoggedIn && (user?.id === post.author.id || user?.role === 'admin') && (
                      <div className="ml-auto relative">
                        <button
                          onClick={() => setShowMenuId(showMenuId === post.id ? null : post.id)}
                          className="text-gray-500 hover:text-gray-700 focus:outline-none z-10"
                        >
                          &#8226;&#8226;&#8226;
                        </button>
                        {showMenuId === post.id && (
                          <div className="absolute top-0 right-0 mt-6 w-48 bg-white rounded-md shadow-lg z-10">
                            <button
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              onClick={() => {
                                startEdit(post);
                                setShowMenuId(null);
                              }}
                            >
                              Edit
                            </button>
                            <button
                              className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                              onClick={() => {
                                handleDeletePost(post.id);
                                setShowMenuId(null);
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Conditional rendering for Edit Form or Post Content */}
                  {editingPostId === post.id ? (
                    <form onSubmit={(e) => handleEditPost(e, post.id)} className="mb-2 flex flex-col gap-2">
                      <input
                        className="p-2 border border-gray-300 rounded-lg"
                        value={editTitle}
                        onChange={e => setEditTitle(e.target.value)}
                        required
                        disabled={editLoading}
                        placeholder="Edit Title"
                      />
                      <textarea
                        className="p-2 border border-gray-300 rounded-lg"
                        value={editContent}
                        onChange={e => setEditContent(e.target.value)}
                        required
                        disabled={editLoading}
                        placeholder="Edit Content"
                        rows={10}
                      />
                      {post.type === 'hangout' && (isAuthor || JSON.parse(localStorage.getItem('user'))?.role === 'admin') && (
                        <input
                          type="number"
                          className="p-2 border border-gray-300 rounded-lg"
                          value={editPointValue}
                          onChange={e => setEditPointValue(e.target.value)}
                          required
                          disabled={editLoading}
                          min="0"
                          placeholder="Point Value"
                        />
                      )}
                      <div className="flex gap-2">
                        <button type="submit" className="px-4 py-1 bg-[#b32a2a] text-white rounded-lg hover:bg-[#8a1f1f] transition duration-200 ease-in-out" disabled={editLoading}>
                          {editLoading ? 'Saving...' : 'Save'}
                        </button>
                        <button type="button" className="px-4 py-1 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition duration-200 ease-in-out" onClick={cancelEdit} disabled={editLoading}>
                          Cancel
                        </button>
                      </div>
                      {editError && <div className="text-red-600 mt-2">{editError}</div>}
                    </form>
                  ) : (
                    <>
                      <h3 className={`text-lg font-bold mb-2 ${post.type === 'announcement' ? 'text-[#b32a2a]' : 'text-gray-800'}`}>
                        {post.title}
                      </h3>
                      <div className="text-gray-700 mb-2">
                        {truncateText(post.content, post.id)}
                        {post.point_value > 0 && (
                          <span className="ml-2 text-green-600 font-semibold">[{post.point_value} pts]</span>
                        )}
                      </div>
                    </>
                  )}

                  {/* Instagram-style Like and Comment Row */}
                  <div className="flex items-center gap-6 mt-3 mb-2">
                    {/* Like Button */}
                    <button
                      onClick={() => {
                        const hasLiked = post.likes?.some(like => like.user === user?.id);
                        if (hasLiked) {
                          handleUnlike(post.id);
                        } else {
                          handleLike(post.id);
                        }
                      }}
                      className="flex items-center group"
                      aria-label="Like"
                    >
                      {post.likes?.some(like => like.user === user?.id) ? (
                        <HeartSolid className="w-6 h-6 text-[#b32a2a] transition" />
                      ) : (
                        <HeartOutline className="w-6 h-6 text-gray-700 group-hover:text-[#b32a2a] transition" />
                      )}
                      <span className="ml-2 text-sm text-gray-700">{post.likes?.length || 0}</span>
                    </button>

                    {/* Comment Button */}
                    <button
                      onClick={() => {
                        if (commentInputRefs.current[post.id]) {
                          commentInputRefs.current[post.id].focus();
                        }
                      }}
                      className="flex items-center group"
                      aria-label="Comment"
                    >
                      <ChatBubbleOvalLeftIcon className="w-6 h-6 text-gray-700 group-hover:text-[#b32a2a] transition" />
                      <span className="ml-2 text-sm text-gray-700">{post.comments?.length || 0}</span>
                    </button>
                  </div>

                  {/* Comments Section */}
                  <div className="space-y-3">
                    {/* Comment List */}
                    {post.comments?.length > 0 && (
                      <div className="space-y-2">
                        {post.comments.map((comment, index) => (
                          <div key={index} className="bg-gray-50 rounded-lg p-2">
                            <div className="flex items-center gap-2 mb-1">
                              {/* Profile picture as a small circle, Instagram-style */}
                              <div className="w-6 h-6 rounded-full overflow-hidden bg-[#b32a2a] flex items-center justify-center">
                                {comment.avatar ? (
                                  <img src={comment.avatar} alt={comment.name} className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-white text-xs font-bold">{comment.name?.charAt(0).toUpperCase()}</span>
                                )}
                              </div>
                              <span className="font-semibold text-sm">{comment.name}</span>
                              <span className="text-xs text-gray-500">
                                {comment.date ? new Date(comment.date).toLocaleString() : ''}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 ml-8">{comment.text}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Comment Form */}
                    {isLoggedIn && (
                      <form onSubmit={(e) => handleComment(post.id, e)} className="flex gap-2">
                        <input
                          type="text"
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          placeholder="Write a comment..."
                          className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#b32a2a] focus:border-transparent"
                          disabled={commentLoading}
                          ref={el => (commentInputRefs.current[post.id] = el)}
                        />
                        <button
                          type="submit"
                          disabled={commentLoading || !commentText.trim()}
                          className="px-4 py-2 bg-[#b32a2a] text-white rounded-lg hover:bg-[#8a1f1f] transition duration-200 disabled:opacity-50"
                        >
                          {commentLoading ? 'Posting...' : 'Post'}
                        </button>
                      </form>
                    )}
                    {commentError && <div className="text-red-600 text-sm mt-1">{commentError}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="w-full max-w-2xl text-center">
          <p className="text-gray-600 text-lg">
            {isGuest 
              ? "Login to see the full post feed and interact with the community."
              : "Please log in to see the full post feed."}
          </p>
        </div>
      )}

      {/* Floating Create Post Button */}
      {isLoggedIn && (
        <div className="fixed bottom-8 right-1/2 translate-x-[calc(50%+max(0px,calc((100vw-32rem)/2))-6rem)]">
          <Link 
            to="/create-post"
            className="flex items-center justify-center gap-2 bg-[#b32a2a] text-white p-4 rounded-full shadow-lg hover:bg-[#8a1f1f] transition duration-200 ease-in-out"
            aria-label="Create Post"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </Link>
        </div>
      )}
    </MainLayout>
  );
}

export default DashboardHome; 