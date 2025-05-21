import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

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

  useEffect(() => {
    const fetchFamily = async () => {
      try {
        const res = await axios.get(`http://localhost:5001/api/families/${id}`);
        setFamily(res.data.family);
        setLoading(false);
      } catch (err) {
        setError('Failed to load family info.');
        setLoading(false);
      }
    };
    fetchFamily();
  }, [id]);

  useEffect(() => {
    const fetchPosts = async () => {
      setPostsLoading(true);
      setPostsError('');
      try {
        const res = await axios.get(`http://localhost:5001/api/posts/family/${id}`, {
          headers: { 'x-auth-token': localStorage.getItem('token') }
        });
        setPosts(res.data.posts);
        setPostsLoading(false);
      } catch (err) {
        setPostsError('Failed to load posts.');
        setPostsLoading(false);
      }
    };
    fetchPosts();
  }, [id]);

  // Helper: check if current user is a member
  const userId = (() => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return null;
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.user.id;
    } catch {
      return null;
    }
  })();
  const isMember = family && family.members && family.members.some(m => (m._id || m) === userId);

  const handleCreatePost = async (e) => {
    e.preventDefault();
    setPostError('');
    setPostLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5001/api/posts', {
        title: newTitle,
        type: newType,
        content: newPost,
        family: family._id,
        ...(newType === 'hangout' ? { pointValue: Number(pointValue) } : {})
      }, {
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
    } catch (err) {
      setEditError(err.response?.data?.message || 'Failed to edit post.');
      setEditLoading(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#faecd8]"><div className="text-xl text-[#b32a2a]">Loading family...</div></div>;
  }
  if (error) {
    return <div className="min-h-screen flex items-center justify-center bg-[#faecd8]"><div className="text-xl text-red-600">{error}</div></div>;
  }
  if (!family) {
    return <div className="min-h-screen flex items-center justify-center bg-[#faecd8]"><div className="text-xl text-gray-600">Family not found.</div></div>;
  }
  return (
    <div className="min-h-screen bg-[#faecd8] py-8 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-8">
        <h2 className="text-3xl font-bold text-[#b32a2a] mb-4">{family.name}</h2>
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
                    <form onSubmit={handleEditPost} className="mb-2 flex flex-col gap-2">
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
                      <div className="ml-2 text-gray-700">
                        {post.content}
                        {post.pointValue !== undefined && post.pointValue !== null && (
                          <span className="ml-2 text-blue-600 font-semibold">[{post.pointValue} pts]</span>
                        )}
                      </div>
                      <span className="ml-2 text-xs text-gray-400">{new Date(post.createdAt).toLocaleString()}</span>
                      {isMember && (
                        <button
                          className="ml-2 px-2 py-1 bg-yellow-300 rounded hover:bg-yellow-400 text-xs"
                          onClick={() => startEdit(post)}
                        >
                          Edit
                        </button>
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
    </div>
  );
}

export default FamilyDetails; 