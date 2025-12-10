import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { AuthContext } from './AuthContext';

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (user && user.token) {
      const socketUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
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
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
};
