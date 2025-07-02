import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { PencilIcon, TrashIcon, HeartIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import api from './api';
import { useAuth } from './AuthContext';
import MainLayout from './MainLayout';
import { supabase } from './supabaseClient';

const PostPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isLoggedIn, user, loading } = useAuth();
  const [post, setPost] = useState(null);
  const [error, setError] = useState('');
  const [commentStates, setCommentStates] = useState({});
  const [editingComment, setEditingComment] = useState(null);
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentError, setCommentError] = useState('');
  const commentInputRef = useRef(null);
  const [isAuthor, setIsAuthor] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEditingPost, setIsEditingPost] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editPointValue, setEditPointValue] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        let endpoint = `/api/posts/${id}`;
        
        const headers = token ? { 'x-auth-token': token } : {};
        const res = await api.get(endpoint, { headers });
        if (res.data.success) {
          setPost(res.data.post);
        } else {
          setError('Failed to load post');
        }
      } catch (err) {
        setError('Failed to load post');
        console.error('Error fetching post:', err);
      }
    };

    fetchPost();
  }, [id]);

  useEffect(() => {
    if (post && user) {
      setIsAuthor(post.author_id === user.id);
      setIsAdmin(user.role === 'admin');
    }
  }, [post, user]);

  const handleLike = async () => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const isLiked = post.likes?.some(like => like.user === user.id);
      const endpoint = isLiked ? 'unlike' : 'like';
      
      const res = await api.put(`/api/posts/${endpoint}/${id}`, {}, {
        headers: { 'x-auth-token': token }
      });
      
      if (res.data.success) {
        setPost(prev => ({
          ...prev,
          likes: res.data.likes
        }));
      }
    } catch (err) {
      console.error('Error liking/unliking post:', err);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }

    const commentText = commentStates[id]?.trim();
    if (!commentText) return;

    setCommentLoading(true);
    setCommentError('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await api.post(`/api/posts/comment/${id}`, 
        { text: commentText },
        { headers: { 'x-auth-token': token } }
      );
      
      if (res.data.success) {
        setPost(prev => ({
          ...prev,
          comments: res.data.comments
        }));
        setCommentStates(prev => ({ ...prev, [id]: '' }));
        if (commentInputRef.current) {
          commentInputRef.current.focus();
        }
      }
    } catch (err) {
      setCommentError(err.response?.data?.message || 'Failed to add comment');
    } finally {
      setCommentLoading(false);
    }
  };

  const handleEditComment = async (commentId, newText) => {
    if (!newText.trim()) return;

    setCommentLoading(true);
    setCommentError('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await api.put(`/api/posts/comment/${id}/${commentId}`, 
        { text: newText },
        { headers: { 'x-auth-token': token } }
      );
      
      if (res.data.success) {
        setPost(prev => ({
          ...prev,
          comments: res.data.comments
        }));
        setEditingComment(null);
        setCommentStates(prev => ({
          ...prev,
          [`edit-${commentId}`]: ''
        }));
      }
    } catch (err) {
      setCommentError(err.response?.data?.message || 'Failed to edit comment');
    } finally {
      setCommentLoading(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    setCommentLoading(true);
    setCommentError('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await api.delete(`/api/posts/comment/${id}/${commentId}`, {
        headers: { 'x-auth-token': token }
      });
      
      if (res.data.success) {
        setPost(prev => ({
          ...prev,
          comments: res.data.comments
        }));
      }
    } catch (err) {
      setCommentError(err.response?.data?.message || 'Failed to delete comment');
    } finally {
      setCommentLoading(false);
    }
  };

  const startEditPost = () => {
    setEditTitle(post.title);
    setEditContent(post.content);
    setEditPointValue(post.point_value?.toString() || '');
    setIsEditingPost(true);
    setEditError('');
  };

  const cancelEditPost = () => {
    setIsEditingPost(false);
    setEditTitle('');
    setEditContent('');
    setEditPointValue('');
    setEditError('');
  };

  const handleEditPost = async (e) => {
    e.preventDefault();
    setEditError('');
    setEditLoading(true);

    const updatedData = {
      title: editTitle,
      content: editContent,
    };

    if (post.type === 'hangout' && isAdmin) {
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
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      await api.put(`/api/posts/${id}`, updatedData, {
        headers: { 'x-auth-token': token }
      });
      
      // Refresh post data
      const res = await api.get(`/api/posts/${id}`, {
        headers: { 'x-auth-token': token }
      });
      setPost(res.data.post);
      setIsEditingPost(false);
      setEditLoading(false);
    } catch (err) {
      setEditError(err.response?.data?.message || 'Failed to edit post.');
      setEditLoading(false);
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      await api.delete(`/api/posts/${id}`, {
        headers: { 'x-auth-token': token }
      });
      navigate(-1); // Go back to previous page after deletion
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete post.');
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center">
          <div className="text-center text-[#b32a2a] text-lg">Loading post...</div>
        </div>
      </MainLayout>
    );
  }

  if (error || !post) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center">
          <div className="text-center text-red-600 text-lg">{error || 'Post not found'}</div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="w-full max-w-4xl">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 px-4 py-2 bg-[#b32a2a] text-white rounded-lg hover:bg-[#8a1f1f] transition duration-200 flex items-center gap-2"
        >
          ← Back
        </button>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {isEditingPost ? (
            <form onSubmit={handleEditPost} className="p-6">
              {editError && <div className="text-red-600 mb-4">{editError}</div>}
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="editTitle">
                  Title
                </label>
                <input
                  type="text"
                  id="editTitle"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="editContent">
                  Content
                </label>
                <textarea
                  id="editContent"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-32"
                  required
                />
              </div>

              {post.type === 'hangout' && isAdmin && (
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="editPointValue">
                    Point Value
                  </label>
                  <input
                    type="number"
                    id="editPointValue"
                    value={editPointValue}
                    onChange={(e) => setEditPointValue(e.target.value)}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    min="0"
                    max="13"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={cancelEditPost}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition duration-200"
                  disabled={editLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#b32a2a] text-white rounded-lg hover:bg-[#8a1f1f] transition duration-200"
                  disabled={editLoading}
                >
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          ) : (
            <>
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">{post.title}</h1>
                    {post.type === 'announcement' && (
                      <span className="inline-block bg-[#b32a2a] text-white px-3 py-1 rounded-full text-sm font-semibold mb-4">
                        Announcement
                      </span>
                    )}
                  </div>
                  {(isAuthor || isAdmin) && (
                    <div className="flex gap-2">
                      <button
                        onClick={startEditPost}
                        className="p-2 text-gray-600 hover:text-[#b32a2a] transition-colors"
                        title="Edit Post"
                      >
                        <PencilIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={handleDeletePost}
                        className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                        title="Delete Post"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>

                {post.image_path && (
                  <div className="mb-6">
                    <img 
                      src={post.image_path} 
                      alt={post.title}
                      className="w-full h-auto object-contain rounded-lg"
                    />
                  </div>
                )}

                <p className="text-gray-700 whitespace-pre-wrap mb-4">{post.content}</p>

                {post.point_value > 0 && (
                  <div className="mb-4">
                    <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-semibold">
                      {post.point_value} pts
                    </span>
                  </div>
                )}

                {/* Post Actions */}
                <div className="flex items-center gap-6 pt-4 border-t">
                  <button
                    onClick={handleLike}
                    className={`flex items-center gap-2 transition duration-200 ${
                      'text-gray-600 hover:text-[#b32a2a]'
                    }`}
                  >
                    {post.likes?.some(like => like.user === user?.id) ? (
                      <HeartIconSolid className="w-6 h-6 text-[#b32a2a]" />
                    ) : (
                      <HeartIcon className="w-6 h-6" />
                    )}
                    <span>{post.likes?.length || 0} likes</span>
                  </button>
                  <div className="flex items-center gap-2 text-gray-600">
                    <ChatBubbleLeftIcon className="w-6 h-6" />
                    <span>{post.comments?.length || 0} comments</span>
                  </div>
                </div>
              </div>

              {/* Comments Section */}
              <div className="p-6 border-t">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Comments</h3>
                
                {/* Comment Form */}
                {isLoggedIn && (
                  <form onSubmit={handleComment} className="mb-6">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-[#b32a2a] flex items-center justify-center">
                        {user?.profile_picture ? (
                          <img 
                            src={user.profile_picture} 
                            alt={user.username} 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <span className="text-white text-sm font-bold">
                            {user?.username?.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <span className="font-semibold text-sm">{user?.username}</span>
                    </div>
                    <input
                      ref={commentInputRef}
                      type="text"
                      value={commentStates[id] || ''}
                      onChange={(e) => setCommentStates(prev => ({
                        ...prev,
                        [id]: e.target.value
                      }))}
                      placeholder="Write a comment..."
                      className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#b32a2a] focus:border-transparent"
                      disabled={commentLoading}
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        type="submit"
                        disabled={commentLoading || !commentStates[id]?.trim()}
                        className="px-4 py-2 bg-[#b32a2a] text-white rounded-lg hover:bg-[#8a1f1f] transition duration-200 disabled:opacity-50"
                      >
                        {commentLoading ? 'Posting...' : 'Post'}
                      </button>
                    </div>
                    {commentError && (
                      <div className="text-red-600 text-sm mt-2">{commentError}</div>
                    )}
                  </form>
                )}

                {/* Comments List */}
                {post.comments?.length > 0 && (
                  <div className="space-y-4">
                    {post.comments.map((comment) => (
                      <div key={comment.id} className="bg-white rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-8 h-8 rounded-full overflow-hidden bg-[#b32a2a] flex items-center justify-center">
                              {comment.profile_picture ? (
                                <img 
                                  src={comment.profile_picture} 
                                  alt={comment.username} 
                                  className="w-full h-full object-cover" 
                                />
                              ) : (
                                <span className="text-white text-sm font-bold">
                                  {comment.username?.charAt(0).toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div>
                              <span className="font-semibold text-sm">{comment.username}</span>
                              <span className="text-xs text-gray-500 ml-2">
                                {new Date(comment.created_at).toLocaleString()}
                              </span>
                            </div>
                          </div>
                          {(user?.id === comment.user || user?.role === 'admin') && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setEditingComment(comment.id);
                                  setCommentStates(prev => ({
                                    ...prev,
                                    [`edit-${comment.id}`]: comment.text
                                  }));
                                }}
                                className="text-gray-500 hover:text-[#b32a2a] transition duration-200"
                              >
                                <PencilIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteComment(comment.id)}
                                className="text-gray-500 hover:text-red-600 transition duration-200"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                        {editingComment === comment.id ? (
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              handleEditComment(comment.id, commentStates[`edit-${comment.id}`]);
                            }}
                            className="mt-2"
                          >
                            <input
                              type="text"
                              value={commentStates[`edit-${comment.id}`] || ''}
                              onChange={(e) => setCommentStates(prev => ({
                                ...prev,
                                [`edit-${comment.id}`]: e.target.value
                              }))}
                              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#b32a2a] focus:border-transparent"
                              disabled={commentLoading}
                            />
                            <div className="flex gap-2 mt-2">
                              <button
                                type="submit"
                                disabled={commentLoading || !commentStates[`edit-${comment.id}`]?.trim()}
                                className="px-3 py-1 bg-[#b32a2a] text-white rounded-lg hover:bg-[#8a1f1f] transition duration-200 disabled:opacity-50"
                              >
                                {commentLoading ? 'Saving...' : 'Save'}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingComment(null);
                                  setCommentStates(prev => ({
                                    ...prev,
                                    [`edit-${comment.id}`]: ''
                                  }));
                                }}
                                className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition duration-200"
                              >
                                Cancel
                              </button>
                            </div>
                          </form>
                        ) : (
                          <p className="text-gray-700 mt-1">{comment.text}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default PostPage; 