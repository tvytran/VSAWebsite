import React from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import api from './api';

function Login() {
  const navigate = useNavigate();
  const [quickLinks, setQuickLinks] = React.useState([]);

  // Always clear guest mode when rendering the login page
  React.useEffect(() => {
    localStorage.removeItem('isGuest');
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      localStorage.removeItem('isGuest');
      const baseUrl = process.env.REACT_APP_BASE_URL || window.location.origin;
      // Redirect to the site root after OAuth; app will route to dashboard/join-family
      const redirectTo = baseUrl;
      
      // debug removed
      
      // Check if Supabase is properly configured
      if (!process.env.REACT_APP_SUPABASE_URL || !process.env.REACT_APP_SUPABASE_ANON_KEY) {
        // missing Supabase config
        alert('Configuration error: Missing Supabase credentials. Please contact the administrator.');
        return;
      }
      
      // Check if we're in production and the redirect URL is correct
      if (process.env.NODE_ENV === 'production') {
        // in production
        
        // Validate the redirect URL format
        if (!redirectTo.startsWith('https://')) {
          // warn only in dev
        }
      }
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { 
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });
      
      if (error) {
        // error
        alert(`Google sign-in failed: ${error.message}\n\nPlease check:\n1. Google OAuth provider is enabled in Supabase\n2. Redirect URLs are configured correctly\n3. Google OAuth credentials are set up`);
      } else {
        // success
        
        // If there's a URL, it means we need to redirect
        if (data.url) {
          // redirect
          window.location.href = data.url;
        } else {
          // check session
          // Check if we already have a session
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            // redirect
            window.location.href = redirectTo;
          } else {
            // waiting
          }
        }
      }
    } catch (error) {
      // ignore error
      alert(`Unexpected error: ${error.message}`);
    }
  };

  const handleGuestMode = () => {
    localStorage.setItem('isGuest', 'true');
    navigate('/dashboard');
  };

  // Debug function to test environment variables
  const testEnvironment = () => {
    // debug
    
    // Test Supabase client
    if (supabase) {
      // supabase ok
    } else {
      // supabase not initialized
    }
  };

  // Test API connection
  const testApiConnection = async () => {
    try {
      const testUrl = process.env.NODE_ENV === 'production' ? 'https://vsa-website.vercel.app/api/test' : 'http://localhost:5001/api/test';
      // test
      
      const response = await fetch(testUrl);
      // test result
      
      if (response.ok) {
        const data = await response.json();
        // ok
      } else {
        const text = await response.text();
        // fail
      }
    } catch (error) {
      // ignore
    }
  };

  // Run environment test on component mount
  React.useEffect(() => {
    testEnvironment();
    testApiConnection();
    // Fetch quick links
    (async () => {
      try {
        const res = await api.get('/api/settings/quick-links');
        const data = res.data;
        if (data?.success && Array.isArray(data.links)) {
          setQuickLinks(data.links.slice(0,10));
        }
      } catch (e) {
        // ignore, show nothing until saved
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-[#faecd8] py-8 sm:py-12 flex items-center justify-center">
      <div className="w-full max-w-md bg-white rounded-lg shadow p-8 flex flex-col items-center max-h-[calc(100vh-6rem)] overflow-auto">
        <img
          src="https://nnlbviehgtdyiucgdims.supabase.co/storage/v1/object/public/vsa-images/public/logo.PNG"
          alt="Columbia VSA University"
          className="w-64 mb-8 mx-auto"
        />
        <button
          onClick={handleGoogleSignIn}
          className="w-full py-4 mb-4 bg-[#b32a2a] text-white rounded-lg text-lg font-semibold hover:bg-[#8a1f1f] transition duration-200 ease-in-out"
        >
          Sign in with Google
        </button>
        <button
          onClick={handleGuestMode}
          className="w-full py-4 bg-gray-200 text-[#b32a2a] rounded-lg text-lg font-semibold hover:bg-gray-300 transition duration-200 ease-in-out"
        >
          Guest Mode
        </button>

        {quickLinks.length > 0 && (
          <>
            {/* Divider */}
            <div className="w-full my-6 flex items-center text-gray-400">
              <span className="flex-1 h-px bg-gray-200" />
              <span className="px-3 text-sm">Quick Links</span>
              <span className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Quick Links */}
            <div className="w-full space-y-3">
              {quickLinks.map(link => (
                <a
                  key={link.label}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full p-3 border border-gray-200 rounded-lg flex items-center justify-between hover:bg-gray-50 transition"
                >
                  <span className="text-sm font-medium text-gray-800">{link.label}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-gray-400">
                    <path fillRule="evenodd" d="M4.5 12a.75.75 0 0 1 .75-.75h12.19l-3.22-3.22a.75.75 0 1 1 1.06-1.06l4.5 4.5a.75.75 0 0 1 0 1.06l-4.5 4.5a.75.75 0 1 1-1.06-1.06l3.22-3.22H5.25A.75.75 0 0 1 4.5 12Z" clipRule="evenodd" />
                  </svg>
                </a>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Login;