import React from 'react';
import { Link } from 'react-router-dom';
//import './Home.css'; // We'll add styles here

function Home() {
  const handleGuestClick = () => {
    // Clear any existing auth state
    localStorage.removeItem('token');
    // Set guest mode
    localStorage.setItem('isGuest', 'true');
    // Force reload
    window.location.reload();
  };

  return (
    <div className="min-h-screen w-full bg-[#faecd8] flex items-center justify-center">
      <div className="text-center p-8 rounded-lg bg-white shadow">
        <img
          src="/logo.png"
          alt="Columbia VSA University"
          className="w-[350px] max-w-full mb-8 mx-auto"
        />
        <Link to="/login">
          <button
            className="block w-72 mx-auto my-4 py-4 bg-[#b32a2a] text-white rounded-lg text-lg hover:bg-[#8a1f1f] transition duration-200 ease-in-out"
          >
            Login
          </button>
        </Link>
        <Link to="/register">
          <button
            className="block w-72 mx-auto my-4 py-4 bg-[#b32a2a] text-white rounded-lg text-lg hover:bg-[#8a1f1f] transition duration-200 ease-in-out"
          >
            Register
          </button>
        </Link>
        <button
          onClick={handleGuestClick}
          className="block w-72 mx-auto my-4 py-4 bg-[#b32a2a] text-white rounded-lg text-lg hover:bg-[#8a1f1f] transition duration-200 ease-in-out"
        >
          Guest
        </button>
      </div>
    </div>
  );
}

export default Home;