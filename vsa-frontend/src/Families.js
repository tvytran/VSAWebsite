import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import MainLayout from './MainLayout';

function Families() {
  const [families, setFamilies] = useState([]);
  const [newFamily, setNewFamily] = useState({ name: '', description: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);

  // Get token from localStorage
  const token = localStorage.getItem('token');

  // Fetch all families with populated members
  const fetchFamilies = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/families');
      // Fetch detailed info for each family
      const familiesWithDetails = await Promise.all(
        response.data.families.map(async (family) => {
          const detailedResponse = await axios.get(`http://localhost:5001/api/families/${family._id}`);
          return detailedResponse.data.family;
        })
      );
      setFamilies(familiesWithDetails);
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

  return (
    <MainLayout>
      <div className="w-full max-w-3xl">
        <h2 className="text-3xl font-bold text-[#b32a2a] mb-6">Families</h2>
        <form onSubmit={handleCreateFamily} className="mb-6 flex flex-col md:flex-row gap-2">
          <input
            className="flex-1 p-2 border border-gray-300 rounded-lg"
            placeholder="Family Name"
            value={newFamily.name}
            onChange={e => setNewFamily({ ...newFamily, name: e.target.value })}
            required
          />
          <input
            className="flex-1 p-2 border border-gray-300 rounded-lg"
            placeholder="Description"
            value={newFamily.description}
            onChange={e => setNewFamily({ ...newFamily, description: e.target.value })}
            required
          />
          <button type="submit" className="px-6 py-2 bg-[#b32a2a] text-white rounded-lg hover:bg-[#8a1f1f] transition">Create</button>
        </form>
        {error && <div className="text-red-600 mb-2">{error}</div>}
        {success && <div className="text-green-600 mb-2">{success}</div>}
        {loading ? (
          <div className="text-center text-[#b32a2a] text-lg py-8">Loading families...</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {families.map((family) => (
              <div key={family._id} className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-xl font-semibold text-[#b32a2a]">{family.name}</h3>
                <p className="text-gray-600 mt-2">{family.description}</p>
                <div className="mt-4">
                  <h4 className="font-semibold text-gray-700 mb-2">Members:</h4>
                  {family.members && family.members.length > 0 ? (
                    <ul className="list-disc ml-6">
                      {family.members.map(member => (
                        <li key={member._id} className="text-sm text-gray-600">
                          {member.username || member.email}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500">No members yet</p>
                  )}
                </div>
                <div className="mt-4 flex justify-between items-center">
                  <span className="text-sm text-gray-500">{family.members?.length || 0} members</span>
                  <span className="text-sm text-gray-500">{family.totalPoints || 0} total points</span>
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <Link 
                    to={`/family/${family._id}`}
                    className="px-4 py-2 bg-[#b32a2a] text-white rounded-lg hover:bg-[#8a1f1f] transition"
                  >
                    View Family
                  </Link>
                  <Link 
                    to={`/family/${family._id}/create-post`}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                  >
                    Create Post
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}

export default Families; 