import React from 'react';
import { useNavigate } from 'react-router-dom';

function Home() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h2>Welcome to Gamer Chat</h2>
      <button onClick={() => navigate('/friends')}>Friends</button>
      <button onClick={() => navigate('/lobby')}>Lobby</button>
      <br /><br />
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}

export default Home;
