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

  // Hard fallback: ensure loading cannot hang forever
  useEffect(() => {
    if (!loading) return;
    const timer = setTimeout(() => setLoading(false), 5000);
    return () => clearTimeout(timer);
  }, [loading]);

  // Helper to fetch user profile with a valid token
  const fetchUserProfile = async (access_token) => {
    if (!access_token) {
      // no access token
      setUser(null);
      setIsLoggedIn(false);
      setLoading(false);
      return;
    }
    // fetch user profile
    
    // Use shared axios client to ensure correct base URL in all environments
    try {
      const res = await api.get('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${access_token}`
        }
      });

      if (res.status >= 200 && res.status < 300) {
        const data = res.data;
        // set user profile
        setUser(data.user);
        setIsLoggedIn(true);
        
        // Only redirect if the user is not already on the correct page
        const currentPath = window.location.pathname;
        
        if (!data.user.family_id) {
          // user has no family
          if (currentPath !== '/join-family') {
            // navigate
            navigate('/join-family');
          }
        } else {
          // user already has family
          if (currentPath === '/join-family') {
            // navigate
            navigate('/dashboard');
          }
        }
      } else {
        // fetch failed – do not clear session; retry shortly
        if (res.status === 401) {
          // For explicit auth failures, just stop here; onAuthStateChange will handle real sign-outs
          setLoading(false);
          return;
        }
        setTimeout(() => fetchUserProfile(access_token), 2000);
        setLoading(false);
        return;
      }
    } catch (error) {
      // Ignore transient errors; retry shortly and keep session
      setTimeout(() => fetchUserProfile(access_token), 2000);
      setLoading(false);
      return;
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
    
    // setup auth state listener
    
    // Listen for auth state changes (Supabase v2)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Only hard-clear on explicit sign-out events; ignore transient null sessions
      if (session) {
        // session found
        localStorage.removeItem('isGuest');
        setIsLoggedIn(true);
        const access_token = session.access_token;
        // token presence
        await fetchUserProfile(access_token);
      } else {
        // For events other than explicit sign-out, keep current state
        if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
          setUser(null);
          setIsLoggedIn(false);
        }
        setLoading(false);
      }
    });

    // Initial session check (Supabase v2)
    (async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          // ignore error
        }
        // initial session
        const access_token = session?.access_token;
        if (access_token) {
          setIsLoggedIn(true);
        }
        await fetchUserProfile(access_token);
      } catch (error) {
        // ignore error
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
      // ignore error
    }
  };

  // Update user after joining family
  const updateUser = (updatedUser) => {
    // update user in context
    setUser(updatedUser);
    setIsLoggedIn(true);
    
    // If the user now has a family_id and is on the join-family page, redirect to dashboard
    if (updatedUser.family_id && window.location.pathname === '/join-family') {
      // navigate
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
      // ignore error
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

  // render

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext; 