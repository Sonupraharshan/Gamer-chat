import React, { createContext, useState, useEffect } from 'react';
import { API_URL } from '../config';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    // Corruption check
    if (token === 'undefined' || token === 'null' || !token) {
      if (token) localStorage.removeItem('token');
      return null;
    }

    if (storedUser && storedUser !== 'undefined' && storedUser !== 'null') {
      try {
        const parsed = JSON.parse(storedUser);
        return { ...parsed, token };
      } catch (e) {
        localStorage.removeItem('user');
        return null;
      }
    }
    return null;
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (token && storedUser && token !== 'undefined' && token !== 'null') {
       try {
         const userInfo = JSON.parse(storedUser);
         setUser({ ...userInfo, token });
       } catch(e) { /* ignore */ }
    }
  }, []);
  
  const login = (userData) => {
    const userInfo = userData.user || userData;
    const token = userData.token || localStorage.getItem('token');
    
    const contextUser = { ...userInfo, token };
    setUser(contextUser);
    
    // Consistent storage: separate keys but synchronized
    localStorage.setItem('user', JSON.stringify(userInfo));
    if (token) {
      localStorage.setItem('token', token);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');     // ✅ Clear stored user
    localStorage.removeItem('token');    // ✅ Clear token
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
