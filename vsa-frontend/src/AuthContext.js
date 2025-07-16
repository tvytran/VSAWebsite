import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Helper to fetch user profile with a valid token
  const fetchUserProfile = async (access_token) => {
    if (!access_token) {
      console.log('No access token, setting user to null');
      setUser(null);
      setIsLoggedIn(false);
      setLoading(false);
      return;
    }
    console.log('Fetching user profile with token:', access_token);
    
    // Use the same API base URL logic as api.js
    const API_BASE_URL = process.env.NODE_ENV === 'production' 
      ? '/api' 
      : (process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001').replace(/\/$/, '');
    
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${access_token}` }
    });
    if (res.ok) {
      const data = await res.json();
      console.log('Fetched user profile:', data.user);
      setUser(data.user);
      setIsLoggedIn(true);
      if (!data.user.family_id) {
        navigate('/join-family');
      }
    } else {
      console.log('Failed to fetch user profile, status:', res.status);
      setUser(null);
      setIsLoggedIn(false);
    }
    setLoading(false);
  };

  // Guest mode support
  useEffect(() => {
    if (localStorage.getItem('isGuest') === 'true') {
      setUser(null);
      setIsLoggedIn(false);
      setLoading(false);
      return;
    }
    // Listen for auth state changes (Supabase v2)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        localStorage.removeItem('isGuest');
      }
      console.log('onAuthStateChange event:', event, 'session:', session);
      const access_token = session?.access_token;
      await fetchUserProfile(access_token);
    });

    // Initial session check (Supabase v2)
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Initial Supabase session:', session);
      const access_token = session?.access_token;
      await fetchUserProfile(access_token);
    })();

    // Cleanup for Supabase v2
    return () => {
      subscription?.unsubscribe();
    };
  }, [navigate]);

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsLoggedIn(false);
    navigate('/');
  };

  // Update user after joining family
  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  const value = {
    user,
    isLoggedIn,
    loading,
    logout,
    updateUser
  };

  console.log('AuthContext render: isLoggedIn:', isLoggedIn, 'user:', user);

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export default AuthContext; 