import React, { useEffect, useState } from 'react';
import axios from 'axios';

function Leaderboard() {
  const [families, setFamilies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await axios.get('http://localhost:5001/api/families/leaderboard');
        setFamilies(res.data.families);
        setLoading(false);
      } catch (err) {
        setError('Failed to load leaderboard.');
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#faecd8]"><div className="text-xl text-[#b32a2a]">Loading leaderboard...</div></div>;
  }
  if (error) {
    return <div className="min-h-screen flex items-center justify-center bg-[#faecd8]"><div className="text-xl text-red-600">{error}</div></div>;
  }
  return (
    <div className="min-h-screen bg-[#faecd8] py-8 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-8">
        <h2 className="text-3xl font-bold text-[#b32a2a] mb-6">Family Leaderboard</h2>
        {families.length === 0 ? (
          <div className="text-gray-600">No families found.</div>
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
              {families.map((family, idx) => (
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
    </div>
  );
}

export default Leaderboard; 