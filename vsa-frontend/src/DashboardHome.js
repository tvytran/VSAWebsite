import React, { useEffect, useState, useRef } from 'react';
import api from './api';
import MainLayout from './MainLayout';
import { Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { HeartIcon as HeartOutline, ChatBubbleOvalLeftIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid';
// import { PlusCircleIcon } from '@heroicons/react/24/solid'; // Temporarily remove icon import
import { useAuth } from './AuthContext';
import { supabase } from './supabaseClient';

function DashboardHome() {
  // All hooks at the top
  const { isLoggedIn, user, loading } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [error, setError] = useState('');
  const [editingPostId, setEditingPostId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editError, setEditError] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editPointValue, setEditPointValue] = useState('');
  const [isAuthor, setIsAuthor] = useState(false);
  const [showMenuId, setShowMenuId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [expandedPosts, setExpandedPosts] = useState({});
  const [commentStates, setCommentStates] = useState({});
  const [showCommentForms, setShowCommentForms] = useState({});
  const [editingComment, setEditingComment] = useState(null);
  const [commentLoading, setCommentLoading] = useState({});
  const [commentError, setCommentError] = useState({});
  const commentInputRefs = useRef({});
  const [families, setFamilies] = useState([]);
  const [familySearchTerm, setFamilySearchTerm] = useState('');
  const [filteredFamilies, setFilteredFamilies] = useState([]);
  const [showFamilySearch, setShowFamilySearch] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isGuest = localStorage.getItem('isGuest') === 'true';

  const decodeHtml = (str) => {
    if (typeof window === 'undefined' || !str) return str || '';
    const txt = document.createElement('textarea');
    txt.innerHTML = str;
    return txt.value;
  };

  // Guest mode: login button handler
  const handleGuestLogin = () => {
    localStorage.removeItem('isGuest');
    navigate('/login');
  };


  // debug removed
  const fetchPublicPosts = async () => {
    setLoadingPosts(true);
    setError('');
    try {
      const res = await api.get('/api/posts/public');
      if (!res.data || !res.data.posts) {
        throw new Error('Invalid response format from server');
      }
      const sortedPosts = res.data.posts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setPosts(sortedPosts.slice(0, 5)); // Only top 5
      setLoadingPosts(false);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load posts. Please try again later.');
      setLoadingPosts(false);
    }
  };

  // All useEffect and other hooks must be before any return
  useEffect(() => {
    if (isGuest) {
      fetchPublicPosts();
    } else if (isLoggedIn) {
      fetchPosts();
    } else {
      setLoadingPosts(false);
      setPosts([]);
    }
  }, [isLoggedIn, isGuest, location.pathname]);

  useEffect(() => {
    if (!isLoggedIn) return;
    const fetchFamilies = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        const res = await api.get('/api/families', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.data.success) {
          setFamilies(res.data.families || []);
        }
      } catch (err) {
        // Optionally handle error
      }
    };
    fetchFamilies();
  }, [isLoggedIn]);

  useEffect(() => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    const filteredPosts = posts.filter(post => 
      post.title.toLowerCase().includes(lowerCaseSearchTerm) ||
      post.content.toLowerCase().includes(lowerCaseSearchTerm) ||
      post.author.username?.toLowerCase().includes(lowerCaseSearchTerm) ||
      (post.family?.name && post.family.name.toLowerCase().includes(lowerCaseSearchTerm))
    );
    setFilteredPosts(filteredPosts);
    const filteredFamilies = families.filter(family => 
      family.name.toLowerCase().includes(lowerCaseSearchTerm)
    );
    setFilteredFamilies(filteredFamilies);
    setShowSearchResults(lowerCaseSearchTerm.length > 0);
  }, [posts, families, searchTerm]);

  // Now do conditional rendering
  if (loading) return null;
  if (!isLoggedIn && !isGuest) return <Navigate to="/login" />;

  const fetchPosts = async () => {
    setLoadingPosts(true);
    setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        setError('No authentication token found. Please log in.');
        setLoadingPosts(false);
        return;
      }
      const res = await api.get('/api/posts/feed', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.data || !res.data.posts) {
        throw new Error('Invalid response format from server');
      }
      const sortedPosts = res.data.posts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setPosts(sortedPosts || []);
      setLoadingPosts(false);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load posts. Please try again later.');
      setLoadingPosts(false);
    }
  };

  const startEdit = (post) => {
    setEditingPostId(post.id);
    setEditTitle(post.title);
    setEditContent(decodeHtml(post.content));
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
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
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
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      await api.delete(`/api/posts/${postId}`, {
        headers: { 'x-auth-token': token }
      });
      setPosts(prev => prev.filter(p => p.id !== postId));
    } catch (err) {
      console.error('Error deleting post:', err);
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

    // Preserve line breaks similar to Instagram
    const safeText = decodeHtml(text || '');
    const lines = String(safeText).split('\n');
    return (
      <>
        {lines.map((line, i) => (
          <React.Fragment key={`ln-${id}-${i}`}>
            {renderTextWithLinks(line)}
            {i < lines.length - 1 && <br />}
          </React.Fragment>
        ))}
      </>
    );
  };

  const handleLike = async (postId) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const post = posts.find(p => p.id === postId);
      const isLiked = post.likes?.some(like => like.user === user?.id);
      const endpoint = isLiked ? 'unlike' : 'like';
      
      const res = await api.put(`/api/posts/${endpoint}/${postId}`, {}, {
        headers: { 'x-auth-token': token }
      });
      
      if (res.data.success) {
        setPosts(prev => prev.map(p => 
          p.id === postId ? { ...p, likes: res.data.likes } : p
        ));
      }
    } catch (err) {
      console.error('Error liking/unliking post:', err);
    }
  };

  const handleComment = async (e, postId) => {
    e.preventDefault();
    
    const commentText = commentStates[postId]?.trim();
    if (!commentText) return;

    setCommentLoading(true);
    setCommentError('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await api.post(`/api/posts/comment/${postId}`, 
        { text: commentText },
        { headers: { 'x-auth-token': token } }
      );
      
      if (res.data.success) {
        setPosts(prev => prev.map(p => 
          p.id === postId ? { ...p, comments: res.data.comments } : p
        ));
        setCommentStates(prev => ({ ...prev, [postId]: '' }));
      }
    } catch (err) {
      setCommentError(err.response?.data?.message || 'Failed to add comment');
    } finally {
      setCommentLoading(false);
    }
  };

  const handleEditComment = async (postId, commentId, newText) => {
    if (!newText.trim()) return;

    setCommentLoading(prev => ({ ...prev, [postId]: true }));
    setCommentError(prev => ({ ...prev, [postId]: '' }));

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await api.put(`/api/posts/comment/${postId}/${commentId}`, 
        { text: newText },
        { headers: { 'x-auth-token': token } }
      );
      
      if (res.data.success) {
        setPosts(posts.map(post => 
          post.id === postId 
            ? { ...post, comments: res.data.comments }
            : post
        ));
        setEditingComment(null);
        setCommentStates(prev => ({
          ...prev,
          [`edit-${commentId}`]: ''
        }));
      }
    } catch (err) {
      setCommentError(prev => ({ 
        ...prev, 
        [postId]: err.response?.data?.message || 'Failed to edit comment' 
      }));
    } finally {
      setCommentLoading(prev => ({ ...prev, [postId]: false }));
    }
  };

  const handleDeleteComment = async (postId, commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    setCommentLoading(prev => ({ ...prev, [postId]: true }));
    setCommentError(prev => ({ ...prev, [postId]: '' }));

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await api.delete(`/api/posts/comment/${postId}/${commentId}`, {
        headers: { 'x-auth-token': token }
      });
      
      if (res.data.success) {
        setPosts(posts.map(post => 
          post.id === postId 
            ? { ...post, comments: res.data.comments }
            : post
        ));
      }
    } catch (err) {
      setCommentError(prev => ({ 
        ...prev, 
        [postId]: err.response?.data?.message || 'Failed to delete comment' 
      }));
    } finally {
      setCommentLoading(prev => ({ ...prev, [postId]: false }));
    }
  };

  const handlePostClick = (postId) => {
    navigate(`/post/${postId}`);
  };

  const getAuthorInitial = (author) => {
    if (typeof author === 'string') {
      return author.charAt(0).toUpperCase();
    }
    if (author?.username) {
      return author.username.charAt(0).toUpperCase();
    }
    return '?';
  };

  const getAuthorName = (author) => {
    if (typeof author === 'string') {
      return author;
    }
    if (author?.username) {
      return author.username;
    }
    return 'Unknown User';
  };

  const handleCommentClick = (postId) => {
    setShowCommentForms(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  return (
    <MainLayout>
      {/* Welcome Message for Logged-in Users */}
      {isLoggedIn && user && (
        <div className="w-full max-w-2xl text-center mb-4 pt-4">
          <h2 className="text-2xl font-bold text-[#b32a2a] mb-4">Welcome, {user.username}!</h2>
          <p className="text-gray-700 mb-4">Check out the latest posts from your family and the VSA community.</p>
        </div>
      )}

      {/* Welcome Message for Guests */}
      {!isLoggedIn && (
        <div className="w-full max-w-2xl text-center mb-6">
          <h2 className="text-2xl font-bold text-[#b32a2a] mb-4">Welcome, Guest!</h2>
          <p className="text-gray-700 mb-4">Explore the VSA community and see what we're all about.</p>
          <div className="bg-gray-100 border border-gray-200 rounded-lg p-4 mb-4">
            <p className="text-gray-800 mb-3">Want to join the conversation? Register to like, comment, and create posts!</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleGuestLogin}
                className="px-4 py-2 bg-[#b32a2a] text-white rounded-lg hover:bg-[#8a1f1f] transition duration-200"
              >
                Register Now
              </button>
              <button
                onClick={handleGuestLogin}
                className="px-4 py-2 bg-white border-2 border-[#b32a2a] text-[#b32a2a] rounded-lg hover:bg-[#f5e6d6] transition duration-200"
              >
                Login
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search Bar */}
      {isLoggedIn && user && (
      <div className="w-full max-w-2xl flex items-center mb-4 relative sticky top-0 z-30 bg-[#faecd8] py-2" style={{position:'sticky'}}>
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search posts, families, or authors..."
            className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 pl-10 text-lg focus:outline-none focus:border-[#b32a2a] focus:ring-2 focus:ring-[#b32a2a] focus:ring-opacity-30 transition-all duration-200"
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
              onClick={() => {
                setSearchTerm('');
                setShowSearchResults(false);
              }}
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

      {/* Search Results */}
      {showSearchResults && (
        <div className="w-full max-w-2xl mb-6">
          <div className="bg-white rounded-lg shadow-md p-4">
            {/* Family Results */}
            {filteredFamilies.length > 0 && (
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-[#b32a2a] mb-3">Families</h3>
                <div className="space-y-3">
                  {filteredFamilies.map(family => (
                    <Link
                      key={family.id}
                      to={`/families/${family.id}`}
                      className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium text-gray-900">{family.name}</h4>
                          <p className="text-sm text-gray-500">
                            {family.members?.length || 0} members • {family.total_points || 0} points
                          </p>
                        </div>
                        <span className="text-[#b32a2a]">→</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Post Results */}
            {filteredPosts.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-[#b32a2a] mb-3">Posts</h3>
                <div className="space-y-3">
                  {filteredPosts.map(post => (
                    <div 
                      key={post.id} 
                      className="p-3 bg-gray-50 rounded-lg flex justify-between items-center cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handlePostClick(post.id)}
                    >
                      <div>
                        <div className="flex items-center mb-2">
                          <div className="w-8 h-8 rounded-full overflow-hidden mr-2">
                            {post.author?.profile_picture ? (
                              <img 
                                src={post.author.profile_picture}
                                alt={getAuthorName(post.author)} 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-[#b32a2a] flex items-center justify-center text-white text-xs font-bold">
                                {getAuthorInitial(post.author)}
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {getAuthorName(post.author)}
                              {post.family?.name && (
                                <span className="ml-2 text-gray-600 text-sm">({post.family.name})</span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500">{new Date(post.created_at).toLocaleString()}</div>
                          </div>
                        </div>
                        <h4 className="font-medium text-gray-900 mb-1">{post.title}</h4>
                        <p className="text-sm text-gray-600 line-clamp-2">{decodeHtml(post.content)}</p>
                      </div>
                      {/* Delete button for author or admin */}
                      {!isLoggedIn && (user && (user.id === post.author.id || user.role === 'admin')) && (
                        <button
                          onClick={e => { e.stopPropagation(); handleDeletePost(post.id); }}
                          className="ml-4 text-red-600 hover:text-red-900 font-bold px-2 py-1 rounded"
                          title="Delete Post"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No Results Message */}
            {filteredPosts.length === 0 && filteredFamilies.length === 0 && (
              <p className="text-gray-600">No results found for "{searchTerm}"</p>
            )}
          </div>
        </div>
      )}

      {/* Regular Post Feed (when not searching) */}
      {!showSearchResults && (
        <div className="w-full max-w-2xl mx-auto">
          {loadingPosts ? (
            <div className="text-center text-[#b32a2a] text-lg py-8">Loading posts...</div>
          ) : error ? (
            <div className="text-center text-red-600 text-lg py-8">{error}</div>
          ) : posts.length === 0 ? (
            <div className="text-center text-gray-600 text-lg py-8">No posts yet.</div>
          ) : (
            <div className="space-y-6">
              {(posts).map((post) => (
                <div 
                  key={post.id} 
                  className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow duration-200"
                  onClick={() => handlePostClick(post.id)}
                >
                  {/* Post Header */}
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-[#b32a2a] flex items-center justify-center">
                          {post.author?.profile_picture ? (
                            <img 
                              src={post.author.profile_picture} 
                              alt={getAuthorName(post.author)} 
                              className="w-full h-full object-cover" 
                            />
                          ) : (
                            <span className="text-white text-xl font-bold">
                              {getAuthorInitial(post.author)}
                            </span>
                          )}
                        </div>
                        <div>
                          <h2 className="text-xl font-bold text-gray-900">{getAuthorName(post.author)}</h2>
                          <p className="text-sm text-gray-500">
                            {new Date(post.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      {post.family_name && isLoggedIn && (
                        <span className="px-3 py-1 bg-[#b32a2a] text-white text-sm rounded-full">
                          {post.family_name}
                        </span>
                      )}
                    </div>

                    {post.type === 'announcement' && (
                      <span className="inline-block bg-[#b32a2a] text-white px-2 py-1 rounded-full text-xs font-semibold mb-4">
                        Announcement
                      </span>
                    )}

                    <h3 className="text-xl font-bold text-gray-900 mb-4">{post.title}</h3>

                    {post.image_path && (
                      <div className="mb-4">
                        <img 
                          src={post.image_path} 
                          alt={post.title}
                          className="w-full h-auto object-contain rounded-lg"
                        />
                      </div>
                    )}

                    <p className="text-gray-700 mb-4 whitespace-pre-wrap">{truncateText(post.content, post.id)}</p>

                    {post.point_value > 0 && isLoggedIn && (
                      <div className="mb-4">
                        <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-semibold">
                          {post.point_value} pts
                        </span>
                      </div>
                    )}

                    {/* Post Actions */}
                    <div className="flex items-center gap-6 pt-4 border-t" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLike(post.id);
                        }}
                        className={`flex items-center gap-2 transition duration-200 ${
                          !isLoggedIn 
                            ? 'text-gray-400 cursor-not-allowed' 
                            : 'text-gray-600 hover:text-[#b32a2a]'
                        }`}
                        disabled={!isLoggedIn}
                      >
                        {post.likes?.some(like => like.user === user?.id) ? (
                          <HeartSolid className="w-6 h-6 text-[#b32a2a]" />
                        ) : (
                          <HeartOutline className="w-6 h-6" />
                        )}
                        <span>{post.likes?.length || 0} likes</span>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handlePostClick(post.id); }}
                        className={`flex items-center gap-2 transition duration-200 ${
                          !isLoggedIn 
                            ? 'text-gray-400 cursor-not-allowed' 
                            : 'text-gray-600 hover:text-[#b32a2a]'
                        }`}
                        disabled={!isLoggedIn}
                      >
                        <ChatBubbleOvalLeftIcon className="w-6 h-6" />
                        <span>{post.comments?.length || 0} comments</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Floating Create Post Button */}
      {isLoggedIn && (
        <>
          <div className="fixed bottom-8 right-1/2 translate-x-[calc(50%+max(0px,calc((100vw-32rem)/2))-6rem)] z-40">
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
          {/* Troubleshooting button opposite corner */}
          <div className="fixed bottom-8 left-1/2 -translate-x-[calc(50%+max(0px,calc((100vw-32rem)/2))-6rem)] z-40">
            <a
              href="https://forms.gle/fB8nBWiJeWBc9Ksa6"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center bg-white text-[#b32a2a] p-4 rounded-full shadow-lg border-2 border-[#b32a2a] hover:bg-[#faecd8] transition"
              aria-label="Troubleshooting"
              title="Troubleshooting"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm.007 14.25a.997.997 0 1 0 0 1.995.997.997 0 0 0 0-1.995ZM12 6a3.75 3.75 0 0 0-3.75 3.75.75.75 0 0 0 1.5 0A2.25 2.25 0 1 1 12 12a.75.75 0 0 0-.75.75v1.5a.75.75 0 0 0 1.5 0v-1.02a3.75 3.75 0 0 0-.75-7.48Z" clipRule="evenodd" />
              </svg>
            </a>
          </div>
        </>
      )}
    </MainLayout>
  );
}

export default DashboardHome; 