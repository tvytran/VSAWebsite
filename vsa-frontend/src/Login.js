import React from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';

function Login() {
  const navigate = useNavigate();

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
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#faecd8]">
      <div className="w-full max-w-xs bg-white rounded-lg shadow p-8 flex flex-col items-center">
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
      </div>
    </div>
  );
}

export default Login;