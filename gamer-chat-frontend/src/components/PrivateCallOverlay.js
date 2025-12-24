// src/components/PrivateCallOverlay.js
import React, { useContext, useEffect, useState } from 'react';
import { VoiceContext } from '../context/VoiceContext';

const PrivateCallOverlay = () => {
  const { 
    privateCall, endPrivateCall, localStream, remoteStreams, remoteCameraStreams,
    isMuted, toggleMute, isCameraOn, toggleCamera
  } = useContext(VoiceContext);
  
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Handle resize
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Only show when in an active private call
  if (privateCall.status !== 'in-call' && privateCall.status !== 'calling') {
    return null;
  }
  
  const isCalling = privateCall.status === 'calling';
  const targetId = privateCall.targetUser?._id;
  const remoteAudio = targetId ? remoteStreams[targetId] : null;
  const remoteVideo = targetId ? remoteCameraStreams[targetId] : null;

  return (
    <div style={styles.overlay}>
      <div style={isMobile ? styles.containerMobile : styles.containerDesktop} className="glass-panel">
        {/* Header (Top) */}
        <div style={styles.header}>
          <div style={styles.userInfo}>
            <div style={styles.statusDot} />
            <span style={styles.username}>
              {isCalling ? `Calling ${privateCall.targetUser?.username}...` : privateCall.targetUser?.username}
            </span>
          </div>
          <div style={styles.callLabel}>
            {privateCall.isVideo ? '📹 Secure Video Call' : '📞 Secure Voice Call'}
          </div>
        </div>

        {/* Media Content (Middle) */}
        <div style={styles.mediaArea}>
          {/* Main Content (Remote Video or Avatar) */}
          <div style={styles.mainFeed}>
            {remoteVideo ? (
              <video 
                ref={el => { if (el) el.srcObject = remoteVideo; }}
                autoPlay
                playsInline
                style={styles.remoteVideo}
              />
            ) : (
              <div style={styles.avatarContainer}>
                <div style={styles.avatar}>
                  {privateCall.targetUser?.username?.[0]?.toUpperCase() || '?'}
                </div>
                {isCalling && <div style={styles.callingPulse} />}
                <div style={{ marginTop: '20px', color: '#fff', fontSize: '18px', fontWeight: '500' }}>
                  {isCalling ? 'Establishing Connection...' : 'Voice Connected'}
                </div>
              </div>
            )}
          </div>

          {/* Local Feed (Picture-in-Picture) */}
          {privateCall.isVideo && localStream && (
            <div style={isMobile ? styles.localFeedMobile : styles.localFeedDesktop}>
              <video 
                ref={el => { if (el) el.srcObject = localStream; }}
                autoPlay
                playsInline
                muted
                style={styles.localVideo}
              />
              <div style={styles.localTag}>You</div>
            </div>
          )}
        </div>

        {/* Controls (Bottom) */}
        <div style={isMobile ? styles.controlsMobile : styles.controlsDesktop}>
          <div style={styles.controlsGroup}>
            <button 
              onClick={(e) => { e.stopPropagation(); toggleMute(); }}
              style={{...styles.controlBtn, backgroundColor: isMuted ? '#f04747' : 'rgba(255,255,255,0.1)'}}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              <span style={{ fontSize: '20px' }}>{isMuted ? '🔇' : '🎙️'}</span>
              {!isMobile && <span style={styles.btnLabel}>{isMuted ? 'Unmute' : 'Mute'}</span>}
            </button>
            
            {privateCall.isVideo && (
              <button 
                onClick={(e) => { e.stopPropagation(); toggleCamera(); }}
                style={{...styles.controlBtn, backgroundColor: isCameraOn ? 'rgba(67, 181, 129, 0.2)' : 'rgba(255,255,255,0.1)'}}
                title={isCameraOn ? 'Turn Off Camera' : 'Turn On Camera'}
              >
                <span style={{ fontSize: '20px' }}>📹</span>
                {!isMobile && <span style={styles.btnLabel}>{isCameraOn ? 'Stop Video' : 'Start Video'}</span>}
              </button>
            )}
          </div>

          <button 
            onClick={(e) => { e.stopPropagation(); endPrivateCall(); }}
            style={isMobile ? styles.endCallBtnMobile : styles.endCallBtnDesktop}
            title="End Call"
          >
            <span style={{ fontSize: '24px', transform: 'rotate(135deg)', display: 'inline-block' }}>📞</span>
            {!isMobile && <span style={{ marginLeft: '12px', fontWeight: '700', fontSize: '16px' }}>End Call</span>}
          </button>
        </div>

        {/* Hidden Audio */}
        <audio ref={el => { if (el) el.srcObject = remoteAudio; }} autoPlay />
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
    backgroundColor: '#0f0f0f',
    zIndex: 10000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  containerDesktop: {
    width: '100%',
    height: '100dvh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#1a1a1a',
    position: 'relative',
    overflow: 'hidden'
  },
  containerMobile: {
    width: '100%',
    height: '100dvh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#000',
    position: 'relative'
  },
  header: {
    height: '60px',
    padding: '0 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    zIndex: 10
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#43b581',
    boxShadow: '0 0 8px #43b581'
  },
  username: {
    color: '#fff',
    fontWeight: '600',
    fontSize: '16px'
  },
  callLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: '12px',
    textTransform: 'uppercase',
    letterSpacing: '1px'
  },
  mediaArea: {
    flex: 1,
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000'
  },
  mainFeed: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  remoteVideo: {
    width: '100%',
    height: '100%',
    objectFit: 'contain'
  },
  avatarContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  avatar: {
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    backgroundColor: '#5865f2',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '48px',
    fontWeight: 'bold',
    color: '#fff',
    position: 'relative'
  },
  callingPulse: {
    position: 'absolute',
    width: '140px',
    height: '140px',
    borderRadius: '50%',
    border: '2px solid #5865f2',
    animation: 'pulse 1.5s infinite'
  },
  localFeedDesktop: {
    position: 'absolute',
    top: '24px',
    right: '24px',
    width: '280px',
    height: '160px',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    border: '1px solid rgba(255,255,255,0.1)'
  },
  localFeedMobile: {
    position: 'absolute',
    top: '80px',
    right: '16px',
    width: '100px',
    height: '150px',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
    border: '1px solid rgba(255,255,255,0.1)'
  },
  localVideo: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  localTag: {
    position: 'absolute',
    bottom: '8px',
    left: '8px',
    backgroundColor: 'rgba(0,0,0,0.5)',
    color: '#fff',
    fontSize: '10px',
    padding: '2px 6px',
    borderRadius: '4px'
  },
  controlsDesktop: {
    height: '100px',
    backgroundColor: 'rgba(0,0,0,0.9)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 40px',
    gap: '40px',
    zIndex: 10
  },
  controlsMobile: {
    height: '120px',
    backgroundColor: 'rgba(0,0,0,0.9)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '20px',
    paddingBottom: '20px',
    zIndex: 10
  },
  controlsGroup: {
    display: 'flex',
    gap: '16px'
  },
  controlBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    height: '50px',
    padding: '0 20px',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#fff',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  btnLabel: {
    fontWeight: '500',
    fontSize: '14px'
  },
  endCallBtnDesktop: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f04747',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    height: '50px',
    padding: '0 32px',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(240, 71, 71, 0.4)',
    transition: 'all 0.2s'
  },
  endCallBtnMobile: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    backgroundColor: '#f04747',
    color: '#fff',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(240, 71, 71, 0.4)'
  }
};

export default PrivateCallOverlay;
