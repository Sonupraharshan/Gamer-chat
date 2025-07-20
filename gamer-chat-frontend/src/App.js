// src/App.js
import React, { useContext } from 'react';
import { AuthContext } from './context/AuthContext';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Friends from './pages/Friends';
import Lobby from './pages/Lobby';

const Home = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  return (
    <div>
      <h1>Welcome to Gamer Chat</h1>

      {user ? (
        <>
          <p>Logged in as: {user.username}</p>
          <button onClick={() => navigate('/friends')}>Friends</button>
          <button onClick={() => navigate('/lobby')}>Lobby</button>
          <button onClick={logout}>Logout</button>
        </>
      ) : (
        <>
          <button onClick={() => navigate('/register')}>Register</button>
          <button onClick={() => navigate('/login')}>Login</button>
        </>
      )}
    </div>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/friends" element={<Friends />} />
        <Route path="/lobby" element={<Lobby />} />
      </Routes>
    </Router>
  );
}

export default App;
