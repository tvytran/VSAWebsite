import React from 'react';
import MainLayout from './MainLayout';
import { Link } from 'react-router-dom';
import { useAuth } from './AuthContext';

function AboutVSA() {
  const { isLoggedIn } = useAuth();
  return (
    <MainLayout>
      <div className="w-full max-w-4xl bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-[#b32a2a] mb-6">About VSA</h1>
        
        <div className="text-gray-700 leading-relaxed">
          <h2 className="text-2xl font-semibold text-[#b32a2a] mb-4">🎓 About ACE – Anh Chị Em Program</h2>
          <p className="mb-4">
            ACE (Anh Chị Em) is Columbia VSA's mentorship program — built to connect Vietnamese and Vietnamese-American students through friendship, cultural pride, and guidance.
          </p>
          <p className="mb-4">
            Whether you're a new member (em) looking for support or an upperclassman (anh/chị) wanting to give back, ACE helps you build meaningful relationships within our community.
          </p>
          <p className="mb-4">
            From cozy hangouts and academic support to late-night pho runs and life talks, ACE is here to make Columbia feel a little more like home ❤️🇻🇳
          </p>

          <h3 className="text-xl font-semibold text-[#b32a2a] mb-3">Key Aspects:</h3>
          <ul className="list-disc list-inside mb-4">
            <li>Open to all class years</li>
            <li>Academic + cultural mentorship</li>
            <li>Events, bonding, & community</li>
          </ul>
        </div>

        {/* New section for contact links */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-xl font-semibold text-[#b32a2a] mb-4">Connect with Us</h3>
          <div className="flex flex-col space-y-3 text-gray-700">
            <a 
              href="https://www.instagram.com/columbia.vsa/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:text-[#b32a2a] underline flex items-center"
            >
              <span className="mr-2 text-xl">📸</span>
              Instagram: @columbia.vsa
            </a>
            <a 
              href="mailto:vsa@columbia.edu" 
              className="hover:text-[#b32a2a] underline flex items-center"
            >
              <span className="mr-2 text-xl">📧</span>
              Email: vsa@columbia.edu
            </a>
          </div>
        </div>

        {!isLoggedIn && (
          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-lg text-gray-700 mb-4">Want to connect with the VSA community?</p>
            <Link to="/register" className="px-6 py-3 bg-[#b32a2a] text-white rounded-lg hover:bg-[#8a1f1f] transition duration-200 ease-in-out mr-4">Register Today!</Link>
            <Link to="/login" className="px-6 py-3 bg-white border-2 border-[#b32a2a] text-[#b32a2a] rounded-lg hover:bg-[#f5e6d6] transition duration-200 ease-in-out">Login</Link>
          </div>
        )}

      </div>
    </MainLayout>
  );
}

export default AboutVSA; 