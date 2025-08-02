// src/pages/Home.js
import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Lobby from './Lobby';

function Home() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h2>Welcome to Gamer Chat</h2>

      {user ? (
        <>
          <p>Logged in as: {user.username}</p>
          <button onClick={() => navigate('/friends')}>Friends</button>
          <br /><br />
          <button onClick={() => {
            logout();
            navigate('/', { replace: true }); // Redirect to homepage on logout
          }}>
            Logout
          </button>

          <div style={{ marginTop: '40px' }}>
            <Lobby />
          </div>
        </>
      ) : (
        <>
          <button onClick={() => navigate('/register')}>Register</button>
          <button onClick={() => navigate('/login')}>Login</button>
        </>
      )}
    </div>
  );
}

export default Home;
