import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Navbar() {
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem('token');

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold text-[#b32a2a]">
              VSA
            </Link>
          </div>
          <div className="flex space-x-4">
            <Link to="/" className="text-gray-700 hover:text-[#b32a2a]">Home</Link>
            <Link to="/families" className="text-gray-700 hover:text-[#b32a2a]">Families</Link>
            {!isLoggedIn && (
              <>
                <Link to="/login" className="text-gray-700 hover:text-[#b32a2a]">Login</Link>
                <Link to="/register" className="text-gray-700 hover:text-[#b32a2a]">Register</Link>
              </>
            )}
            {isLoggedIn && (
              <>
                <Link to="/profile" className="text-gray-700 hover:text-[#b32a2a]">Profile</Link>
                <button onClick={handleLogout} className="text-gray-700 hover:text-[#b32a2a]">Logout</button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar; 