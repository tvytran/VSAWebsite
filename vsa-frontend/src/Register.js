import React from 'react';
import { Link } from 'react-router-dom';

function Register() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#faecd8] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-[#b32a2a]">
            Registration Disabled
          </h2>
          <p className="mt-4 text-center text-lg text-gray-700">
            Please use <Link to="/login" className="text-[#b32a2a] underline">Google Sign-In</Link> on the login page.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;