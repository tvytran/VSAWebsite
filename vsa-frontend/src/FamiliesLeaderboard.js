import React, { useEffect, useState } from 'react';
import api from './api';
import MainLayout from './MainLayout';
import { Link, Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient';

function FamiliesLeaderboard() {
  const [families, setFamilies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const isGuest = localStorage.getItem('isGuest') === 'true';

  useEffect(() => {
    const fetchFamilies = async () => {
      setLoading(true);
      setError('');
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) {
          setError('No authentication token found. Please log in.');
          setLoading(false);
          return;
        }
        const res = await api.get('/api/families/leaderboard', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setFamilies(res.data.families || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load leaderboard.');
      } finally {
        setLoading(false);
      }
    };
    fetchFamilies();
  }, []);

  if (isGuest) return <Navigate to="/dashboard" />;

  const filteredFamilies = families.filter(fam =>
    fam.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <MainLayout>
      <div className="w-full max-w-3xl bg-white rounded-lg shadow-md p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-[#b32a2a]">Families Leaderboard</h2>
          
        </div>
        <input
          type="text"
          placeholder="Search families..."
          className="mb-4 w-full border-2 border-[#b32a2a] rounded-md px-4 py-2 text-lg focus:outline-none focus:border-[#8a1f1f]"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {loading ? (
          <div className="text-center text-[#b32a2a] text-lg py-8">Loading families...</div>
        ) : error ? (
          <div className="text-center text-red-600 text-lg py-8">{error}</div>
        ) : (
          <div className="grid gap-6">
            {filteredFamilies.map((family, index) => (
              <div key={family.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <span className={`text-2xl font-bold mr-4 ${index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : index === 2 ? 'text-amber-700' : 'text-[#b32a2a]'}`}>#{index + 1}</span>
                    <h3 className="text-2xl font-bold text-[#b32a2a]">{family.name}</h3>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold bg-[#b32a2a] text-white rounded-full px-3 py-1">{family.total_points || 0} pts</div>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {family.members && family.members.length > 0 ? (
                    family.members.map(member => (
                      <span key={member.author_id || member} className="bg-gray-200 text-gray-700 text-sm px-3 py-1 rounded-full">
                        {member.username || member.email || member}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-gray-500">No members yet</span>
                  )}
                </div>
                <div className="mt-4">
                  <Link
                    to={`/families/${family.id}`}
                    className="px-4 py-2 bg-[#b32a2a] text-white rounded-lg hover:bg-[#8a1f1f] transition text-sm"
                  >
                    View Family
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
//

export default FamiliesLeaderboard; 