import React, { useState } from 'react';
import Home from './Home';
import Login from './Login';
import Register from './Register';
///llohhh
function App() {
  const [page, setPage] = useState('home');

  return (
    <div className="min-h-screen bg-blue-50 flex flex-col items-center justify-center">
      {page === 'home' && (
        <Home
          onLoginClick={() => setPage('login')}
          onRegisterClick={() => setPage('register')}
          onGuestClick={() => alert('Guest mode coming soon!')}
        />
      )}
      {page === 'login' && <Login />}
      {page === 'register' && <Register />}
    </div>
  );
}

export default App;