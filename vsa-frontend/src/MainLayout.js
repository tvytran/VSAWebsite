import React from 'react';
import { Link } from 'react-router-dom';

function MainLayout({ children }) {
  return (
    <div className="min-h-screen w-full bg-[#faecd8] flex flex-col">
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
          {children}
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

export default MainLayout; 