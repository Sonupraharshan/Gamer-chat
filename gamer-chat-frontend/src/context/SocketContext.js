import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { AuthContext } from './AuthContext';
import { API_URL } from '../config';

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [peerGameStatuses, setPeerGameStatuses] = useState({});
  const [gameActivityAlerts, setGameActivityAlerts] = useState([]);

  useEffect(() => {
    if (user && user.token) {
      const socketUrl = API_URL;
      console.log('🔌 Connecting to socket at:', socketUrl);
      
      // Connect to Socket.io server
      const newSocket = io(socketUrl, {
        auth: {
          token: user.token
        },
        transports: ['websocket', 'polling'] // Force websocket/polling
      });

      newSocket.on('connect', () => {
        console.log('✅ Socket connected');
        setConnected(true);
      });

      newSocket.on('disconnect', () => {
        console.log('❌ Socket disconnected');
        setConnected(false);
      });

      newSocket.on('error', (error) => {
        console.error('Socket error:', error);
      });

      newSocket.on('member-status-changed', (data) => {
        const { userId, gameStatus } = data;
        setPeerGameStatuses(prev => ({
          ...prev,
          [userId]: gameStatus
        }));
      });

      newSocket.on('game-activity-alert', (alert) => {
        setGameActivityAlerts(prev => [alert, ...prev].slice(0, 5));
        // Auto-remove alert after 10 seconds
        setTimeout(() => {
          setGameActivityAlerts(prev => prev.filter(a => a !== alert));
        }, 10000);
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    } else {
      // Disconnect socket if user logs out
      if (socket) {
        socket.close();
        setSocket(null);
        setConnected(false);
      }
    }
  }, [user]);

  return (
    <SocketContext.Provider value={{ 
      socket, 
      connected, 
      peerGameStatuses, 
      gameActivityAlerts 
    }}>
      {children}
    </SocketContext.Provider>
  );
};
