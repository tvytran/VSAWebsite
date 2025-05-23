import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './Home';
import Login from './Login';
import Register from './Register';
import Profile from './Profile';
import FamilyDetails from './FamilyDetails';
import Navbar from './Navbar';
import Events from './Events';
import Newsletter from './Newsletter';
import AboutVSA from './AboutVSA';
import DashboardHome from './DashboardHome';
import FamiliesLeaderboard from './FamiliesLeaderboard';
import CreatePostPage from './CreatePostPage';
import CreateFamilyPage from './CreateFamilyPage';
import AdminDashboard from './AdminDashboard';

// Protected Route component
const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  if (!token) {
    return <Navigate to="/login" />;
  }

  if (requireAdmin && user.role !== 'admin') {
    return <Navigate to="/dashboard" />;
  }

  return children;
};

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const [isGuest, setIsGuest] = useState(localStorage.getItem('isGuest') === 'true');

  // Update state when localStorage changes
  useEffect(() => {
    const handleStorageChange = () => {
      setIsLoggedIn(!!localStorage.getItem('token'));
      setIsGuest(localStorage.getItem('isGuest') === 'true');
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-[#faecd8]">
        <Routes>
          <Route path="/" element={
            isLoggedIn ? <DashboardHome /> : 
            isGuest ? <DashboardHome /> : 
            <Home />
          } />
          <Route path="/login" element={<Login setIsLoggedIn={setIsLoggedIn} />} />
          <Route path="/register" element={<Register />} />
          <Route path="/families" element={<FamiliesLeaderboard />} />
          <Route path="/families/:id" element={<FamilyDetails />} />
          <Route path="/events" element={<Events />} />
          <Route path="/newsletter" element={<Newsletter />} />
          <Route path="/about" element={<AboutVSA />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardHome />
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute requireAdmin={true}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="/create-post" element={
            <ProtectedRoute>
              <CreatePostPage />
            </ProtectedRoute>
          } />
          <Route path="/create-family" element={
            <ProtectedRoute>
              <CreateFamilyPage />
            </ProtectedRoute>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;