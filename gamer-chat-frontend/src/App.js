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
import LandingPage from './pages/LandingPage';
import ActiveCallBar from './components/ActiveCallBar';
import IncomingCallOverlay from './components/IncomingCallOverlay';
import PrivateCallOverlay from './components/PrivateCallOverlay';


// ✅ Wrapper for protected routes
const ProtectedRoute = ({ children }) => {
  const { user } = useContext(AuthContext);
  return user ? children : <Navigate to="/welcome" replace />;
};

// ✅ Wrapper for public-only routes like login/register
const PublicRoute = ({ children }) => {
  const { user } = useContext(AuthContext);
  return !user ? children : <Navigate to="/" replace />;
};

function App() {
  const { user } = useContext(AuthContext);

  return (
    <Router>
      <div style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
        <Routes>
          {/* Landing page for non-authenticated users */}
          <Route path="/welcome" element={<PublicRoute><LandingPage /></PublicRoute>} />
          
          {/* Protected Routes */}
          <Route path="/" element={user ? <Home /> : <Navigate to="/welcome" replace />} />
          <Route path="/friends" element={<ProtectedRoute><Friends /></ProtectedRoute>} />

          {/* Public Routes */}
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        </Routes>
        <ActiveCallBar />
        <IncomingCallOverlay />
        <PrivateCallOverlay />
      </div>
    </Router>
  );
}

export default App;
