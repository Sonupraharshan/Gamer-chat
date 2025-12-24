// src/components/IncomingCallOverlay.js
import React, { useContext, useEffect, useRef, useState } from 'react';
import { VoiceContext } from '../context/VoiceContext';

const IncomingCallOverlay = () => {
  const { privateCall, acceptPrivateCall, declinePrivateCall } = useContext(VoiceContext);
  const audioContextRef = useRef(null);
  const oscillatorRef = useRef(null);
  const gainRef = useRef(null);
  const intervalRef = useRef(null);
  const isComponentActive = useRef(false);
  const [ringtoneType, setRingtoneType] = useState(
    localStorage.getItem('ringtoneType') || 'classic'
  );

  // Ringtone patterns
  const ringtonePatterns = {
    classic: { freq: 440, pattern: [200, 100, 200, 500] }, // A4 note, short-short-pause
    modern: { freq: 880, pattern: [300, 200] }, // A5 note, longer beeps
    retro: { freq: 330, pattern: [150, 150, 150, 300] }, // E4 note, triplet
    gentle: { freq: 523, pattern: [400, 400] }, // C5 note, slow pulse
  };

  const playRingtone = async () => {
    try {
      if (!isComponentActive.current) return;

      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      
      const ctx = audioContextRef.current;
      
      // Resume context if suspended (browser autoplay policy)
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      // Check again after await
      if (!isComponentActive.current) return;
      
      const pattern = ringtonePatterns[ringtoneType] || ringtonePatterns.classic;
      let patternIndex = 0;
      
      const playNote = () => {
        // Don't play if context not running or component unmounted
        if (!isComponentActive.current || ctx.state !== 'running') return;
        
        // Clean up previous oscillator
        if (oscillatorRef.current) {
          try { oscillatorRef.current.stop(); } catch (e) {}
        }
        
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'sine';
        osc.frequency.value = pattern.freq;
        
        const duration = pattern.pattern[patternIndex] / 1000;
        const isNote = patternIndex % 2 === 0;
        
        gain.gain.setValueAtTime(isNote ? 0.3 : 0, ctx.currentTime);
        if (isNote) {
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
        }
        
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + duration);
        
        oscillatorRef.current = osc;
        gainRef.current = gain;
        
        patternIndex = (patternIndex + 1) % pattern.pattern.length;
      };
      
      // Play immediately and then on interval
      playNote();
      intervalRef.current = setInterval(playNote, 
        pattern.pattern.reduce((a, b) => a + b, 0) / (pattern.pattern.length / 2 || 1) // Better interval calculation
      );
    } catch (e) {
      console.error('Ringtone play error:', e);
    }
  };

  const stopRingtone = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (oscillatorRef.current) {
      try { oscillatorRef.current.stop(); } catch (e) {}
      oscillatorRef.current = null;
    }
  };

  // Unlock audio on first user interaction (browser autoplay policy workaround)
  useEffect(() => {
    const unlockAudio = () => {
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }
    };
    
    // Listen for first interaction
    document.addEventListener('click', unlockAudio, { once: true });
    document.addEventListener('touchstart', unlockAudio, { once: true });
    document.addEventListener('keydown', unlockAudio, { once: true });
    
    return () => {
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
      document.removeEventListener('keydown', unlockAudio);
    };
  }, []);

  useEffect(() => {
    isComponentActive.current = (privateCall.status === 'receiving');
    
    if (isComponentActive.current) {
      playRingtone();
    } else {
      stopRingtone();
    }
    
    return () => {
      isComponentActive.current = false;
      stopRingtone();
    };
  }, [privateCall.status, ringtoneType]);

  // Save ringtone preference
  const handleRingtoneChange = (type) => {
    setRingtoneType(type);
    localStorage.setItem('ringtoneType', type);
  };

  if (privateCall.status !== 'receiving') return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.card} className="glass-panel animate-in">
        {/* Caller Avatar */}
        <div style={styles.avatarRing}>
          <div style={styles.avatar}>
            {privateCall.targetUser?.username?.[0]?.toUpperCase() || '?'}
          </div>
        </div>
        
        {/* Caller Info */}
        <h2 style={styles.callerName}>{privateCall.targetUser?.username || 'Someone'}</h2>
        <p style={styles.callType}>
          {privateCall.isVideo ? '📹 Incoming Video Call' : '📞 Incoming Voice Call'}
        </p>
        
        {/* Action Buttons */}
        <div style={styles.actions}>
          <button onClick={declinePrivateCall} style={styles.declineBtn}>
            ❌ Decline
          </button>
          <button onClick={acceptPrivateCall} style={styles.acceptBtn}>
            ✅ Answer
          </button>
        </div>

        {/* Ringtone Selector */}
        <div style={styles.ringtoneSection}>
          <span style={styles.ringtoneLabel}>Ringtone:</span>
          <select 
            value={ringtoneType} 
            onChange={(e) => handleRingtoneChange(e.target.value)}
            style={styles.ringtoneSelect}
          >
            <option value="classic">Classic</option>
            <option value="modern">Modern</option>
            <option value="retro">Retro</option>
            <option value="gentle">Gentle</option>
          </select>
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
    backdropFilter: 'blur(8px)'
  },
  card: {
    padding: '48px',
    borderRadius: '24px',
    textAlign: 'center',
    maxWidth: '400px',
    width: '90%',
    animation: 'pulse 2s ease-in-out infinite'
  },
  avatarRing: {
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 24px',
    animation: 'pulse 1.5s ease-in-out infinite',
    boxShadow: '0 0 40px rgba(125, 95, 255, 0.5)'
  },
  avatar: {
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    backgroundColor: 'var(--bg-secondary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '48px',
    fontWeight: '700',
    color: '#fff'
  },
  callerName: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#fff',
    marginBottom: '8px'
  },
  callType: {
    fontSize: '16px',
    color: 'var(--text-muted)',
    marginBottom: '32px'
  },
  actions: {
    display: 'flex',
    gap: '16px',
    justifyContent: 'center',
    marginBottom: '24px'
  },
  declineBtn: {
    padding: '16px 32px',
    borderRadius: '50px',
    border: 'none',
    backgroundColor: '#f04747',
    color: '#fff',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 0 20px rgba(240, 71, 71, 0.4)'
  },
  acceptBtn: {
    padding: '16px 32px',
    borderRadius: '50px',
    border: 'none',
    backgroundColor: '#43b581',
    color: '#fff',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 0 20px rgba(67, 181, 129, 0.4)'
  },
  ringtoneSection: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px'
  },
  ringtoneLabel: {
    fontSize: '13px',
    color: 'var(--text-muted)'
  },
  ringtoneSelect: {
    padding: '6px 12px',
    borderRadius: '8px',
    border: '1px solid var(--glass-border)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: '#fff',
    fontSize: '13px',
    cursor: 'pointer',
    outline: 'none'
  }
};

export default IncomingCallOverlay;
