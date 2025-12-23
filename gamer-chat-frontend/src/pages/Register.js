// src/pages/Register.js
import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { API_URL } from '../config';

function Register() {
  const [username, setUsername] = useState('');
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
      // Step 1: Register the user
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || 'Registration failed');
        setIsLoading(false);
        return;
      }

      // Step 2: Auto-login using email/password
      const loginRes = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const loginData = await loginRes.json();

      if (loginRes.ok) {
        login(loginData);
        navigate('/');
      } else {
        alert(loginData.message || 'Auto-login failed. Please log in manually.');
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

      {/* Register Card */}
      <div 
        style={{
          ...styles.formCard,
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)'
        }}
        className="glass-panel animate-in"
      >
        <div style={styles.iconWrapper}>
          <span style={styles.icon}>🚀</span>
        </div>
        <h2 style={styles.title}>Join the Squad!</h2>
        <p style={styles.subtitle}>Create your account and start gaming</p>
        
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Username</label>
            <input
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Choose a cool username"
              required
              style={styles.input}
            />
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Email</label>
            <input
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Your email address"
              required
              type="email"
              style={styles.input}
            />
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Create a strong password"
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
            {isLoading ? '⏳ Creating Account...' : '🎮 Create Account'}
          </button>
        </form>
        
        <div style={styles.divider}>
          <span style={styles.dividerText}>or</span>
        </div>
        
        <p style={styles.linkText}>
          Already a gamer?{' '}
          <Link to="/login" style={styles.link}>Sign in →</Link>
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
    background: 'radial-gradient(circle at 70% 70%, rgba(0, 255, 136, 0.15) 0%, transparent 50%)',
    pointerEvents: 'none'
  },
  floatingOrb1: {
    position: 'absolute',
    width: '350px',
    height: '350px',
    borderRadius: '50%',
    background: 'var(--accent-secondary)',
    filter: 'blur(100px)',
    opacity: 0.25,
    top: '-100px',
    left: '-50px',
    animation: 'float 18s ease-in-out infinite'
  },
  floatingOrb2: {
    position: 'absolute',
    width: '280px',
    height: '280px',
    borderRadius: '50%',
    background: 'var(--accent-primary)',
    filter: 'blur(100px)',
    opacity: 0.2,
    bottom: '-80px',
    right: '-50px',
    animation: 'float 22s ease-in-out infinite reverse'
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
    background: 'linear-gradient(135deg, var(--accent-secondary), var(--accent-primary))',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 24px',
    boxShadow: '0 0 30px rgba(0, 255, 136, 0.3)'
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
    gap: '18px'
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
    background: 'linear-gradient(135deg, var(--accent-secondary), #00cc6a)',
    color: '#000',
    cursor: 'pointer',
    marginTop: '8px',
    transition: 'all 0.3s',
    boxShadow: '0 0 30px rgba(0, 255, 136, 0.3)'
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
    fontSize: '13px'
  },
  linkText: {
    textAlign: 'center',
    color: 'var(--text-muted)',
    fontSize: '14px'
  },
  link: {
    color: 'var(--accent-secondary)',
    textDecoration: 'none',
    fontWeight: '600',
    transition: 'color 0.2s'
  }
};

export default Register;
