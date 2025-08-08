import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { supabase } from './supabaseClient';
import api from './api';

const JoinFamilyPage = () => {
  const [familyCode, setFamilyCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { updateUser, refreshUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!familyCode.trim()) {
      setError('Please enter a family code.');
      setLoading(false);
      return;
    }

    try {
      // Get the access token from Supabase session
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        setError('You must be logged in to join a family.');
        setLoading(false);
        return;
      }
      const res = await api.put('/api/auth/join-family', 
        { family_code: familyCode },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      // Update the user in our AuthContext with the new profile data
      updateUser(res.data.user);
      
      // Force refresh the user data to ensure everything is up to date
      await refreshUser();

      // Redirect to the main dashboard
      navigate('/dashboard');

    } catch (err) {
      setError(err.response?.data?.message || 'Failed to join family. Please check the code and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#faecd8]">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg text-center">
        <h2 className="text-2xl font-bold text-[#b32a2a] mb-4">Join a Family</h2>
        <p className="text-gray-600 mb-6">
          Welcome! Your registration is almost complete. Please enter your family's code to continue.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="familyCode" className="sr-only">Family Code</label>
            <input
              id="familyCode"
              name="familyCode"
              type="text"
              value={familyCode}
              onChange={(e) => setFamilyCode(e.target.value)}
              required
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-[#b32a2a] focus:border-[#b32a2a] focus:z-10 sm:text-sm"
              placeholder="Enter Family Code"
            />
          </div>

          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[#b32a2a] hover:bg-[#8a1f1f] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#b32a2a] disabled:bg-gray-400"
            >
              {loading ? 'Joining...' : 'Join Family'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JoinFamilyPage; 