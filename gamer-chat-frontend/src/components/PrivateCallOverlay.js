// src/components/PrivateCallOverlay.js
import React, { useContext, useRef, useEffect, useState } from 'react';
import { VoiceContext } from '../context/VoiceContext';

const PrivateCallOverlay = () => {
  const { 
    privateCall, endPrivateCall, localStream, remoteStreams, remoteCameraStreams,
    isMuted, toggleMute, isCameraOn, toggleCamera
  } = useContext(VoiceContext);
  
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Handle resize
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Set local video stream
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Set remote video/audio streams
  useEffect(() => {
    if (!privateCall.targetUser) return;
    
    const remoteAudio = remoteStreams[privateCall.targetUser._id];
    const remoteVideo = remoteCameraStreams[privateCall.targetUser._id];
    
    if (remoteAudioRef.current && remoteAudio) {
      remoteAudioRef.current.srcObject = remoteAudio;
    }
    if (remoteVideoRef.current && remoteVideo) {
      remoteVideoRef.current.srcObject = remoteVideo;
    }
  }, [privateCall.targetUser, remoteStreams, remoteCameraStreams]);

  const toggleFullscreen = (videoElement) => {
    if (!videoElement) return;
    if (videoElement.requestFullscreen) {
      videoElement.requestFullscreen();
    } else if (videoElement.webkitRequestFullscreen) {
      videoElement.webkitRequestFullscreen();
    }
  };

  // Only show when in an active private call
  if (privateCall.status !== 'in-call' && privateCall.status !== 'calling') return null;

  const isCalling = privateCall.status === 'calling';
  const hasRemoteVideo = privateCall.targetUser && remoteCameraStreams[privateCall.targetUser._id];

  // Dynamic styles based on mobile
  const dynamicStyles = {
    callContainer: {
      ...styles.callContainer,
      width: isMobile ? '100%' : '90%',
      height: isMobile ? '100vh' : '80vh',
      maxWidth: isMobile ? '100%' : '900px',
      borderRadius: isMobile ? 0 : '24px',
    },
    header: {
      ...styles.header,
      padding: isMobile ? '12px 16px' : '20px',
      flexDirection: isMobile ? 'column' : 'row',
      gap: isMobile ? '4px' : '0',
    },
    callerName: {
      ...styles.callerName,
      fontSize: isMobile ? '16px' : '20px',
    },
    localVideoContainer: {
      ...styles.localVideoContainer,
      width: isMobile ? '100px' : '180px',
      height: isMobile ? '75px' : '120px',
      bottom: isMobile ? '90px' : '20px',
      right: isMobile ? '10px' : '20px',
    },
    controls: {
      ...styles.controls,
      padding: isMobile ? '12px' : '20px',
      gap: isMobile ? '12px' : '20px',
    },
    controlBtn: {
      ...styles.controlBtn,
      width: isMobile ? '50px' : '60px',
      height: isMobile ? '50px' : '60px',
      fontSize: isMobile ? '20px' : '24px',
    },
    endCallBtn: {
      ...styles.endCallBtn,
      width: isMobile ? '50px' : '60px',
      height: isMobile ? '50px' : '60px',
      fontSize: isMobile ? '20px' : '24px',
    },
  };

  return (
    <div style={styles.overlay}>
      <div style={dynamicStyles.callContainer} className="glass-panel">
        {/* Call Header */}
        <div style={dynamicStyles.header}>
          <span style={dynamicStyles.callerName}>
            {isCalling ? `Calling ${privateCall.targetUser?.username}...` : `In call with ${privateCall.targetUser?.username}`}
          </span>
          <span style={styles.callType}>
            {privateCall.isVideo ? '📹 Video Call' : '📞 Voice Call'}
          </span>
        </div>

        {/* Video Area */}
        <div style={styles.videoArea}>
          {/* Remote Video (Large) */}
          <div style={styles.remoteVideoContainer}>
            {hasRemoteVideo ? (
              <video 
                ref={remoteVideoRef}
                autoPlay
                playsInline
                style={styles.remoteVideo}
                onClick={(e) => toggleFullscreen(e.target)}
                title="Click to fullscreen"
              />
            ) : (
              <div style={styles.avatarPlaceholder}>
                <span style={styles.avatarChar}>
                  {privateCall.targetUser?.username?.[0]?.toUpperCase() || '?'}
                </span>
                {isCalling && <div style={styles.callingPulse} />}
              </div>
            )}
            {/* Fullscreen button for remote video */}
            {hasRemoteVideo && (
              <button 
                style={styles.fullscreenBtn}
                onClick={() => toggleFullscreen(remoteVideoRef.current)}
                title="Fullscreen"
              >
                ⛶
              </button>
            )}
          </div>

          {/* Local Video (Small Picture-in-Picture) */}
          {privateCall.isVideo && localStream && (
            <div style={dynamicStyles.localVideoContainer}>
              <video 
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                style={styles.localVideo}
                onClick={(e) => toggleFullscreen(e.target)}
              />
            </div>
          )}
        </div>

        {/* Hidden audio for remote */}
        <audio ref={remoteAudioRef} autoPlay />

        {/* Controls */}
        <div style={dynamicStyles.controls}>
          <button 
            onClick={toggleMute}
            style={{...dynamicStyles.controlBtn, backgroundColor: isMuted ? '#f04747' : '#36393f'}}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? '🔇' : '🎙️'}
          </button>
          
          {privateCall.isVideo && (
            <button 
              onClick={toggleCamera}
              style={{...dynamicStyles.controlBtn, backgroundColor: isCameraOn ? '#43b581' : '#36393f'}}
              title={isCameraOn ? 'Turn Off Camera' : 'Turn On Camera'}
            >
              📹
            </button>
          )}
          
          <button 
            onClick={endPrivateCall}
            style={dynamicStyles.endCallBtn}
            title="End Call"
          >
            📞
          </button>
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
    zIndex: 9999,
    backdropFilter: 'blur(8px)'
  },
  callContainer: {
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)'
  },
  callerName: {
    fontWeight: '700',
    color: '#fff'
  },
  callType: {
    fontSize: '14px',
    color: 'var(--text-muted)'
  },
  videoArea: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  remoteVideoContainer: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative'
  },
  remoteVideo: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    cursor: 'pointer'
  },
  avatarPlaceholder: {
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    backgroundColor: 'var(--accent-primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative'
  },
  avatarChar: {
    fontSize: '48px',
    fontWeight: '700',
    color: '#fff'
  },
  callingPulse: {
    position: 'absolute',
    top: '-10px',
    left: '-10px',
    right: '-10px',
    bottom: '-10px',
    borderRadius: '50%',
    border: '3px solid var(--accent-secondary)',
    animation: 'pulse 1.5s ease-in-out infinite'
  },
  localVideoContainer: {
    position: 'absolute',
    borderRadius: '12px',
    overflow: 'hidden',
    border: '2px solid var(--glass-border)',
    boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
  },
  localVideo: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    cursor: 'pointer'
  },
  fullscreenBtn: {
    position: 'absolute',
    top: '20px',
    right: '20px',
    background: 'rgba(0,0,0,0.5)',
    border: 'none',
    color: '#fff',
    fontSize: '24px',
    padding: '10px 15px',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  controls: {
    display: 'flex',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)'
  },
  controlBtn: {
    borderRadius: '50%',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    transition: 'all 0.2s'
  },
  endCallBtn: {
    borderRadius: '50%',
    border: 'none',
    backgroundColor: '#f04747',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    transform: 'rotate(135deg)',
    boxShadow: '0 0 20px rgba(240, 71, 71, 0.4)'
  }
};

export default PrivateCallOverlay;
