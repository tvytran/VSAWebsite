import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './Home';
import Login from './Login';
import Register from './Register';
import Families from './Families';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-[#faecd8]">
        {/* Navigation */}
        <nav className="bg-white shadow-md">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <Link to="/" className="text-xl font-bold text-[#b32a2a]">
                  VSA Website
                </Link>
              </div>
              <div className="flex space-x-4">
                <Link to="/" className="text-gray-700 hover:text-[#b32a2a]">
                  Home
                </Link>
                <Link to="/families" className="text-gray-700 hover:text-[#b32a2a]">
                  Families
                </Link>
                <Link to="/login" className="text-gray-700 hover:text-[#b32a2a]">
                  Login
                </Link>
                <Link to="/register" className="text-gray-700 hover:text-[#b32a2a]">
                  Register
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Routes */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/families" element={<Families />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;