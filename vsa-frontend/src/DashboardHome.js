import React, { useEffect, useState } from 'react';
import axios from 'axios';
import MainLayout from './MainLayout';

function DashboardHome() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5001/api/posts/feed', {
          headers: { 'x-auth-token': token }
        });
        setPosts(res.data.posts || []);
        setLoading(false);
      } catch (err) {
        setError('Failed to load posts.');
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  return (
    <MainLayout>
      {/* Search Bar */}
      <div className="w-full max-w-2xl flex items-center mb-6">
        <input
          type="text"
          placeholder="Search"
          className="flex-1 border-2 border-[#b32a2a] rounded-md px-4 py-2 text-lg focus:outline-none focus:border-[#8a1f1f]"
        />
        <button className="ml-2 px-4 py-2 border-2 border-[#b32a2a] rounded-md bg-white hover:bg-[#f5e6d6]">
          <span role="img" aria-label="search">🔍</span>
        </button>
      </div>
      {/* Family Circles */}
      <div className="flex justify-center space-x-8 mb-6">
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 rounded-full border-4 border-[#b32a2a] flex items-center justify-center bg-white mb-2">Ho Chi...</div>
          <span className="text-sm font-semibold">Ho Chi...</span>
        </div>
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 rounded-full border-4 border-[#b32a2a] flex items-center justify-center bg-white mb-2">Bánh bao</div>
          <span className="text-sm font-semibold">Bánh bao</span>
        </div>
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 rounded-full border-4 border-[#b32a2a] flex items-center justify-center bg-white mb-2">25E</div>
          <span className="text-sm font-semibold">25E</span>
        </div>
      </div>
      {/* Post Input */}
      <div className="w-full max-w-2xl mb-6">
        <input
          type="text"
          placeholder="Post Your Family's Hangouts..."
          className="w-full border-2 border-[#b32a2a] rounded-md px-4 py-3 text-lg focus:outline-none focus:border-[#8a1f1f]"
          disabled
        />
      </div>
      {/* Feed Posts */}
      <div className="w-full max-w-2xl">
        {loading ? (
          <div className="text-center text-[#b32a2a] text-lg py-8">Loading posts...</div>
        ) : error ? (
          <div className="text-center text-red-600 text-lg py-8">{error}</div>
        ) : posts.length === 0 ? (
          <div className="text-center text-gray-600 text-lg py-8">No posts yet.</div>
        ) : (
          posts.map(post => (
            <div key={post._id} className="bg-white rounded-lg shadow-md mb-6">
              {post.imageUrl && (
                <img src={post.imageUrl} alt="Post" className="w-full h-64 object-cover rounded-t-lg" />
              )}
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-[#b32a2a]">{post.family?.name || 'Family'} • {new Date(post.createdAt).toLocaleDateString()}</span>
                  <span className="text-gray-400 text-sm">❤️ {post.likes?.length || 0}</span>
                </div>
                <div className="text-lg font-semibold mb-1">{post.title}</div>
                <div className="text-gray-700 mb-1">{post.content} {post.pointValue ? (<span className="text-green-600 font-bold">+{post.pointValue}pts</span>) : null}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </MainLayout>
  );
}

export default DashboardHome; 