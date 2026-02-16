// src/components/IncomingCallOverlay.js
import React, { useContext, useEffect, useRef, useState } from 'react';
import { VoiceContext } from '../context/VoiceContext';

const IncomingCallOverlay = () => {
  const { privateCall, acceptPrivateCall, declinePrivateCall } = useContext(VoiceContext);
  const audioContextRef = useRef(null);
  const oscillatorRef = useRef(null);
  const intervalRef = useRef(null);
  const [ringtoneType, setRingtoneType] = useState(
    localStorage.getItem('ringtoneType') || 'classic'
  );

  // Ringtone patterns
  const ringtonePatterns = {
    classic: { freq: 440, pattern: [200, 100, 200, 500] },
    modern: { freq: 880, pattern: [300, 200] },
    retro: { freq: 330, pattern: [150, 150, 150, 300] },
    gentle: { freq: 523, pattern: [400, 400] },
  };

  const stopRingtone = () => {
    console.log('[IncomingCallOverlay] Stopping ringtone');
    if (intervalRef.current) {
      clearTimeout(intervalRef.current);
      intervalRef.current = null;
    }
    if (oscillatorRef.current) {
      try { oscillatorRef.current.stop(); } catch (e) {}
      oscillatorRef.current = null;
    }
    if (audioContextRef.current) {
      try {
        if (audioContextRef.current.state !== 'closed') {
          audioContextRef.current.close().catch(console.error);
        }
      } catch (e) {}
      audioContextRef.current = null;
    }
  };

  const playRingtone = async () => {
    try {
      // Guard: Only play if we are actually receiving
      if (privateCall.status !== 'receiving') return;
      
      stopRingtone(); // Reset

      console.log('[IncomingCallOverlay] Starting ringtone');
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const ctx = audioContextRef.current;
      
      if (ctx.state === 'suspended') await ctx.resume();
      
      const pattern = ringtonePatterns[ringtoneType] || ringtonePatterns.classic;
      let patternIndex = 0;
      
      const playNextStep = () => {
        // Final sanity check
        if (!audioContextRef.current || ctx.state !== 'running' || privateCall.status !== 'receiving') {
          stopRingtone();
          return;
        }
        
        const duration = pattern.pattern[patternIndex] / 1000;
        const isNote = patternIndex % 2 === 0;
        
        if (isNote) {
          if (oscillatorRef.current) try { oscillatorRef.current.stop(); } catch(e){}
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = 'sine';
          osc.frequency.value = pattern.freq;
          gain.gain.setValueAtTime(0.3, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + duration);
          oscillatorRef.current = osc;
        }
        
        patternIndex = (patternIndex + 1) % pattern.pattern.length;
        intervalRef.current = setTimeout(playNextStep, duration * 1000);
      };
      
      playNextStep();
    } catch (e) {
      console.error('Ringtone play error:', e);
    }
  };

  useEffect(() => {
    if (privateCall.status === 'receiving') {
      playRingtone();
    } else {
      stopRingtone();
    }
    
    return () => stopRingtone();
  }, [privateCall.status, ringtoneType]);

  const handleRingtoneChange = (type) => {
    setRingtoneType(type);
    localStorage.setItem('ringtoneType', type);
  };

  if (privateCall.status !== 'receiving') return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.card} className="glass-panel animate-in">
        <div style={styles.avatarRing}>
          <div style={styles.avatar}>
            {privateCall.targetUser?.username?.[0]?.toUpperCase() || '?'}
          </div>
        </div>
        
        <h2 style={styles.callerName}>{privateCall.targetUser?.username || 'Someone'}</h2>
        <p style={styles.callType}>
          {privateCall.isVideo ? '📹 Incoming Video Call' : '📞 Incoming Voice Call'}
        </p>
        
        <div style={styles.actions}>
          <button 
            onClick={() => { stopRingtone(); declinePrivateCall(); }} 
            style={styles.declineBtn}
          >
            ❌ Decline
          </button>
          <button 
            onClick={() => { stopRingtone(); acceptPrivateCall(); }} 
            style={styles.acceptBtn}
          >
            ✅ Answer
          </button>
        </div>

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
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20000, // Above everything
    backdropFilter: 'blur(10px)'
  },
  card: {
    padding: '48px',
    borderRadius: '32px',
    textAlign: 'center',
    maxWidth: '400px',
    width: '90%',
    backgroundColor: '#1a1a1a',
    border: '1px solid rgba(255,255,255,0.1)',
    boxShadow: '0 24px 64px rgba(0,0,0,0.5)'
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
    animation: 'pulse 2s infinite',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
  },
  avatar: {
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    backgroundColor: 'var(--bg-primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '48px',
    fontWeight: 'bold',
    color: 'var(--text-main)'
  },
  callerName: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: '8px'
  },
  callType: {
    fontSize: '16px',
    color: 'rgba(255,255,255,0.5)',
    marginBottom: '40px'
  },
  actions: {
    display: 'flex',
    gap: '16px',
    justifyContent: 'center',
    marginBottom: '32px'
  },
  declineBtn: {
    padding: '16px 32px',
    borderRadius: '12px',
    border: 'none',
    backgroundColor: '#f04747',
    color: '#fff',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'transform 0.2s',
    boxShadow: '0 4px 12px rgba(240, 71, 71, 0.3)'
  },
  acceptBtn: {
    padding: '16px 32px',
    borderRadius: '12px',
    border: 'none',
    backgroundColor: '#43b581',
    color: '#fff',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'transform 0.2s',
    boxShadow: '0 4px 12px rgba(67, 181, 129, 0.3)'
  },
  ringtoneSection: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    paddingTop: '20px',
    borderTop: '1px solid rgba(255,255,255,0.05)'
  },
  ringtoneLabel: {
    fontSize: '13px',
    color: 'rgba(255,255,255,0.4)'
  },
  ringtoneSelect: {
    padding: '6px 12px',
    borderRadius: '6px',
    backgroundColor: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#fff',
    fontSize: '13px',
    cursor: 'pointer'
  }
};

export default IncomingCallOverlay;
