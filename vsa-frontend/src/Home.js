import React from 'react';
import './Home.css'; // We'll add styles here

function Home({ onLoginClick, onRegisterClick, onGuestClick }) {
  return (
    <div className="home-container">
      <div className="home-content">
        <img
          src="/logo.png" // Place your logo in public/logo.png or update the path
          alt="Columbia VSA University"
          className="home-logo"
        />
        <button className="home-btn" onClick={onLoginClick}>Login</button>
        <button className="home-btn" onClick={onRegisterClick}>Register</button>
        <button className="home-btn" onClick={onGuestClick}>Guest</button>
      </div>
    </div>
  );
}

export default Home;