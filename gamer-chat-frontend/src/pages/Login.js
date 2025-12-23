// src/pages/Login.js
import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { API_URL } from '../config';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),  
      });

      const data = await res.json();
      if (res.ok) {
        login(data);
        navigate('/');
      } else {
        alert(data.message || 'Login failed');
      }
    } catch (err) {
      alert('Connection error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Background Effects */}
      <div style={styles.backgroundGradient}></div>
      <div style={styles.floatingOrb1}></div>
      <div style={styles.floatingOrb2}></div>

      {/* Back to Home */}
      <Link to="/welcome" style={styles.backLink}>← Back to Home</Link>

      {/* Login Card */}
      <div 
        style={{
          ...styles.formCard,
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)'
        }}
        className="glass-panel animate-in"
      >
        <div style={styles.iconWrapper}>
          <span style={styles.icon}>🎮</span>
        </div>
        <h2 style={styles.title}>Welcome Back, Gamer!</h2>
        <p style={styles.subtitle}>Sign in to continue your adventure</p>
        
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Email</label>
            <input 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              placeholder="Enter your email" 
              required 
              style={styles.input}
              type="email"
            />
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              placeholder="Enter your password" 
              required 
              style={styles.input}
            />
          </div>
          <button 
            type="submit" 
            style={{
              ...styles.button,
              opacity: isLoading ? 0.7 : 1
            }}
            disabled={isLoading}
          >
            {isLoading ? '⏳ Signing in...' : '🚀 Sign In'}
          </button>
        </form>
        
        <div style={styles.divider}>
          <span style={styles.dividerText}>or</span>
        </div>
        
        <p style={styles.linkText}>
          New to Gamer Chat?{' '}
          <Link to="/register" style={styles.link}>Create an account →</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'var(--bg-primary)',
    position: 'relative',
    overflow: 'hidden',
    padding: '20px'
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'radial-gradient(circle at 30% 30%, rgba(125, 95, 255, 0.2) 0%, transparent 50%)',
    pointerEvents: 'none'
  },
  floatingOrb1: {
    position: 'absolute',
    width: '300px',
    height: '300px',
    borderRadius: '50%',
    background: 'var(--accent-primary)',
    filter: 'blur(100px)',
    opacity: 0.3,
    top: '-100px',
    right: '-50px',
    animation: 'float 15s ease-in-out infinite'
  },
  floatingOrb2: {
    position: 'absolute',
    width: '250px',
    height: '250px',
    borderRadius: '50%',
    background: 'var(--accent-secondary)',
    filter: 'blur(100px)',
    opacity: 0.2,
    bottom: '-100px',
    left: '-50px',
    animation: 'float 20s ease-in-out infinite reverse'
  },
  backLink: {
    position: 'absolute',
    top: '30px',
    left: '30px',
    color: 'var(--text-muted)',
    textDecoration: 'none',
    fontSize: '14px',
    transition: 'color 0.2s',
    zIndex: 10
  },
  formCard: {
    padding: '48px',
    borderRadius: '24px',
    width: '420px',
    maxWidth: '90%',
    position: 'relative',
    zIndex: 10,
    transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
  },
  iconWrapper: {
    width: '80px',
    height: '80px',
    borderRadius: '20px',
    background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 24px',
    boxShadow: 'var(--shadow-neon)'
  },
  icon: {
    fontSize: '40px'
  },
  title: {
    color: '#fff',
    textAlign: 'center',
    marginBottom: '8px',
    fontSize: '28px',
    fontWeight: '700'
  },
  subtitle: {
    color: 'var(--text-muted)',
    textAlign: 'center',
    marginBottom: '32px',
    fontSize: '14px'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  label: {
    fontSize: '13px',
    fontWeight: '600',
    color: 'var(--text-muted)'
  },
  input: {
    padding: '14px 18px',
    fontSize: '15px',
    borderRadius: '12px',
    border: '1px solid var(--glass-border)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    color: '#fff',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s'
  },
  button: {
    padding: '16px',
    fontSize: '16px',
    fontWeight: '700',
    borderRadius: '12px',
    border: 'none',
    background: 'linear-gradient(135deg, var(--accent-primary), #9f7afa)',
    color: '#fff',
    cursor: 'pointer',
    marginTop: '8px',
    transition: 'all 0.3s',
    boxShadow: 'var(--shadow-neon)'
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    margin: '24px 0',
    gap: '16px'
  },
  dividerText: {
    flex: 1,
    textAlign: 'center',
    color: 'var(--text-muted)',
    fontSize: '13px',
    position: 'relative'
  },
  linkText: {
    textAlign: 'center',
    color: 'var(--text-muted)',
    fontSize: '14px'
  },
  link: {
    color: 'var(--accent-primary)',
    textDecoration: 'none',
    fontWeight: '600',
    transition: 'color 0.2s'
  }
};

export default Login;
