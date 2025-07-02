import React from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';

function Login() {
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'google' });
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