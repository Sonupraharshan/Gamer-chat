// src/config.js

// Safe check for process.env (Webpack 5 fallback)
const getEnv = (name, defaultValue) => {
  if (typeof process !== 'undefined' && process.env && process.env[name]) {
    return process.env[name];
  }
  return defaultValue;
};

export const API_URL = getEnv('REACT_APP_API_URL', 'https://gamer-chat-production.up.railway.app');
