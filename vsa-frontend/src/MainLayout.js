import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AnnouncementsSidebar from './components/AnnouncementsSidebar';
import api from './api';

function MainLayout({ children }) {
  const isLoggedIn = !!localStorage.getItem('token');
  const isGuest = localStorage.getItem('isGuest') === 'true';

  const [userData, setUserData] = useState(null);
  const [topFamilies, setTopFamilies] = useState([]);
  const [loadingFamilies, setLoadingFamilies] = useState(true);
  const [familiesError, setFamiliesError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await api.get('/api/auth/me', {
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

  useEffect(() => {
    const fetchTopFamilies = async () => {
      setLoadingFamilies(true);
      setFamiliesError('');
      const token = localStorage.getItem('token');
      if (!token) {
        setFamiliesError('Login to see the leaderboard.');
        setLoadingFamilies(false);
        return;
      }
      try {
        const res = await api.get('/api/families/leaderboard', {
          headers: { 'x-auth-token': token }
        });
        if (res.data.success && Array.isArray(res.data.families)) {
          setTopFamilies(res.data.families.slice(0, 5));
        } else {
          setFamiliesError('Invalid leaderboard data.');
        }
        setLoadingFamilies(false);
      } catch (err) {
        console.error('Error fetching top families:', err);
        setFamiliesError(err.response?.data?.message || 'Failed to load leaderboard.');
        setLoadingFamilies(false);
      }
    };

    if (isLoggedIn) {
      fetchTopFamilies();
    }
  }, [isLoggedIn]);

  // If not logged in and not a guest, show the full layout
  if (!isLoggedIn && !isGuest) {
    return <div className="min-h-screen w-full bg-[#faecd8]">{children}</div>;
  }

  // For guests, show a simplified layout
  if (isGuest) {
    return (
      <div className="min-h-screen w-full bg-[#faecd8] flex flex-col font-sans">
        <div className="flex flex-1">
          {/* Left Sidebar */}
          <div className="w-64 bg-white flex flex-col items-center py-8 border-r border-[#e0c9a6] min-h-screen">
            <Link to="/" className="hover:opacity-90 transition-opacity duration-200 group">
              <img
                src="https://nnlbviehgtdyiucgdims.supabase.co/storage/v1/object/public/vsa-images/public/logo.PNG"
                alt="Columbia VSA University"
                className="w-32 mb-8 group-hover:scale-105 transition-transform duration-300 ease-in-out"
              />
            </Link>
            {/* Guest Profile Placeholder */}
            <div className="mb-8 group">
              <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 text-4xl font-bold ring-4 ring-transparent group-hover:ring-[#ffcc00] transition-all duration-300 ease-in-out">
                G
              </div>
            </div>
            <div className="flex flex-col space-y-2 w-full px-4">
              <Link to="/"><button className="w-full py-2 border border-gray-300 text-gray-700 font-semibold rounded-md hover:bg-gray-100 hover:text-[#b32a2a] hover:scale-105 transition-all duration-300 ease-in-out text-base transform">Home</button></Link>
              <Link to="/families"><button className="w-full py-2 border border-gray-300 text-gray-700 font-semibold rounded-md hover:bg-gray-100 hover:text-[#b32a2a] hover:scale-105 transition-all duration-300 ease-in-out text-base transform">Leaderboard</button></Link>
              <Link to="/about"><button className="w-full py-2 border border-gray-300 text-gray-700 font-semibold rounded-md hover:bg-gray-100 hover:text-[#b32a2a] hover:scale-105 transition-all duration-300 ease-in-out text-base transform">About</button></Link>
              <Link to="/events"><button className="w-full py-2 border border-gray-300 text-gray-700 font-semibold rounded-md hover:bg-gray-100 hover:text-[#b32a2a] hover:scale-105 transition-all duration-300 ease-in-out text-base transform">Events</button></Link>
              <Link to="/newsletter"><button className="w-full py-2 border border-gray-300 text-gray-700 font-semibold rounded-md hover:bg-gray-100 hover:text-[#b32a2a] hover:scale-105 transition-all duration-300 ease-in-out text-base transform">Newsletter</button></Link>
              {/* Exit Guest Mode Button */}
              <button
                onClick={() => {
                  localStorage.removeItem('isGuest');
                  window.location.href = '/';
                }}
                className="w-full py-2 mt-4 border border-gray-300 text-gray-700 font-semibold rounded-md hover:bg-gray-100 hover:scale-105 transition-all duration-300 ease-in-out text-base transform"
              >
                Exit Guest Mode
              </button>
            </div>
          </div>
          {/* Main Content */}
          <div className="flex-1 flex flex-col items-center px-8 py-8 bg-[#faecd8] font-sans">
            {children}
          </div>
          {/* Right Sidebar */}
          <div className="w-72 bg-[#fff9f0] flex flex-col items-center py-8 border-l border-[#e0c9a6] min-h-screen shadow-lg">
            <div className="w-full px-4">
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="bg-[#ffcc00] px-4 py-3">
                  <h2 className="text-lg font-medium text-white">Announcements</h2>
                </div>
                <div className="p-4">
                  <AnnouncementsSidebar />
                </div>
              </div>
              {/* Leaderboard Summary */}
              <div className="bg-white rounded-lg shadow-sm overflow-hidden mt-6">
                 <div className="bg-[#ffcc00] px-4 py-3">
                   <h2 className="text-lg font-medium text-white">Leaderboard</h2>
                 </div>
                 <div className="p-4">
                   {loadingFamilies ? (
                     <p className="text-gray-600">Loading leaderboard...</p>
                   ) : familiesError ? (
                     <p className="text-red-600">{familiesError}</p>
                   ) : topFamilies.length === 0 ? (
                     <p className="text-gray-600">No families on the leaderboard yet.</p>
                   ) : (
                     <ul className="space-y-2">
                       {topFamilies.map((family, index) => (
                         <li key={family._id} className="flex justify-between items-center text-gray-700 text-sm">
                           <span>#{index + 1} {family.name}</span>
                           <span className="font-medium text-[#ffcc00]">{family.totalPoints || 0} pts</span>
                         </li>
                       ))}
                     </ul>
                   )}
                   {!loadingFamilies && !familiesError && (
                      <div className="mt-4 text-center">
                        <Link to="/families" className="text-sm text-[#b32a2a] hover:underline">
                          View Full Leaderboard
                        </Link>
                      </div>
                   )}
                 </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // For logged-in users, show the full layout with sidebars
  return (
    <div className="min-h-screen w-full bg-[#faecd8] flex flex-col font-sans">
      <div className="flex flex-1">
        {/* Left Sidebar */}
        <div className="w-64 bg-white flex flex-col items-center py-8 border-r border-[#e0c9a6] min-h-screen shadow-lg">
          <Link to="/" className="hover:opacity-90 transition-opacity duration-200 group">
            <img
              src="/logo.png"
              alt="Columbia VSA University"
              className="w-32 mb-8 group-hover:scale-105 transition-transform duration-300 ease-in-out"
            />
          </Link>
          {/* User Profile Picture/Placeholder */}
          {isLoggedIn && (
            <Link to="/profile" className="mb-6 group">
              <div className="w-24 h-24 bg-[#e0c9a6] rounded-full flex items-center justify-center text-white text-4xl font-bold overflow-hidden ring-4 ring-[#faecd8] group-hover:ring-[#EFB639] transition-all duration-300 ease-in-out">
                {userData && userData.profilePicture ? (
                  <img
                    src={userData.profilePicture}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  userData && userData.username ? (
                    <span>{userData.username.charAt(0).toUpperCase()}</span>
                  ) : (
                    <span>?</span>
                  )
                )}
              </div>
              {userData && userData.username && (
                <p className="text-center mt-2 text-gray-700 font-medium group-hover:text-[#b32a2a] transition-colors duration-200">
                  {userData.username}
                </p>
              )}
            </Link>
          )}
          <div className="flex flex-col space-y-3 w-full px-4">
            <Link to="/">
              <button className="w-full py-2.5 bg-white text-gray-700 font-medium rounded-lg hover:bg-[#e0c9a6] hover:text-[#b32a2a] hover:scale-105 transition-all duration-300 ease-in-out text-base shadow-sm flex items-center justify-center transform">
                Home
              </button>
            </Link>
            <Link to="/profile">
              <button className="w-full py-2.5 bg-white text-gray-700 font-medium rounded-lg hover:bg-[#e0c9a6] hover:text-[#b32a2a] hover:scale-105 transition-all duration-300 ease-in-out text-base shadow-sm flex items-center justify-center transform">
                Profile
              </button>
            </Link>
            <Link to="/families">
              <button className="w-full py-2.5 bg-white text-gray-700 font-medium rounded-lg hover:bg-[#e0c9a6] hover:text-[#b32a2a] hover:scale-105 transition-all duration-300 ease-in-out text-base shadow-sm flex items-center justify-center transform">
                Leaderboard
              </button>
            </Link>
            <Link to="/about">
              <button className="w-full py-2.5 bg-white text-gray-700 font-medium rounded-lg hover:bg-[#e0c9a6] hover:text-[#b32a2a] hover:scale-105 transition-all duration-300 ease-in-out text-base shadow-sm flex items-center justify-center transform">
                About
              </button>
            </Link>
            <Link to="/events">
              <button className="w-full py-2.5 bg-white text-gray-700 font-medium rounded-lg hover:bg-[#e0c9a6] hover:text-[#b32a2a] hover:scale-105 transition-all duration-300 ease-in-out text-base shadow-sm flex items-center justify-center transform">
                Events
              </button>
            </Link>
            <Link to="/newsletter">
              <button className="w-full py-2.5 bg-white text-gray-700 font-medium rounded-lg hover:bg-[#e0c9a6] hover:text-[#b32a2a] hover:scale-105 transition-all duration-300 ease-in-out text-base shadow-sm flex items-center justify-center transform">
                Newsletter
              </button>
            </Link>
            {/* Admin Dashboard Link */}
            {isLoggedIn && userData && userData.role === 'admin' && (
              <Link to="/admin">
                <button className="w-full py-2.5 bg-[#b32a2a] text-white font-medium rounded-lg hover:bg-[#8a1f1f] hover:scale-105 transition-all duration-300 ease-in-out text-base shadow-sm flex items-center justify-center transform">
                  Admin Dashboard
                </button>
              </Link>
            )}
            {/* Logout Button */}
            {isLoggedIn && (
              <button
                onClick={() => {
                  localStorage.removeItem('token');
                  localStorage.removeItem('user');
                  localStorage.removeItem('isGuest');
                  window.location.href = '/';
                }}
                className="w-full py-2.5 mt-4 bg-[#e0c9a6] text-white font-medium rounded-lg hover:bg-[#d4b78f] hover:scale-105 transition-all duration-300 ease-in-out text-base shadow-sm flex items-center justify-center transform"
              >
                Logout
              </button>
            )}
            {/* Instagram Link below Logout */}
            {isLoggedIn && (
              <a href="https://www.instagram.com/columbia.vsa" target="_blank" rel="noopener noreferrer" className="mt-4 flex justify-center opacity-75 hover:opacity-100 transition-opacity duration-200">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="currentColor" className="bi bi-instagram" viewBox="0 0 16 16">
                  <path d="M8 0C5.829 0 5.556.01 4.703.048 3.85.088 3.269.222 2.76.42a3.9 3.9 0 0 0-1.417.923A3.9 3.9 0 0 0 .42 2.76C.222 3.268.087 3.85.048 4.7.01 5.555 0 5.827 0 8.001c0 2.172.01 2.444.048 3.297.04.852.174 1.433.372 1.942.205.526.478.972.923 1.417.444.445.89.719 1.416.923.51.198 1.09.333 1.942.372C5.555 15.99 5.827 16 8 16s2.444-.01 3.298-.048c.851-.04 1.434-.174 1.943-.372a3.9 3.9 0 0 0 1.416-.923c.445-.445.718-.891.923-1.417.197-.509.332-1.09.372-1.942C15.99 10.445 16 10.173 16 8s-.01-2.445-.048-3.299c-.04-.851-.175-1.433-.372-1.941a3.9 3.9 0 0 0-.923-1.417A3.9 3.9 0 0 0 13.24.42c-.51-.198-1.092-.333-1.943-.372C10.443.01 10.172 0 7.998 0zm-.717 1.442h.718c2.136 0 2.389.007 3.232.046.78.035 1.204.166 1.486.275.373.145.64.319.92.599s.453.546.598.92c.11.281.24.705.275 1.485.039.843.047 1.096.047 3.231s-.008 2.389-.047 3.232c-.035.78-.166 1.203-.275 1.485a2.5 2.5 0 0 1-.599.919c-.28.28-.546.453-.92.598-.28.11-.704.24-1.485.276-.843.038-1.096.047-3.232.047s-2.39-.009-3.233-.047c-.78-.036-1.203-.166-1.485-.276a2.5 2.5 0 0 1-.92-.598 2.5 2.5 0 0 1-.6-.92c-.109-.281-.24-.705-.275-1.485-.038-.843-.046-1.096-.046-3.233s.008-2.388.046-3.231c.036-.78.166-1.204.276-1.486.145-.373.319-.64.599-.92s.546-.453.92-.598c.282-.11.705-.24 1.485-.276.738-.034 1.024-.044 2.515-.045zm4.988 1.328a.96.96 0 1 0 0 1.92.96.96 0 0 0 0-1.92m-4.27 1.122a4.109 4.109 0 1 0 0 8.217 4.109 4.109 0 0 0 0-8.217m0 1.441a2.667 2.667 0 1 1 0 5.334 2.667 2.667 0 0 1 0-5.334"/>
                </svg>
              </a>
            )}
          </div>
        </div>
        {/* Main Content */}
        <div className="flex-1 flex flex-col items-center px-8 py-8 bg-[#faecd8] font-sans">
          {children}
        </div>
        {/* Right Sidebar */}
        <div className="w-72 bg-[#fff9f0] flex flex-col items-center py-8 border-l border-[#e0c9a6] min-h-screen shadow-lg">
          <div className="w-full px-4">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="bg-[#EFB639] px-4 py-3">
                <h2 className="text-lg font-medium text-white">Announcements</h2>
              </div>
              <div className="p-4">
          <AnnouncementsSidebar />
              </div>
            </div>
            {/* Leaderboard Summary */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden mt-6">
               <div className="bg-[#EFB639] px-4 py-3">
                 <h2 className="text-lg font-medium text-white">Leaderboard</h2>
               </div>
               <div className="p-4">
                 {loadingFamilies ? (
                   <p className="text-gray-600">Loading leaderboard...</p>
                 ) : familiesError ? (
                   <p className="text-red-600">{familiesError}</p>
                 ) : topFamilies.length === 0 ? (
                   <p className="text-gray-600">No families on the leaderboard yet.</p>
                 ) : (
                   <ul className="space-y-2">
                     {topFamilies.map((family, index) => (
                       <li key={family._id} className="flex justify-between items-center text-gray-700 text-sm">
                         <span>#{index + 1} {family.name}</span>
                         <span className="font-medium text-[#EFB639]">{family.totalPoints || 0} pts</span>
                       </li>
                     ))}
                   </ul>
                 )}
                 {!loadingFamilies && !familiesError && (
                    <div className="mt-4 text-center">
                      <Link to="/families" className="text-sm text-[#b32a2a] hover:underline">
                        View Full Leaderboard
                      </Link>
                    </div>
                 )}
               </div>
             </div>
            {/* Instagram Link at the bottom left */}
            {isLoggedIn && (
              <a href="https://www.instagram.com/columbia.vsa" target="_blank" rel="noopener noreferrer" className="mt-auto mb-4 ml-4 flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="currentColor" className="bi bi-instagram opacity-75 hover:opacity-100 transition-opacity duration-200" viewBox="0 0 16 16">
                  <path d="M8 0C5.829 0 5.556.01 4.703.048 3.85.088 3.269.222 2.76.42a3.9 3.9 0 0 0-1.417.923A3.9 3.9 0 0 0 .42 2.76C.222 3.268.087 3.85.048 4.7.01 5.555 0 5.827 0 8.001c0 2.172.01 2.444.048 3.297.04.852.174 1.433.372 1.942.205.526.478.972.923 1.417.444.445.89.719 1.416.923.51.198 1.09.333 1.942.372C5.555 15.99 5.827 16 8 16s2.444-.01 3.298-.048c.851-.04 1.434-.174 1.943-.372a3.9 3.9 0 0 0 1.416-.923c.445-.445.718-.891.923-1.417.197-.509.332-1.09.372-1.942C15.99 10.445 16 10.173 16 8s-.01-2.445-.048-3.299c-.04-.851-.175-1.433-.372-1.941a3.9 3.9 0 0 0-.923-1.417A3.9 3.9 0 0 0 13.24.42c-.51-.198-1.092-.333-1.943-.372C10.443.01 10.172 0 7.998 0zm-.717 1.442h.718c2.136 0 2.389.007 3.232.046.78.035 1.204.166 1.486.275.373.145.64.319.92.599s.453.546.598.92c.11.281.24.705.275 1.485.039.843.047 1.096.047 3.231s-.008 2.389-.047 3.232c-.035.78-.166 1.203-.275 1.485a2.5 2.5 0 0 1-.599.919c-.28.28-.546.453-.92.598-.28.11-.704.24-1.485.276-.843.038-1.096.047-3.232.047s-2.39-.009-3.233-.047c-.78-.036-1.203-.166-1.485-.276a2.5 2.5 0 0 1-.92-.598 2.5 2.5 0 0 1-.6-.92c-.109-.281-.24-.705-.275-1.485-.038-.843-.046-1.096-.046-3.233s.008-2.388.046-3.231c.036-.78.166-1.204.276-1.486.145-.373.319-.64.599-.92s.546-.453.92-.598c.282-.11.705-.24 1.485-.276.738-.034 1.024-.044 2.515-.045zm4.988 1.328a.96.96 0 1 0 0 1.92.96.96 0 0 0 0-1.92m-4.27 1.122a4.109 4.109 0 1 0 0 8.217 4.109 4.109 0 0 0 0-8.217m0 1.441a2.667 2.667 0 1 1 0 5.334 2.667 2.667 0 0 1 0-5.334"/>
                </svg>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MainLayout; 