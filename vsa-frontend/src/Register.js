import React, { useState } from 'react';
import axios from 'axios';
//import './Register.css';

function Register({ onRegister }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [family, setFamily] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const res = await axios.post('http://localhost:5001/api/auth/register', {
        username,
        email,
        password,
        family,
      });
      setSuccess('Registration successful! You can now log in.');
      if (onRegister) onRegister(res.data.user);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#faecd8] flex items-center justify-center">
      <div className="text-center p-8 rounded-lg bg-white shadow">
        <h2 className="mb-6 text-2xl font-bold text-[#b32a2a]">Register</h2>
        <form onSubmit={handleSubmit}>
          <input
            className="block w-72 mx-auto my-4 p-3 border border-gray-300 rounded-lg text-lg"
            type="text"
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
          />
          <input
            className="block w-72 mx-auto my-4 p-3 border border-gray-300 rounded-lg text-lg"
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <input
            className="block w-72 mx-auto my-4 p-3 border border-gray-300 rounded-lg text-lg"
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          <input
            className="block w-72 mx-auto my-4 p-3 border border-gray-300 rounded-lg text-lg"
            type="text"
            placeholder="Family ID"
            value={family}
            onChange={e => setFamily(e.target.value)}
            required
          />
          <button
            className="block w-72 mx-auto my-4 py-4 bg-[#b32a2a] text-white rounded-2xl text-lg hover:bg-[#8a1f1f] transition"
            type="submit"
          >
            Register
          </button>
        </form>
        {error && <p className="text-red-600">{error}</p>}
        {success && <p className="text-green-600">{success}</p>}
      </div>
    </div>
  );
}

export default Register;