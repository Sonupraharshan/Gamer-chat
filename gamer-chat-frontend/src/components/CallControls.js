import React, { useContext } from 'react';
import { VoiceContext } from '../context/VoiceContext';

const CallControls = () => {
  const { 
    isInVoice, isMuted, isDeafened, isCameraOn, isSharingScreen,
    toggleMute, toggleDeafen, toggleCamera, startScreenShare, stopScreenShare, leaveVoice 
  } = useContext(VoiceContext);

  if (!isInVoice) return null;

  return (
    <div style={styles.container}>
      <div style={styles.controlsGrid}>
        <button 
          onClick={toggleMute}
          title={isMuted ? "Unmute" : "Mute"}
          style={{...styles.controlBtn, backgroundColor: isMuted ? 'var(--accent-danger)' : 'var(--bg-tertiary)'}}
        >
          {isMuted ? '🎙️' : '🎤'}
        </button>

        <button 
          onClick={toggleDeafen}
          title={isDeafened ? "Undeafen" : "Deafen"}
          style={{...styles.controlBtn, backgroundColor: isDeafened ? 'var(--accent-danger)' : 'var(--bg-tertiary)'}}
        >
          {isDeafened ? '🎧' : '🔈'}
        </button>

        <button 
          onClick={toggleCamera}
          title={isCameraOn ? "Camera Off" : "Camera On"}
          style={{...styles.controlBtn, backgroundColor: isCameraOn ? 'var(--accent-secondary)' : 'var(--bg-tertiary)'}}
        >
          📹
        </button>

        <button 
          onClick={isSharingScreen ? stopScreenShare : startScreenShare}
          title={isSharingScreen ? "Stop Sharing" : "Share Screen"}
          style={{...styles.controlBtn, backgroundColor: isSharingScreen ? 'var(--accent-primary)' : 'var(--bg-tertiary)'}}
        >
          🖥️
        </button>

        <button 
          onClick={leaveVoice}
          title="Disconnect"
          style={{...styles.controlBtn, ...styles.disconnectBtn}}
        >
          📞
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    position: 'absolute',
    bottom: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 2000,
    padding: '16px',
    borderRadius: '40px',
    backgroundColor: 'rgba(22, 23, 29, 0.7)',
    backdropFilter: 'blur(16px)',
    border: '1px solid var(--glass-border)',
    boxShadow: '0 15px 50px rgba(0,0,0,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  controlsGrid: {
    display: 'flex',
    gap: '20px',
    alignItems: 'center',
  },
  controlBtn: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    border: '1px solid rgba(255,255,255,0.1)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '26px',
    transition: 'var(--transition-smooth)',
    color: '#fff',
    background: 'var(--bg-tertiary)',
    boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
  },
  disconnectBtn: {
    backgroundColor: 'var(--accent-tertiary)',
    transform: 'rotate(135deg)',
    boxShadow: '0 0 20px rgba(255, 62, 129, 0.4)'
  }
};

export default CallControls;
