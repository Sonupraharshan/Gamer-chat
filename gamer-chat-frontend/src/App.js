// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Friends from './pages/Friends';
import Lobby from './pages/Lobby';
import Home from './pages/Home';


function App() {
  return (
    <Router>
      <div>
        {/* Nav links for quick switching between pages */}
        <nav>
          <Link to="/">Login</Link> | 
          <Link to="/register">Register</Link> | 
          <Link to="/friends">Friends</Link> | 
          <Link to="/lobby">Lobby</Link> |
          <Link to="/home">Home</Link>
        </nav>

        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/friends" element={<Friends />} />
          <Route path="/lobby" element={<Lobby />} />
          <Route path="/home" element={<Home />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
