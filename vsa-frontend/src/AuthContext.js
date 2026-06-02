import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
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
  const navigateRef = useRef(navigate);
  useEffect(() => { navigateRef.current = navigate; }, [navigate]);

  // Hard fallback: ensure loading cannot hang forever
  useEffect(() => {
    if (!loading) return;
    const timer = setTimeout(() => setLoading(false), 5000);
    return () => clearTimeout(timer);
  }, [loading]);

  // Stable ref for fetchUserProfile so the auth listener always calls the latest version
  const fetchUserProfileRef = useRef(null);

  const fetchUserProfile = useCallback(async (access_token) => {
    if (!access_token) {
      setUser(null);
      setIsLoggedIn(false);
      setLoading(false);
      return;
    }

    try {
      const res = await api.get('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${access_token}` }
      });

      if (res.status >= 200 && res.status < 300) {
        const data = res.data;
        setUser(data.user);
        setIsLoggedIn(true);

        const currentPath = window.location.pathname;
        if (!data.user.family_id) {
          if (currentPath !== '/join-family') {
            navigateRef.current('/join-family');
          }
        } else {
          if (currentPath === '/join-family') {
            navigateRef.current('/dashboard');
          }
        }
      } else if (res.status === 401) {
        setLoading(false);
        return;
      }
    } catch (error) {
      // Keep existing session state on transient errors
    }
    setLoading(false);
  }, []);

  fetchUserProfileRef.current = fetchUserProfile;

  useEffect(() => {
    if (localStorage.getItem('isGuest') === 'true') {
      setUser(null);
      setIsLoggedIn(false);
      setLoading(false);
      return;
    }

    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (session) {
        localStorage.removeItem('isGuest');
        setIsLoggedIn(true);
        await fetchUserProfileRef.current(session.access_token);
      } else {
        if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
          setUser(null);
          setIsLoggedIn(false);
        }
        setLoading(false);
      }
    });

    // Also check session directly in case onAuthStateChange INITIAL_SESSION is delayed
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;
        if (session?.access_token) {
          setIsLoggedIn(true);
          await fetchUserProfileRef.current(session.access_token);
        } else {
          setLoading(false);
        }
      } catch (error) {
        if (mounted) setLoading(false);
      }
    })();

    // Re-check session when tab becomes visible again
    const handleVisibilityChange = async () => {
      if (document.visibilityState !== 'visible') return;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;
        if (session?.access_token) {
          setIsLoggedIn(true);
          await fetchUserProfileRef.current(session.access_token);
        }
      } catch (error) {
        // ignore
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      mounted = false;
      subscription?.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setIsLoggedIn(false);
      navigateRef.current('/');
    } catch (error) {
      // ignore
    }
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    setIsLoggedIn(true);
    if (updatedUser.family_id && window.location.pathname === '/join-family') {
      navigateRef.current('/dashboard');
    }
  };

  const refreshUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        await fetchUserProfile(session.access_token);
      }
    } catch (error) {
      // ignore
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

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;
