import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './Home';
import Login from './Login';
import Register from './Register';
import Families from './Families';
import Profile from './Profile';
import FamilyDetails from './FamilyDetails';
import Navbar from './Navbar';
import Leaderboard from './Leaderboard';
import Events from './Events';
import Newsletter from './Newsletter';
import AboutVSA from './AboutVSA';
import DashboardHome from './DashboardHome';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));

  return (
    <Router>
      <div className="min-h-screen bg-[#faecd8]">
        <Navbar setIsLoggedIn={setIsLoggedIn} />
        <Routes>
          <Route path="/" element={isLoggedIn ? <DashboardHome /> : <Home />} />
          <Route path="/login" element={<Login setIsLoggedIn={setIsLoggedIn} />} />
          <Route path="/register" element={<Register />} />
          <Route path="/families" element={<Families />} />
          <Route path="/families/:id" element={<FamilyDetails />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/events" element={<Events />} />
          <Route path="/newsletter" element={<Newsletter />} />
          <Route path="/about" element={<AboutVSA />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;