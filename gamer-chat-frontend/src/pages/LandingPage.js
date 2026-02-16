// src/pages/LandingPage.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function LandingPage() {
  const [isVisible, setIsVisible] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);

  useEffect(() => {
    setIsVisible(true);
    const interval = setInterval(() => {
      setActiveFeature(prev => (prev + 1) % features.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: '🎮',
      title: 'Game Together',
      description: 'Voice chat with your squad while gaming. Crystal clear audio, zero lag.'
    },
    {
      icon: '📹',
      title: 'Face-to-Face',
      description: 'Turn on video to see your friends. Share reactions in real-time.'
    },
    {
      icon: '🖥️',
      title: 'Screen Share',
      description: 'Show your gameplay, share strategies, or watch streams together.'
    },
    {
      icon: '💬',
      title: 'Instant Messaging',
      description: 'Quick text chats, group channels, and private DMs all in one place.'
    },
    {
      icon: '🔒',
      title: 'Safe & Secure',
      description: 'End-to-end encrypted calls. Your conversations stay private.'
    },
    {
      icon: '📱',
      title: 'Works Everywhere',
      description: 'Desktop, tablet, or phone. Stay connected on any device.'
    }
  ];

  return (
    <div style={styles.container}>
      {/* Animated Background */}
      <div style={styles.backgroundGradient}></div>
      <div style={styles.floatingOrbs}>
        <div style={{...styles.orb, ...styles.orb1}}></div>
        <div style={{...styles.orb, ...styles.orb2}}></div>
        <div style={{...styles.orb, ...styles.orb3}}></div>
      </div>

      {/* Navigation */}
      <nav style={styles.nav}>
        <div style={styles.logo}>🎮 Gamer Chat</div>
        <div style={styles.navLinks}>
          <Link to="/login" style={styles.navLink}>Login</Link>
          <Link to="/register" style={styles.navButton}>Get Started</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{
        ...styles.hero,
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(30px)'
      }}>
        <h1 style={styles.heroTitle}>
          Connect. Play. <span style={styles.heroHighlight}>Dominate.</span>
        </h1>
        <p style={styles.heroSubtitle}>
          The ultimate voice & video platform for gamers. 
          Team up with friends, strategize in real-time, and never game alone again.
        </p>
        <div style={styles.heroCTA}>
          <Link to="/register" style={styles.primaryButton}>
            Start Gaming Free →
          </Link>
          <Link to="/login" style={styles.secondaryButton}>
            I have an account
          </Link>
        </div>
        <div style={styles.heroStats}>
          <div style={styles.stat}>
            <span style={styles.statNumber}>10K+</span>
            <span style={styles.statLabel}>Gamers</span>
          </div>
          <div style={styles.stat}>
            <span style={styles.statNumber}>50K+</span>
            <span style={styles.statLabel}>Voice Hours</span>
          </div>
          <div style={styles.stat}>
            <span style={styles.statNumber}>99.9%</span>
            <span style={styles.statLabel}>Uptime</span>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section style={styles.featuresSection}>
        <h2 style={styles.sectionTitle}>Everything You Need to Win</h2>
        <div style={styles.featuresGrid}>
          {features.map((feature, index) => (
            <div 
              key={index} 
              style={{
                ...styles.featureCard,
                transform: activeFeature === index ? 'scale(1.05)' : 'scale(1)',
                borderColor: activeFeature === index ? 'var(--accent-primary)' : 'var(--glass-border)'
              }}
              className="glass-panel"
            >
              <div style={styles.featureIcon}>{feature.icon}</div>
              <h3 style={styles.featureTitle}>{feature.title}</h3>
              <p style={styles.featureDescription}>{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section style={styles.howItWorks}>
        <h2 style={styles.sectionTitle}>Ready in 3 Simple Steps</h2>
        <div style={styles.stepsContainer}>
          <div style={styles.step}>
            <div style={styles.stepNumber}>1</div>
            <h3 style={styles.stepTitle}>Create Your Account</h3>
            <p style={styles.stepDesc}>Quick signup with just email and password.</p>
          </div>
          <div style={styles.stepArrow}>→</div>
          <div style={styles.step}>
            <div style={styles.stepNumber}>2</div>
            <h3 style={styles.stepTitle}>Add Your Friends</h3>
            <p style={styles.stepDesc}>Search by username and build your squad.</p>
          </div>
          <div style={styles.stepArrow}>→</div>
          <div style={styles.step}>
            <div style={styles.stepNumber}>3</div>
            <h3 style={styles.stepTitle}>Start Chatting</h3>
            <p style={styles.stepDesc}>Create or join a lobby and go live!</p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section style={styles.finalCTA}>
        <h2 style={styles.ctaTitle}>Ready to Level Up Your Gaming?</h2>
        <p style={styles.ctaSubtitle}>Join thousands of gamers already using Gamer Chat.</p>
        <Link to="/register" style={styles.ctaButton}>
          🚀 Get Started — It's Free
        </Link>
      </section>

      {/* Footer */}
      <footer style={styles.footer}>
        <p>© 2024 Gamer Chat. Made with ❤️ for gamers.</p>
      </footer>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-main)',
    position: 'relative',
    overflow: 'hidden'
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.03) 0%, transparent 70%)',
    pointerEvents: 'none'
  },
  floatingOrbs: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
    overflow: 'hidden'
  },
  orb: {
    position: 'absolute',
    borderRadius: '50%',
    filter: 'blur(80px)',
    opacity: 0.5,
    animation: 'float 20s ease-in-out infinite'
  },
  orb1: {
    width: '400px',
    height: '400px',
    background: 'var(--accent-primary)',
    top: '-100px',
    left: '-100px'
  },
  orb2: {
    width: '300px',
    height: '300px',
    background: 'var(--accent-secondary)',
    bottom: '100px',
    right: '-50px',
    animationDelay: '-5s'
  },
  orb3: {
    width: '250px',
    height: '250px',
    background: 'var(--accent-tertiary)',
    top: '50%',
    left: '50%',
    animationDelay: '-10s'
  },
  nav: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 40px',
    position: 'relative',
    zIndex: 10
  },
  logo: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#fff'
  },
  navLinks: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px'
  },
  navLink: {
    color: 'var(--text-muted)',
    textDecoration: 'none',
    fontSize: '15px',
    transition: 'color 0.2s'
  },
  navButton: {
    padding: '10px 24px',
    backgroundColor: 'var(--accent-primary)',
    color: '#fff',
    textDecoration: 'none',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '14px',
    transition: 'all 0.3s'
  },
  hero: {
    textAlign: 'center',
    padding: '80px 20px 60px',
    maxWidth: '900px',
    margin: '0 auto',
    position: 'relative',
    zIndex: 10,
    transition: 'all 0.8s ease-out'
  },
  heroTitle: {
    fontSize: 'clamp(36px, 8vw, 72px)',
    fontWeight: '800',
    marginBottom: '24px',
    lineHeight: 1.1
  },
  heroHighlight: {
    background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text'
  },
  heroSubtitle: {
    fontSize: '18px',
    color: 'var(--text-muted)',
    maxWidth: '600px',
    margin: '0 auto 40px',
    lineHeight: 1.6
  },
  heroCTA: {
    display: 'flex',
    justifyContent: 'center',
    gap: '16px',
    flexWrap: 'wrap',
    marginBottom: '60px'
  },
  primaryButton: {
    padding: '16px 32px',
    backgroundColor: 'var(--accent-primary)',
    color: '#fff',
    textDecoration: 'none',
    borderRadius: '12px',
    fontWeight: '700',
    fontSize: '16px',
    boxShadow: 'var(--shadow-neon)',
    transition: 'all 0.3s'
  },
  secondaryButton: {
    padding: '16px 32px',
    backgroundColor: 'transparent',
    color: 'var(--text-main)',
    textDecoration: 'none',
    borderRadius: '12px',
    fontWeight: '600',
    fontSize: '16px',
    border: '1px solid var(--glass-border)',
    transition: 'all 0.3s'
  },
  heroStats: {
    display: 'flex',
    justifyContent: 'center',
    gap: '60px',
    flexWrap: 'wrap'
  },
  stat: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  statNumber: {
    fontSize: '32px',
    fontWeight: '700',
    color: 'var(--accent-primary)'
  },
  statLabel: {
    fontSize: '14px',
    color: 'var(--text-muted)'
  },
  featuresSection: {
    padding: '80px 20px',
    position: 'relative',
    zIndex: 10
  },
  sectionTitle: {
    fontSize: '36px',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: '50px'
  },
  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '24px',
    maxWidth: '1200px',
    margin: '0 auto'
  },
  featureCard: {
    padding: '32px',
    borderRadius: '16px',
    textAlign: 'center',
    transition: 'all 0.3s ease',
    cursor: 'default'
  },
  featureIcon: {
    fontSize: '48px',
    marginBottom: '16px'
  },
  featureTitle: {
    fontSize: '20px',
    fontWeight: '600',
    marginBottom: '12px'
  },
  featureDescription: {
    fontSize: '14px',
    color: 'var(--text-muted)',
    lineHeight: 1.6
  },
  howItWorks: {
    padding: '80px 20px',
    backgroundColor: 'rgba(255,255,255,0.02)',
    position: 'relative',
    zIndex: 10
  },
  stepsContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '30px',
    flexWrap: 'wrap',
    maxWidth: '900px',
    margin: '0 auto'
  },
  step: {
    textAlign: 'center',
    maxWidth: '200px'
  },
  stepNumber: {
    width: '50px',
    height: '50px',
    borderRadius: '50%',
    backgroundColor: 'var(--accent-primary)',
    color: '#fff',
    fontSize: '24px',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px'
  },
  stepTitle: {
    fontSize: '18px',
    fontWeight: '600',
    marginBottom: '8px'
  },
  stepDesc: {
    fontSize: '14px',
    color: 'var(--text-muted)'
  },
  stepArrow: {
    fontSize: '32px',
    color: 'var(--accent-primary)'
  },
  finalCTA: {
    textAlign: 'center',
    padding: '100px 20px',
    position: 'relative',
    zIndex: 10
  },
  ctaTitle: {
    fontSize: '36px',
    fontWeight: '700',
    marginBottom: '16px'
  },
  ctaSubtitle: {
    fontSize: '18px',
    color: 'var(--text-muted)',
    marginBottom: '32px'
  },
  ctaButton: {
    display: 'inline-block',
    padding: '18px 40px',
    backgroundColor: 'var(--accent-secondary)',
    color: '#000',
    textDecoration: 'none',
    borderRadius: '12px',
    fontWeight: '700',
    fontSize: '18px',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
    transition: 'all 0.3s'
  },
  footer: {
    textAlign: 'center',
    padding: '40px 20px',
    color: 'var(--text-muted)',
    fontSize: '14px',
    borderTop: '1px solid var(--glass-border)'
  }
};

export default LandingPage;
