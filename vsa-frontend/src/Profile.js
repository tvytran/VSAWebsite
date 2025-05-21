import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      try {
        const res = await axios.get('http://localhost:5001/api/auth/me', {
          headers: { 'x-auth-token': token }
        });
        setUser(res.data.user);
        setLoading(false);
      } catch (err) {
        setError('Failed to load user info. Please log in again.');
        setLoading(false);
      }
    };
    fetchUser();
  }, [navigate]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#faecd8]"><div className="text-xl text-[#b32a2a]">Loading profile...</div></div>;
  }
  if (error) {
    return <div className="min-h-screen flex items-center justify-center bg-[#faecd8]"><div className="text-xl text-red-600">{error}</div></div>;
  }
  return (
    <div className="min-h-screen bg-[#faecd8] py-8 px-4">
      <div className="max-w-xl mx-auto bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-bold text-[#b32a2a] mb-6">My Profile</h2>
        <div className="mb-4">
          <span className="font-semibold">Username:</span> {user.username}
        </div>
        <div className="mb-4">
          <span className="font-semibold">Email:</span> {user.email}
        </div>
        <div className="mb-4">
          <span className="font-semibold">Role:</span> {user.role}
        </div>
        {user.points && (
          <div className="mb-4">
            <span className="font-semibold">Points:</span> {user.points.total || 0}
          </div>
        )}
        {user.family ? (
          <div className="mb-4">
            <span className="font-semibold">Family:</span> {' '}
            <Link to={`/families/${user.family}`} className="text-[#b32a2a] underline hover:text-[#8a1f1f]">View Family</Link>
          </div>
        ) : (
          <div className="mb-4 text-gray-500">Not in a family</div>
        )}
      </div>
    </div>
  );
}

export default Profile; 