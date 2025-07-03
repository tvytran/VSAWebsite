import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import Home from './Home';
import Login from './Login';
import Register from './Register';
import Profile from './Profile';
import FamilyDetails from './FamilyDetails';
import Events from './Events';
import Newsletter from './Newsletter';
import AboutVSA from './AboutVSA';
import DashboardHome from './DashboardHome';
import FamiliesLeaderboard from './FamiliesLeaderboard';
import CreatePostPage from './CreatePostPage';
import CreateFamilyPage from './CreateFamilyPage';
import AdminDashboard from './AdminDashboard';
import EventsPage from './Events';
import EventDetailPage from './EventDetailPage';
import PostPage from './PostPage';
import JoinFamilyPage from './JoinFamilyPage';

// Protected Route component
const ProtectedRoute = ({ children, requireAdmin = false, skipFamilyCheck = false }) => {
  const { isLoggedIn, user, loading } = useAuth();
  const isGuest = localStorage.getItem('isGuest') === 'true';
  const path = window.location.pathname;
  console.log('ProtectedRoute:', { isLoggedIn, user, loading, isGuest, path });

  if (loading) return <div>Loading...</div>;
  if (!isLoggedIn && !isGuest) {
    // Not logged in and not guest
    return <Navigate to="/login" />;
  }
  if (isGuest) {
    // Guests can only access /dashboard and /about
    if (path !== '/dashboard' && path !== '/about') {
      return <Navigate to="/dashboard" />;
    }
    return children;
  }
  if (requireAdmin && user?.role !== 'admin') {
    return <Navigate to="/dashboard" />;
  }
  if (!skipFamilyCheck && user && !user.family_id) {
    return <Navigate to="/join-family" />;
  }
  return children;
};

function AppRoutes() {
  const { isLoggedIn } = useAuth();
  const isGuest = localStorage.getItem('isGuest') === 'true';
  return (
    <Routes>
      <Route path="/" element={isLoggedIn || isGuest ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/login" element={isLoggedIn || isGuest ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/about" element={<ProtectedRoute><AboutVSA /></ProtectedRoute>} />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <DashboardHome />
        </ProtectedRoute>
      } />
      {/* Guests cannot access these routes */}
      <Route path="/register" element={<ProtectedRoute><Register /></ProtectedRoute>} />
      <Route path="/families" element={<ProtectedRoute><FamiliesLeaderboard /></ProtectedRoute>} />
      <Route path="/families/:id" element={<ProtectedRoute><FamilyDetails /></ProtectedRoute>} />
      <Route path="/events" element={<ProtectedRoute><EventsPage /></ProtectedRoute>} />
      <Route path="/events/:id" element={<ProtectedRoute><EventDetailPage /></ProtectedRoute>} />
      <Route path="/newsletter" element={<ProtectedRoute><Newsletter /></ProtectedRoute>} />
      <Route path="/post/:id" element={<ProtectedRoute><PostPage /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute requireAdmin={true}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/create-post" element={<ProtectedRoute skipFamilyCheck={true}><CreatePostPage /></ProtectedRoute>} />
      <Route path="/create-family" element={<ProtectedRoute requireAdmin={true}><CreateFamilyPage /></ProtectedRoute>} />
      <Route path="/join-family" element={<ProtectedRoute><JoinFamilyPage /></ProtectedRoute>} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-[#faecd8]">
          <AppRoutes />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;