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
          {postsLoading ? (
            <div className="text-gray-500">Loading posts...</div>
          ) : postsError ? (
            <div className="text-red-600">{postsError}</div>
          ) : posts.length > 0 ? (
            <ul className="list-disc ml-6 mt-2">
              {posts.map(post => (
                <li key={post._id} className="mb-2">
                  {post.content}
                  <span className="ml-2 text-xs text-gray-400">{new Date(post.createdAt).toLocaleString()}</span>
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