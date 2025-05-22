import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Navbar({ setIsLoggedIn }) {
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem('token');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('isGuest');
    setIsLoggedIn(false);
    window.location.href = '/';
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex space-x-4">
            <Link to="/" className="text-gray-700 hover:text-[#b32a2a]">Home</Link>
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