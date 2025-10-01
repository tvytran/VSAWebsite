import React from 'react';
import MainLayout from './MainLayout';
import { Navigate } from 'react-router-dom';

function Newsletter() {
  const isGuest = localStorage.getItem('isGuest') === 'true';
  if (isGuest) return <Navigate to="/dashboard" />;

  return (
    <MainLayout>
      <div className="w-full max-w-4xl bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-[#b32a2a] mb-6">VSA Newsletter</h1>
        <p className="text-gray-600">Coming soon...</p>
</div>
    </MainLayout>
  );
}

export default Newsletter; 