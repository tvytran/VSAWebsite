import React, { useEffect, useState } from 'react';
import axios from 'axios';

function HomeFeed() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchFeed = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5001/api/posts/feed', {
          headers: { 'x-auth-token': token }
        });
        setPosts(res.data.posts);
        setLoading(false);
      } catch (err) {
        setError('Failed to load feed.');
        setLoading(false);
      }
    };
    fetchFeed();
  }, []);

  const safePosts = Array.isArray(posts) ? posts : [];

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#faecd8]"><div className="text-xl text-[#b32a2a]">Loading feed...</div></div>;
  }
  if (error) {
    return <div className="min-h-screen flex items-center justify-center bg-[#faecd8]"><div className="text-xl text-red-600">{error}</div></div>;
  }
  return (
    <div className="min-h-screen bg-[#faecd8] py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold text-[#b32a2a] mb-6">All Posts</h2>
        {safePosts.length === 0 ? (
          <div className="text-gray-600">No posts yet.</div>
        ) : (
          <ul className="space-y-6">
            {safePosts.map(post => (
              <li key={post._id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-lg">{post.title}</span>
                  <span className="text-xs text-gray-400">{new Date(post.createdAt).toLocaleString()}</span>
                </div>
                <div className="mb-2 text-gray-700">{post.content}</div>
                {post.pointValue !== undefined && post.pointValue !== null && (
                  <div className="text-blue-600 font-semibold mb-2">Points: {post.pointValue}</div>
                )}
                <div className="text-sm text-gray-500">
                  By: {post.author?.username || post.author?.email || 'Unknown'}
                  {post.family && (
                    <span> &middot; Family: {post.family.name}</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default HomeFeed; 