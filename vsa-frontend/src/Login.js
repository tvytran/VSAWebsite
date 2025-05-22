import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Login({ setIsLoggedIn }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await axios.post('http://localhost:5001/api/auth/login', {
        email,
        password,
      });
      localStorage.setItem('token', res.data.token);
      setIsLoggedIn(true);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#faecd8] flex items-center justify-center">
      <div className="text-center p-8 rounded-lg bg-white shadow">
        <h2 className="mb-6 text-2xl font-bold text-[#b32a2a]">Login</h2>
        <form onSubmit={handleSubmit}>
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
          <button
            className="block w-72 mx-auto my-4 py-4 bg-[#b32a2a] text-white rounded-lg text-lg hover:bg-[#8a1f1f] transition duration-200 ease-in-out"
            type="submit"
          >
            Login
          </button>
        </form>
        {error && <p className="text-red-600">{error}</p>}
      </div>
    </div>
  );
}

export default Login;