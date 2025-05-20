import React, { useState } from 'react';
import Home from './Home';
import Login from './Login';
// import Register from './Register'; // If you have a Register component
///llo
function App() {
  const [page, setPage] = useState('home');

  return (
    <div>
      {page === 'home' && (
        <Home
          onLoginClick={() => setPage('login')}
          onRegisterClick={() => setPage('register')}
          onGuestClick={() => alert('Guest mode coming soon!')}
        />
      )}
      {page === 'login' && <Login />}
      {/* {page === 'register' && <Register />} */}
    </div>
  );
}

export default App;