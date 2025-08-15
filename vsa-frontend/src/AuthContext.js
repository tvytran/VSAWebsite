import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import api from './api';
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
    
    // Use shared axios client to ensure correct base URL in all environments
    try {
      const res = await api.get('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${access_token}`
        }
      });

      if (res.status >= 200 && res.status < 300) {
        const data = res.data;
        console.log('Fetched user profile:', data.user);
        setUser(data.user);
        setIsLoggedIn(true);
        
        // Only redirect if the user is not already on the correct page
        const currentPath = window.location.pathname;
        
        if (!data.user.family_id) {
          console.log('User has no family_id');
          if (currentPath !== '/join-family') {
            console.log('Redirecting to join-family');
            navigate('/join-family');
          }
        } else {
          console.log('User has family_id:', data.user.family_id);
          if (currentPath === '/join-family') {
            console.log('Redirecting to dashboard (user has family)');
            navigate('/dashboard');
          }
        }
      } else {
        console.log('Failed to fetch user profile, status:', res.status);
        if (res.status === 401) {
          console.log('Token is invalid, clearing session');
          await supabase.auth.signOut();
        }
        setUser(null);
        setIsLoggedIn(false);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
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
    
    console.log('Setting up auth state change listener');
    
    // Listen for auth state changes (Supabase v2)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('=== Auth State Change ===');
      console.log('Event:', event);
      console.log('Session:', session);
      console.log('Current URL:', window.location.href);
      
      if (session) {
        console.log('Session found, processing authentication...');
        localStorage.removeItem('isGuest');
        const access_token = session.access_token;
        console.log('Access token:', access_token ? 'Present' : 'Missing');
        await fetchUserProfile(access_token);
      } else {
        console.log('No session found, setting user to null');
        setUser(null);
        setIsLoggedIn(false);
        setLoading(false);
      }
    });

    // Initial session check (Supabase v2)
    (async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting session:', error);
        }
        console.log('Initial Supabase session:', session);
        const access_token = session?.access_token;
        await fetchUserProfile(access_token);
      } catch (error) {
        console.error('Error in initial session check:', error);
        setLoading(false);
      }
    })();

    // Cleanup for Supabase v2
    return () => {
      subscription?.unsubscribe();
    };
  }, [navigate]);

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setIsLoggedIn(false);
      navigate('/');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  // Update user after joining family
  const updateUser = (updatedUser) => {
    console.log('Updating user in AuthContext:', updatedUser);
    setUser(updatedUser);
    setIsLoggedIn(true);
    
    // If the user now has a family_id and is on the join-family page, redirect to dashboard
    if (updatedUser.family_id && window.location.pathname === '/join-family') {
      console.log('User joined family, redirecting to dashboard');
      navigate('/dashboard');
    }
  };

  // Force refresh user data
  const refreshUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        await fetchUserProfile(session.access_token);
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  const value = {
    user,
    isLoggedIn,
    loading,
    logout,
    updateUser,
    refreshUser
  };

  console.log('AuthContext render: isLoggedIn:', isLoggedIn, 'user:', user);

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export default AuthContext; 