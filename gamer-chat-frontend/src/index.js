// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './style.css';
import './designSystem.css';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { VoiceProvider } from './context/VoiceContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <AuthProvider>
    <SocketProvider>
      <VoiceProvider>
        <App />
      </VoiceProvider>
    </SocketProvider>
  </AuthProvider>
);
