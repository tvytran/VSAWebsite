import React, { useEffect, useState } from 'react';
import axios from 'axios';
import MainLayout from './MainLayout';
import { Link } from 'react-router-dom';

function DashboardHome() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  
  const isLoggedIn = !!localStorage.getItem('token');
  const isGuest = localStorage.getItem('isGuest') === 'true';

  // State for editing
  const [editingPostId, setEditingPostId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editError, setEditError] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  // State for controlling the visibility of the three dots menu
  const [showMenuId, setShowMenuId] = useState(null);

  // State for search functionality
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredPosts, setFilteredPosts] = useState([]);

  useEffect(() => {
    if (isLoggedIn) {
      // Fetch user data
      const fetchUserData = async () => {
        try {
          const token = localStorage.getItem('token');
          const res = await axios.get('http://localhost:5001/api/auth/me', {
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

      // Fetch posts
      const fetchPosts = async () => {
        setLoading(true);
        setError('');
        try {
          const token = localStorage.getItem('token');
          const res = await axios.get('http://localhost:5001/api/posts/feed', {
            headers: { 'x-auth-token': token }
          });
          // Ensure posts are sorted by creation date descending
          const sortedPosts = res.data.posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          setPosts(sortedPosts || []);
          setLoading(false);
        } catch (err) {
          setError('Failed to load posts.');
          setLoading(false);
        }
      };
      fetchPosts();
    } else {
      setLoading(false);
      setPosts([]);
    }
  }, [isLoggedIn]);

  const fetchPosts = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5001/api/posts/feed', {
        headers: { 'x-auth-token': token }
      });
      // Ensure posts are sorted by creation date descending
      const sortedPosts = res.data.posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setPosts(sortedPosts || []);
      setLoading(false);
    } catch (err) {
      setError('Failed to load posts.');
      setLoading(false);
    }
  };

  // Effect to filter posts whenever posts or searchTerm changes
  useEffect(() => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    const filtered = posts.filter(post => 
      post.title.toLowerCase().includes(lowerCaseSearchTerm) ||
      post.content.toLowerCase().includes(lowerCaseSearchTerm) ||
      post.author?.username?.toLowerCase().includes(lowerCaseSearchTerm)
    );
    setFilteredPosts(filtered);
  }, [posts, searchTerm]);

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
      await axios.put(`http://localhost:5001/api/posts/${postId}`, {
        title: editTitle,
        content: editContent
      }, {
        headers: { 'x-auth-token': token }
      });
      setEditLoading(false);
      setEditingPostId(null); // Close edit form/menu
      setEditTitle('');
      setEditContent('');
      fetchPosts(); // Refresh posts
    } catch (err) {
      setEditError(err.response?.data?.message || 'Failed to edit post.');
      setEditLoading(false);
    }
  };

   const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5001/api/posts/${postId}`, {
        headers: { 'x-auth-token': token }
      });
      fetchPosts(); // Refresh posts
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete post.');
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
        <div className="w-full max-w-2xl text-center mb-6">
          <h2 className="text-2xl font-bold text-[#b32a2a] mb-4">Welcome, Guest!</h2>
          <p className="text-gray-700 mb-4">Explore the VSA community and see what we're all about.</p>
           <div className="flex justify-center space-x-4">
            <Link to="/families" className="px-6 py-3 bg-[#b32a2a] text-white rounded-lg hover:bg-[#8a1f1f] transition font-semibold text-lg">View Leaderboard</Link>
          </div>
        </div>
      )}

      {/* Search Bar */}
      {(isLoggedIn || isGuest) && (
        <div className="w-full max-w-2xl flex items-center mb-6">
          <input
            type="text"
            placeholder="Search posts..."
            className="flex-1 border-2 border-[#b32a2a] rounded-md px-4 py-2 text-lg focus:outline-none focus:border-[#8a1f1f]"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      )}

      {isLoggedIn && (
        <div className="w-full max-w-2xl mb-6">
          <Link 
            to="/create-post" 
            className="w-full border-2 border-[#b32a2a] rounded-md px-4 py-3 text-lg focus:outline-none focus:border-[#8a1f1f] bg-white hover:bg-[#f5e6d6] flex items-center justify-center transition duration-200 ease-in-out"
          >
            Create New Post
          </Link>
        </div>
      )}

      {isLoggedIn ? (
        <div className="w-full max-w-2xl">
          {loading ? (
            <div className="text-center text-[#b32a2a] text-lg py-8">Loading posts...</div>
          ) : error ? (
            <div className="text-center text-red-600 text-lg py-8">{error}</div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center text-gray-600 text-lg py-8">{searchTerm ? 'No posts match your search.' : 'No posts yet.'}</div>
          ) : (
            filteredPosts.map(post => (
              <div key={post._id} className={`rounded-lg shadow-md mb-6 relative ${post.type === 'announcement' ? 'bg-[#fff3e6] border-2 border-[#b32a2a]' : 'bg-white'}`}>
                {post.imageUrl && (
                  <img src={`http://localhost:5001${post.imageUrl}`} alt="Post" className="w-full object-contain rounded-t-lg" />
                )}
                <div className="p-4">
                  {/* Post Header with Author Info and Menu */}
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 rounded-full overflow-hidden mr-3">
                      {post.author?.profilePicture ? (
                        <img 
                          src={`http://localhost:5001${post.author.profilePicture}`} 
                          alt={post.author.username} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-[#b32a2a] flex items-center justify-center text-white font-bold">
                          {post.author?.username?.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">
                        {post.author?.username}
                        {/* Display Family Name */}
                        {post.family?.name && (
                          <span className="ml-2 text-gray-600 text-sm">({post.family.name})</span>
                        )}
                        {post.type === 'announcement' && (
                          <span className="ml-2 text-[#b32a2a] font-bold">(Admin)</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">{new Date(post.createdAt).toLocaleString()}</div>
                    </div>

                    {/* Three dots menu for edit/delete - visible only to author */}
                    {isLoggedIn && user?._id === post.author?._id && (
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

                  {/* Conditional rendering for Edit Form or Post Content */}
                  {editingPostId === post._id ? (
                    <form onSubmit={(e) => handleEditPost(e, post._id)} className="mb-2 flex flex-col gap-2">
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
                      />
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
                       <h3 className={`text-lg font-bold mb-2 ${post.type === 'announcement' ? 'text-[#b32a2a] text-xl' : 'text-[#b32a2a]'}`}>
                        {post.title}
                      </h3>
                      <div className="text-gray-700 mb-2">
                        {post.content}
                        {post.hangoutDetails?.pointValue > 0 && (
                          <span className="ml-2 text-blue-600 font-semibold">[{post.hangoutDetails.pointValue} pts]</span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))
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
    </MainLayout>
  );
}

export default DashboardHome; 