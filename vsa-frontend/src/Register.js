import React, { useState } from 'react';
import api from './api';
import PlusCircleIcon from '@heroicons/react/24/solid/PlusCircleIcon'; // Import PlusCircleIcon directly
import { Link } from 'react-router-dom';
//import './Register.css';

function Register({ onRegister }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [family_id, setFamily_id] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const validatePassword = (password) => {
    const errors = [];
    if (password.length < 6) errors.push('Password must be at least 6 characters long');
    if (!/[a-z]/.test(password)) errors.push('Password must contain at least one lowercase letter');
    if (!/[A-Z]/.test(password)) errors.push('Password must contain at least one uppercase letter');
    if (!/\d/.test(password)) errors.push('Password must contain at least one number');
    if (!/[^A-Za-z0-9]/.test(password)) errors.push('Password must contain at least one special character');
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    
    // Client-side validation
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      setError(`Password requirements not met: ${passwordErrors.join(', ')}`);
      setLoading(false);
      return;
    }

    if (!username.trim()) {
      setError('Username is required');
      setLoading(false);
      return;
    }

    if (!email.trim()) {
      setError('Email is required');
      setLoading(false);
      return;
    }

    if (!family_id.trim()) {
      setError('Family code is required');
      setLoading(false);
      return;
    }
    
    const registrationData = {
      username: username.trim(),
      email: email.trim(),
      password,
      family: family_id.trim(),
      role: 'member'
    };
    
    console.log('Attempting registration with data:', registrationData);
    console.log('API base URL:', process.env.REACT_APP_API_URL || 'http://localhost:5001');
    
    try {
      const res = await api.post('/api/auth/register', registrationData);
      console.log('Registration successful:', res.data);
      setSuccess('Registration successful! You can now log in.');
      if (onRegister) onRegister(res.data.user);
    } catch (err) {
      console.error('Registration error:', err);
      console.error('Error response:', err.response);
      
      // Handle specific error messages from backend
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.response?.data?.errors) {
        // Handle validation errors from backend
        const errorMessages = err.response.data.errors.map(error => error.msg).join(', ');
        setError(errorMessages);
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#faecd8] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-[#b32a2a]">
            Register for an account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}
          {success && (
             <div className="rounded-md bg-green-50 p-4">
              <div className="text-sm text-green-700">{success}</div>
            </div>
          )}
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="username" className="sr-only">Username</label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-[#b32a2a] focus:border-[#b32a2a] focus:z-10 sm:text-sm"
                placeholder="Username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="email" className="sr-only">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-[#b32a2a] focus:border-[#b32a2a] focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-[#b32a2a] focus:border-[#b32a2a] focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="sr-only">Confirm Password</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-[#b32a2a] focus:border-[#b32a2a] focus:z-10 sm:text-sm"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                disabled={loading}
              />
            </div>
             <div>
              <label htmlFor="family_id" className="sr-only">Family Code</label>
              <input
                id="family_id"
                name="family_id"
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-[#b32a2a] focus:border-[#b32a2a] focus:z-10 sm:text-sm"
                placeholder="Family Code"
                value={family_id}
                onChange={e => setFamily_id(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          {/* Password Requirements */}
          <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded">
            <p className="font-semibold mb-2">Password Requirements:</p>
            <ul className="space-y-1">
              <li className={password.length >= 6 ? 'text-green-600' : 'text-gray-500'}>✓ At least 6 characters long</li>
              <li className={/[a-z]/.test(password) ? 'text-green-600' : 'text-gray-500'}>✓ Contains lowercase letter</li>
              <li className={/[A-Z]/.test(password) ? 'text-green-600' : 'text-gray-500'}>✓ Contains uppercase letter</li>
              <li className={/\d/.test(password) ? 'text-green-600' : 'text-gray-500'}>✓ Contains number</li>
              <li className={/[^A-Za-z0-9]/.test(password) ? 'text-green-600' : 'text-gray-500'}>✓ Contains special character</li>
            </ul>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[#b32a2a] hover:bg-[#8a1f1f] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#b32a2a] disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? 'Registering...' : 'Register'}
            </button>
          </div>
        </form>
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-[#b32a2a] hover:text-[#8a1f1f]">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;