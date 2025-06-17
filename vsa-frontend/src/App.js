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

// Protected Route component
const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { isLoggedIn, user } = useAuth();

  if (!isLoggedIn) {
    return <Navigate to="/login" />;
  }

  if (requireAdmin && user?.role !== 'admin') {
    return <Navigate to="/dashboard" />;
  }

  return children;
};

function AppRoutes() {
  const { isLoggedIn } = useAuth();

  return (
    <Routes>
      <Route path="/" element={
        isLoggedIn ? <DashboardHome /> : <Home />
      } />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/families" element={<FamiliesLeaderboard />} />
      <Route path="/families/:id" element={<FamilyDetails />} />
      <Route path="/events" element={<EventsPage />} />
      <Route path="/events/:id" element={<EventDetailPage />} />
      <Route path="/newsletter" element={<Newsletter />} />
      <Route path="/about" element={<AboutVSA />} />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <DashboardHome />
        </ProtectedRoute>
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
        <ProtectedRoute>
          <CreatePostPage />
        </ProtectedRoute>
      } />
      <Route path="/create-family" element={
        <ProtectedRoute requireAdmin={true}>
          <CreateFamilyPage />
        </ProtectedRoute>
      } />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-[#faecd8]">
          <AppRoutes />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;