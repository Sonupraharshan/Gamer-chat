// src/pages/Login.js
import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { API_URL } from '../config';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),  
    });

    const data = await res.json();
    if (res.ok) {
      login(data); // data has { user, token }
      navigate('/'); // go home
    } else {
      alert(data.message || 'Login failed');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.formCard}>
        <h2 style={styles.title}>🎮 Login to Gamer Chat</h2>
        <form onSubmit={handleSubmit} style={styles.form}>
          <input 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            placeholder="Email" 
            required 
            style={styles.input}
            type="email"
          />
          <input 
            type="password" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            placeholder="Password" 
            required 
            style={styles.input}
          />
          <button type="submit" style={styles.button}>Login</button>
        </form>
        <p style={styles.linkText}>
          Don't have an account? <Link to="/register" style={styles.link}>Register here</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    height: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#3d3a3aff'
  },
  formCard: {
    backgroundColor: '#272424ff',
    padding: '40px',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
    width: '400px',
    maxWidth: '90%'
  },
  title: {
    color: '#fff',
    textAlign: 'center',
    marginBottom: '30px'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  input: {
    padding: '12px 15px',
    fontSize: '14px',
    borderRadius: '6px',
    border: '1px solid #555',
    backgroundColor: '#3d3a3aff',
    color: '#fff',
    outline: 'none'
  },
  button: {
    padding: '12px',
    fontSize: '16px',
    fontWeight: '500',
    borderRadius: '6px',
    border: 'none',
    backgroundColor: '#556158ff',
    color: '#fff',
    cursor: 'pointer',
    marginTop: '10px',
    transition: 'background-color 0.2s'
  },
  linkText: {
    textAlign: 'center',
    marginTop: '20px',
    color: '#ccc',
    fontSize: '14px'
  },
  link: {
    color: '#556158ff',
    textDecoration: 'none',
    fontWeight: '500'
  }
};

export default Login;
