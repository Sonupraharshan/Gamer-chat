import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user');
      if (!stored || stored === 'undefined') return null;
      return JSON.parse(stored);
    } catch (error) {
      console.error('Failed to parse user from localStorage:', error);
      return null;
    }
  });
  

  const login = (userData) => {
    setUser(userData.user);
    localStorage.setItem('user', JSON.stringify(userData.user));
    localStorage.setItem('token', userData.token); // ✅ Save token too
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
