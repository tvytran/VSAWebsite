import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AnnouncementsSidebar from './components/AnnouncementsSidebar';
import axios from 'axios';

function MainLayout({ children }) {
  const isLoggedIn = !!localStorage.getItem('token');
  const isGuest = localStorage.getItem('isGuest') === 'true';

  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await axios.get('http://localhost:5001/api/auth/me', {
            headers: { 'x-auth-token': token }
          });
          setUserData(res.data.user);
          console.log('MainLayout fetched user data:', res.data.user);
        } catch (err) {
          console.error('Failed to fetch user data:', err);
        }
      }
    };

    fetchUserData();
  }, [isLoggedIn]);

  // If not logged in and not a guest, show the full layout
  if (!isLoggedIn && !isGuest) {
    return <div className="min-h-screen w-full bg-[#faecd8]">{children}</div>;
  }

  // For guests, show a simplified layout
  if (isGuest) {
    return (
      <div className="min-h-screen w-full bg-[#faecd8] flex flex-col">
        <div className="flex flex-1">
          {/* Left Sidebar */}
          <div className="w-64 bg-[#faecd8] flex flex-col items-center py-8 border-r border-[#e0c9a6] min-h-screen">
            <Link to="/">
              <img
                src="/logo.png"
                alt="Columbia VSA University"
                className="w-32 mb-8"
              />
            </Link>
            {/* Guest Profile Placeholder */}
            <div className="mb-8">
              <div className="w-24 h-24 bg-gray-400 rounded-full flex items-center justify-center text-white text-4xl font-bold">
                G
              </div>
            </div>
            <div className="flex flex-col space-y-4 w-full px-4">
              <Link to="/"><button className="w-full py-3 bg-white border-2 border-[#b32a2a] text-[#b32a2a] font-semibold rounded-md hover:bg-[#f5e6d6] transition duration-200 ease-in-out">Home</button></Link>
              <Link to="/families"><button className="w-full py-3 bg-white border-2 border-[#b32a2a] text-[#b32a2a] font-semibold rounded-md hover:bg-[#f5e6d6] transition duration-200 ease-in-out">Leaderboard</button></Link>
              <Link to="/about"><button className="w-full py-3 bg-white border-2 border-[#b32a2a] text-[#b32a2a] font-semibold rounded-md hover:bg-[#f5e6d6] transition duration-200 ease-in-out">About</button></Link>
              <Link to="/events"><button className="w-full py-3 bg-white border-2 border-[#b32a2a] text-[#b32a2a] font-semibold rounded-md hover:bg-[#f5e6d6] transition duration-200 ease-in-out">Events</button></Link>
              <Link to="/newsletter"><button className="w-full py-3 bg-white border-2 border-[#b32a2a] text-[#b32a2a] font-semibold rounded-md hover:bg-[#f5e6d6] transition duration-200 ease-in-out">Newsletter</button></Link>
              {/* Exit Guest Mode Button */}
              <button
                onClick={() => {
                  localStorage.removeItem('isGuest');
                  window.location.href = '/';
                }}
                className="w-full py-3 mt-8 bg-white border-2 border-gray-400 text-gray-700 font-semibold rounded-md hover:bg-gray-200 transition duration-200 ease-in-out"
              >
                Exit Guest Mode
              </button>
            </div>
          </div>
          {/* Main Content */}
          <div className="flex-1 flex flex-col items-center px-8 py-8">
            {children}
          </div>
          {/* Right Sidebar */}
          <div className="w-72 bg-[#faecd8] flex flex-col items-center py-8 border-l border-[#e0c9a6] min-h-screen">
            <div className="w-48 py-4 mb-8 bg-gray-300 text-gray-600 text-xl font-semibold rounded-md flex items-center justify-center">
              Guest Mode
            </div>
            <AnnouncementsSidebar />
          </div>
        </div>
      </div>
    );
  }

  // For logged-in users, show the full layout with sidebars
  return (
    <div className="min-h-screen w-full bg-[#faecd8] flex flex-col">
      <div className="flex flex-1">
        {/* Left Sidebar */}
        <div className="w-64 bg-[#faecd8] flex flex-col items-center py-8 border-r border-[#e0c9a6] min-h-screen">
          <Link to="/">
            <img
              src="/logo.png"
              alt="Columbia VSA University"
              className="w-32 mb-8"
            />
          </Link>
          {/* User Profile Picture/Placeholder */}
          {isLoggedIn && (
            <Link to="/profile" className="mb-8">
              <div className="w-24 h-24 bg-gray-400 rounded-full flex items-center justify-center text-white text-4xl font-bold overflow-hidden">
                {/* Conditional rendering based on whether profile picture exists */}
                {userData && userData.profilePicture ? (
                  <img
                    src={`http://localhost:5001${userData.profilePicture}`}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  userData && userData.username ? (
                    <span>{userData.username.charAt(0).toUpperCase()}</span>
                  ) : (
                    <span>?</span> // Fallback if username is not available
                  )
                )}
              </div>
            </Link>
          )}
          <div className="flex flex-col space-y-4 w-full px-4">
            <Link to="/"><button className="w-full py-3 bg-white border-2 border-[#b32a2a] text-[#b32a2a] font-semibold rounded-md hover:bg-[#f5e6d6] transition duration-200 ease-in-out">Home</button></Link>
            <Link to="/profile"><button className="w-full py-3 bg-white border-2 border-[#b32a2a] text-[#b32a2a] font-semibold rounded-md hover:bg-[#f5e6d6] transition duration-200 ease-in-out">Profile</button></Link>
            <Link to="/families"><button className="w-full py-3 bg-white border-2 border-[#b32a2a] text-[#b32a2a] font-semibold rounded-md hover:bg-[#f5e6d6] transition duration-200 ease-in-out">Leaderboard</button></Link>
            <Link to="/about"><button className="w-full py-3 bg-white border-2 border-[#b32a2a] text-[#b32a2a] font-semibold rounded-md hover:bg-[#f5e6d6] transition duration-200 ease-in-out">About</button></Link>
            <Link to="/events"><button className="w-full py-3 bg-white border-2 border-[#b32a2a] text-[#b32a2a] font-semibold rounded-md hover:bg-[#f5e6d6] transition duration-200 ease-in-out">Events</button></Link>
            <Link to="/newsletter"><button className="w-full py-3 bg-white border-2 border-[#b32a2a] text-[#b32a2a] font-semibold rounded-md hover:bg-[#f5e6d6] transition duration-200 ease-in-out">Newsletter</button></Link>
            {/* Logout Button */}
            {isLoggedIn && (
              <button
                onClick={() => {
                  localStorage.removeItem('token');
                  localStorage.removeItem('isGuest');
                  window.location.href = '/';
                }}
                className="w-full py-3 mt-8 bg-white border-2 border-gray-400 text-gray-700 font-semibold rounded-md hover:bg-gray-200 transition duration-200 ease-in-out"
              >
                Logout
              </button>
            )}
          </div>
        </div>
        {/* Main Content */}
        <div className="flex-1 flex flex-col items-center px-8 py-8">
          {children}
        </div>
        {/* Right Sidebar */}
        <div className="w-72 bg-[#faecd8] flex flex-col items-center py-8 border-l border-[#e0c9a6] min-h-screen">
          <AnnouncementsSidebar />
        </div>
      </div>
    </div>
  );
}

export default MainLayout; 