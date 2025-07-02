import React from 'react';
import { supabase } from './supabaseClient';
//import './Home.css'; // We'll add styles here

function Home() {
  const handleGoogleSignIn = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'google' });
  };

  return (
    <div className="min-h-screen w-full bg-[#faecd8] flex items-center justify-center">
      <div className="w-full max-w-xs bg-white rounded-lg shadow p-8 flex flex-col items-center">
        <img
          src="https://nnlbviehgtdyiucgdims.supabase.co/storage/v1/object/public/vsa-images/public/logo.PNG"
          alt="Columbia VSA University"
          className="w-64 mb-8 mx-auto"
        />
        <button
          onClick={handleGoogleSignIn}
          className="w-full py-4 bg-[#b32a2a] text-white rounded-lg text-lg font-semibold hover:bg-[#8a1f1f] transition duration-200 ease-in-out mb-2"
        >
          Sign in with Google
        </button>
      </div>
    </div>
  );
}

export default Home;