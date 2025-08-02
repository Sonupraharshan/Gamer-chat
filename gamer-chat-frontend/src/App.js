// src/App.js
import React, { useContext } from 'react';
import { AuthContext } from './context/AuthContext';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Friends from './pages/Friends';
import Home from './pages/Home';


// ✅ Wrapper for protected routes
const ProtectedRoute = ({ children }) => {
  const { user } = useContext(AuthContext);
  return user ? children : <Navigate to="/login" replace />;
};

// ✅ Wrapper for public-only routes like login/register
const PublicRoute = ({ children }) => {
  const { user } = useContext(AuthContext);
  return !user ? children : <Navigate to="/" replace />;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Protected Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/friends" element={<ProtectedRoute><Friends /></ProtectedRoute>} />

        {/* Public Routes */}
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      </Routes>
    </Router>
  );
}

export default App;
