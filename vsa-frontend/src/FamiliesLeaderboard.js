import React, { useEffect, useState } from 'react';
import axios from 'axios';
import MainLayout from './MainLayout';

function FamiliesLeaderboard() {
  const [families, setFamilies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchFamilies();
  }, []);

  const fetchFamilies = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get('http://localhost:5001/api/families/leaderboard');
      setFamilies(res.data.families || []);
      setLoading(false);
    } catch (err) {
      setError('Failed to load families.');
      setLoading(false);
    }
  };

  const handleCreateFamily = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5001/api/families', form, {
        headers: { 'x-auth-token': token }
      });
      setForm({ name: '', description: '' });
      setShowForm(false);
      setFormLoading(false);
      fetchFamilies();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create family.');
      setFormLoading(false);
    }
  };

  const filteredFamilies = families.filter(fam =>
    fam.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <MainLayout>
      <div className="w-full max-w-3xl bg-white rounded-lg shadow-md p-8">
        <h2 className="text-3xl font-bold text-[#b32a2a] mb-6">Families Leaderboard</h2>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-2">
          <input
            type="text"
            placeholder="Search families..."
            className="w-full md:w-1/2 border-2 border-[#b32a2a] rounded-md px-4 py-2 text-lg focus:outline-none focus:border-[#8a1f1f]"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button
            className="px-6 py-2 bg-[#b32a2a] text-white rounded-lg hover:bg-[#8a1f1f] transition w-full md:w-auto"
            onClick={() => setShowForm(v => !v)}
          >
            {showForm ? 'Cancel' : 'Create Family'}
          </button>
        </div>
        {showForm && (
          <form onSubmit={handleCreateFamily} className="mb-6 flex flex-col md:flex-row gap-2">
            <input
              className="flex-1 p-2 border border-gray-300 rounded-lg"
              placeholder="Family Name"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              required
              disabled={formLoading}
            />
            <input
              className="flex-1 p-2 border border-gray-300 rounded-lg"
              placeholder="Description"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              required
              disabled={formLoading}
            />
            <button type="submit" className="px-6 py-2 bg-[#b32a2a] text-white rounded-lg hover:bg-[#8a1f1f] transition" disabled={formLoading}>
              {formLoading ? 'Creating...' : 'Create'}
            </button>
          </form>
        )}
        {formError && <div className="text-red-600 mb-2">{formError}</div>}
        {loading ? (
          <div className="text-center text-[#b32a2a] text-lg py-8">Loading families...</div>
        ) : error ? (
          <div className="text-center text-red-600 text-lg py-8">{error}</div>
        ) : filteredFamilies.length === 0 ? (
          <div className="text-center text-gray-600 text-lg py-8">No families found.</div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="py-2 px-4">Rank</th>
                <th className="py-2 px-4">Family</th>
                <th className="py-2 px-4">Points</th>
                <th className="py-2 px-4">Members</th>
              </tr>
            </thead>
            <tbody>
              {filteredFamilies.map((family, idx) => (
                <tr key={family._id} className="border-t">
                  <td className="py-2 px-4 font-bold">{idx + 1}</td>
                  <td className="py-2 px-4">{family.name}</td>
                  <td className="py-2 px-4">{family.totalPoints || 0}</td>
                  <td className="py-2 px-4">{family.members?.length || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </MainLayout>
  );
}
//

export default FamiliesLeaderboard; 