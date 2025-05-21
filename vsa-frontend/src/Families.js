import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Families() {
  const [families, setFamilies] = useState([]);
  const [newFamily, setNewFamily] = useState({ name: '', description: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);

  // Get token from localStorage
  const token = localStorage.getItem('token');

  // Fetch all families
  const fetchFamilies = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/families');
      setFamilies(response.data.families);
      setLoading(false);
    } catch (err) {
      setError('Failed to load families');
      setLoading(false);
    }
  };

  // Create a new family
  const handleCreateFamily = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const response = await axios.post(
        'http://localhost:5001/api/families',
        newFamily,
        {
          headers: {
            'Content-Type': 'application/json',
            'x-auth-token': token
          }
        }
      );

      setSuccess('Family created successfully!');
      setNewFamily({ name: '', description: '' });
      fetchFamilies(); // Refresh the list
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create family');
    }
  };

  // Load families when component mounts
  useEffect(() => {
    fetchFamilies();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faecd8] flex items-center justify-center">
        <div className="text-xl text-[#b32a2a]">Loading families...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faecd8] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Create Family Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold text-[#b32a2a] mb-4">Create New Family</h2>
          <form onSubmit={handleCreateFamily}>
            <div className="mb-4">
              <input
                type="text"
                placeholder="Family Name"
                className="w-full p-3 border border-gray-300 rounded-lg"
                value={newFamily.name}
                onChange={(e) => setNewFamily({ ...newFamily, name: e.target.value })}
                required
              />
            </div>
            <div className="mb-4">
              <textarea
                placeholder="Family Description"
                className="w-full p-3 border border-gray-300 rounded-lg"
                value={newFamily.description}
                onChange={(e) => setNewFamily({ ...newFamily, description: e.target.value })}
                required
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-[#b32a2a] text-white rounded-lg hover:bg-[#8a1f1f] transition"
            >
              Create Family
            </button>
          </form>
          {error && <p className="mt-2 text-red-600">{error}</p>}
          {success && <p className="mt-2 text-green-600">{success}</p>}
        </div>

        {/* Families List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-[#b32a2a] mb-4">All Families</h2>
          {families.length === 0 ? (
            <p className="text-gray-600">No families found. Be the first to create one!</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {families.map((family) => (
                <div key={family._id} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-xl font-semibold text-[#b32a2a]">{family.name}</h3>
                  <p className="text-gray-600 mt-2">{family.description}</p>
                  <div className="mt-4 flex justify-between items-center">
                    <span className="text-sm text-gray-500">
                      {family.members?.length || 0} members
                    </span>
                    <span className="text-sm text-gray-500">
                      {family.totalPoints || 0} total points
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Families; 