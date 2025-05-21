import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './Home';
import Login from './Login';
import Register from './Register';
import Families from './Families';
import Profile from './Profile';
import FamilyDetails from './FamilyDetails';
import Navbar from './Navbar';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-[#faecd8]">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/families" element={<Families />} />
          <Route path="/families/:id" element={<FamilyDetails />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;