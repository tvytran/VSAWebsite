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
  const path = window.location.pathname;
  console.log('ProtectedRoute:', { isLoggedIn, user, loading, path });

  if (loading) return <div>Loading...</div>;
  if (!isLoggedIn) {
    console.log('Redirecting to /login');
    return <Navigate to="/login" />;
  }
  if (requireAdmin && user?.role !== 'admin') {
    console.log('Redirecting to /dashboard');
    return <Navigate to="/dashboard" />;
  }
  if (!skipFamilyCheck && user && !user.family_id) {
    console.log('Redirecting to /join-family');
    return <Navigate to="/join-family" />;
  }
  return children;
};

// Guest Route component - only allows guests and logged-in users
const GuestRoute = ({ children }) => {
  const { isLoggedIn } = useAuth();

  if (isLoggedIn) {
    return children;
  }

  return <Navigate to="/" />;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<DashboardHome />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/families" element={<FamiliesLeaderboard />} />
      <Route path="/families/:id" element={<FamilyDetails />} />
      <Route path="/events" element={<EventsPage />} />
      <Route path="/events/:id" element={<EventDetailPage />} />
      <Route path="/newsletter" element={<Newsletter />} />
      <Route path="/about" element={<AboutVSA />} />
      <Route path="/dashboard" element={
        <GuestRoute>
          <DashboardHome />
        </GuestRoute>
      } />
      <Route path="/post/:id" element={
        <ProtectedRoute>
          <PostPage />
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
        <ProtectedRoute skipFamilyCheck={true}>
          <CreatePostPage />
        </ProtectedRoute>
      } />
      <Route path="/create-family" element={
        <ProtectedRoute requireAdmin={true}>
          <CreateFamilyPage />
        </ProtectedRoute>
      } />
      <Route path="/join-family" element={<JoinFamilyPage />} />
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