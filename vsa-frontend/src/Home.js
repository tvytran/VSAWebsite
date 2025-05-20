import React from 'react';
import { Link } from 'react-router-dom';
//import './Home.css'; // We'll add styles here

function Home({ onLoginClick, onRegisterClick, onGuestClick }) {
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
            className="block w-72 mx-auto my-4 py-4 bg-[#b32a2a] text-white rounded-2xl text-lg hover:bg-[#8a1f1f] transition"
          >
            Login
          </button>
        </Link>
        <Link to="/register">
          <button
            className="block w-72 mx-auto my-4 py-4 bg-[#b32a2a] text-white rounded-2xl text-lg hover:bg-[#8a1f1f] transition"
          >
            Register
          </button>
        </Link>
        <button
          className="block w-72 mx-auto my-4 py-4 bg-[#b32a2a] text-white rounded-2xl text-lg hover:bg-[#8a1f1f] transition"
          onClick={onGuestClick}
        >
          Guest
        </button>
      </div>
    </div>
  );
}

export default Home;