import React, { useState, useEffect } from 'react';
import MainLayout from './MainLayout';
import api from './api';
import { useNavigate, Link } from 'react-router-dom';

function CreateFamilyPage() {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }
        const res = await api.get('/api/auth/me', {
          headers: { 'x-auth-token': token }
        });
        if (res.data.user.role !== 'admin') {
          navigate('/dashboard');
          return;
        }
        setIsAdmin(true);
      } catch (err) {
        if (err.response?.status === 401) {
          navigate('/login');
        } else {
          navigate('/dashboard');
        }
      } finally {
        setCheckingAuth(false);
      }
    };
    checkAdminStatus();
  }, [navigate]);

  const { name, description } = formData;

  const onChange = e =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessData(null);
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        }
      };
      const res = await api.post('/api/families', formData, config);
      setSuccessData({
        name: res.data.family.name,
        code: res.data.family.code,
        id: res.data.family.id,
      });
      setLoading(false);
      setFormData({ name: '', description: '' });
    } catch (err) {
      console.error(err.response.data);
      setError(err.response.data.message || 'Failed to create family');
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center min-h-screen">
          <div className="text-2xl text-[#b32a2a]">Loading...</div>
        </div>
      </MainLayout>
    );
  }

  if (!isAdmin) {
    return null; // This will briefly show while redirecting
  }

  return (
    <MainLayout>
      <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow-md p-8 mt-10 text-center">
        {successData ? (
          <div>
            <h2 className="text-2xl font-bold text-green-600 mb-4">Family Created Successfully!</h2>
            <p className="text-lg text-gray-700 mb-2">Family Name: <span className="font-semibold text-[#b32a2a]">{successData.name}</span></p>
            <p className="text-lg text-gray-700 mb-6">Family Code: <span className="font-semibold text-[#b32a2a]">{successData.code}</span></p>
            <p className="text-gray-600 mb-6">Share this code with your family members so they can join!</p>
            <Link 
              to={`/families/${successData.id}`}
              className="bg-[#b32a2a] hover:bg-[#8a1f1f] text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              View Your New Family
            </Link>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-[#b32a2a] mb-6">Create New Family</h2>
            <form onSubmit={onSubmit}>
              {error && <div className="text-red-600 mb-4 text-center">{error}</div>}
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2 text-left" htmlFor="name">
                  Family Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={name}
                  onChange={onChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2 text-left" htmlFor="description">
                  Description (Optional)
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={description}
                  onChange={onChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-24"
                ></textarea>
              </div>
              <div className="flex items-center justify-center">
                <button
                  type="submit"
                  className="bg-[#b32a2a] hover:bg-[#8a1f1f] text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create Family'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </MainLayout>
  );
}

export default CreateFamilyPage; 