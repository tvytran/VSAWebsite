import React from 'react';
import { Link } from 'react-router-dom';

function DashboardHome() {
  return (
    <div className="min-h-screen w-full bg-[#faecd8] flex flex-col">
      {/* Top Bar */}
      <div className="flex flex-1">
        {/* Left Sidebar */}
        <div className="w-64 bg-[#faecd8] flex flex-col items-center py-8 border-r border-[#e0c9a6] min-h-screen">
          <img
            src="/logo.png"
            alt="Columbia VSA University"
            className="w-32 mb-8"
          />
          <div className="flex flex-col space-y-4 w-full px-4">
            <Link to="/profile"><button className="w-full py-3 bg-white border-2 border-[#b32a2a] text-[#b32a2a] font-semibold rounded-md hover:bg-[#f5e6d6]">Profile</button></Link>
            <Link to="/about"><button className="w-full py-3 bg-white border-2 border-[#b32a2a] text-[#b32a2a] font-semibold rounded-md hover:bg-[#f5e6d6]">About VSA</button></Link>
            <Link to="/families"><button className="w-full py-3 bg-white border-2 border-[#b32a2a] text-[#b32a2a] font-semibold rounded-md hover:bg-[#f5e6d6]">Families</button></Link>
            <Link to="/events"><button className="w-full py-3 bg-white border-2 border-[#b32a2a] text-[#b32a2a] font-semibold rounded-md hover:bg-[#f5e6d6]">Events</button></Link>
            <Link to="/newsletter"><button className="w-full py-3 bg-white border-2 border-[#b32a2a] text-[#b32a2a] font-semibold rounded-md hover:bg-[#f5e6d6]">Newsletter</button></Link>
          </div>
        </div>
        {/* Main Content */}
        <div className="flex-1 flex flex-col items-center px-8 py-8">
          {/* Search Bar */}
          <div className="w-full max-w-2xl flex items-center mb-6">
            <input
              type="text"
              placeholder="Search"
              className="flex-1 border-2 border-[#b32a2a] rounded-md px-4 py-2 text-lg focus:outline-none focus:border-[#8a1f1f]"
            />
            <button className="ml-2 px-4 py-2 border-2 border-[#b32a2a] rounded-md bg-white hover:bg-[#f5e6d6]">
              <span role="img" aria-label="search">🔍</span>
            </button>
          </div>
          {/* Family Circles */}
          <div className="flex justify-center space-x-8 mb-6">
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 rounded-full border-4 border-[#b32a2a] flex items-center justify-center bg-white mb-2">Ho Chi...</div>
              <span className="text-sm font-semibold">Ho Chi...</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 rounded-full border-4 border-[#b32a2a] flex items-center justify-center bg-white mb-2">Bánh bao</div>
              <span className="text-sm font-semibold">Bánh bao</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 rounded-full border-4 border-[#b32a2a] flex items-center justify-center bg-white mb-2">25E</div>
              <span className="text-sm font-semibold">25E</span>
            </div>
          </div>
          {/* Post Input */}
          <div className="w-full max-w-2xl mb-6">
            <input
              type="text"
              placeholder="Post Your Family's Hangouts..."
              className="w-full border-2 border-[#b32a2a] rounded-md px-4 py-3 text-lg focus:outline-none focus:border-[#8a1f1f]"
              disabled
            />
          </div>
          {/* Feed Post Card */}
          <div className="w-full max-w-2xl bg-white rounded-lg shadow-md mb-6">
            <img src="https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=facearea&w=600&q=80" alt="Family Hangout" className="w-full h-64 object-cover rounded-t-lg" />
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-[#b32a2a]">Ho Chi Honeys • Sept 29, 2024</span>
                <span className="text-gray-400 text-sm">❤️ 11</span>
              </div>
              <div className="text-gray-700 mb-1">Family study date! <span className="text-green-600 font-bold">+5pts</span></div>
            </div>
          </div>
        </div>
        {/* Right Sidebar */}
        <div className="w-72 bg-[#faecd8] flex flex-col items-center py-8 border-l border-[#e0c9a6] min-h-screen">
          <button className="w-48 py-4 mb-8 bg-white border-2 border-[#b32a2a] text-[#222] text-xl font-semibold rounded-md hover:bg-[#f5e6d6]">Create</button>
          <div className="w-48 bg-white border-2 border-[#b32a2a] rounded-md p-4">
            <h2 className="text-xl font-bold mb-2">Announcements</h2>
            <p className="text-gray-600">No announcements yet.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardHome; 