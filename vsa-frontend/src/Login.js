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
      const redirectTo = baseUrl + '/dashboard';
      
      console.log('=== Google Sign-in Debug ===');
      console.log('Base URL:', baseUrl);
      console.log('Redirect To:', redirectTo);
      console.log('Supabase URL:', process.env.REACT_APP_SUPABASE_URL);
      console.log('Supabase Anon Key exists:', !!process.env.REACT_APP_SUPABASE_ANON_KEY);
      console.log('Current URL:', window.location.href);
      console.log('NODE_ENV:', process.env.NODE_ENV);
      
      // Check if Supabase is properly configured
      if (!process.env.REACT_APP_SUPABASE_URL || !process.env.REACT_APP_SUPABASE_ANON_KEY) {
        console.error('Missing Supabase environment variables!');
        alert('Configuration error: Missing Supabase credentials. Please contact the administrator.');
        return;
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
        console.error('Google sign-in error:', error);
        alert(`Google sign-in failed: ${error.message}\n\nPlease check:\n1. Google OAuth provider is enabled in Supabase\n2. Redirect URLs are configured correctly\n3. Google OAuth credentials are set up`);
      } else {
        console.log('Google sign-in initiated successfully:', data);
        console.log('Redirect URL:', data.url);
        console.log('Provider:', data.provider);
        console.log('URL will redirect to:', redirectTo);
        
        // If there's a URL, it means we need to redirect
        if (data.url) {
          console.log('Redirecting to Google OAuth URL:', data.url);
          window.location.href = data.url;
        } else {
          console.log('No redirect URL provided, checking for session...');
          // Check if we already have a session
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            console.log('Session found, redirecting to dashboard...');
            window.location.href = redirectTo;
          } else {
            console.log('No session found, waiting for OAuth callback...');
          }
        }
      }
    } catch (error) {
      console.error('Unexpected error during Google sign-in:', error);
      alert(`Unexpected error: ${error.message}`);
    }
  };

  const handleGuestMode = () => {
    localStorage.setItem('isGuest', 'true');
    navigate('/dashboard');
  };

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