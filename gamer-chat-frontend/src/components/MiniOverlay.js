import React, { useContext, useState, useEffect } from 'react';
import { SocketContext } from '../context/SocketContext';
import { VoiceContext } from '../context/VoiceContext';

function MiniOverlay({ group, messages }) {
  const { remoteStreams, isInVoice } = useContext(VoiceContext);
  const [minimized, setMinimized] = useState(false);

  if (!group) return null;

  return (
    <div style={styles.overlayContainer}>
      <div style={styles.header}>
        <span style={styles.title}>🎮 {group.name}</span>
        <button onClick={() => setMinimized(!minimized)} style={styles.toggleBtn}>
          {minimized ? '🔼' : '🔽'}
        </button>
      </div>

      {!minimized && (
        <div style={styles.body}>
          {/* Voice Participants */}
          <div style={styles.section}>
            <p style={styles.sectionTitle}>🔊 Voice</p>
            <div style={styles.voiceList}>
              {isInVoice && <span style={styles.voiceBadge}>You</span>}
              {Object.keys(remoteStreams).map(userId => (
                <span key={userId} style={styles.voiceBadge}>User {userId.substring(0, 4)}</span>
              ))}
              {Object.keys(remoteStreams).length === 0 && !isInVoice && <span style={styles.empty}>None</span>}
            </div>
          </div>

          {/* Recent Messages */}
          <div style={styles.section}>
            <p style={styles.sectionTitle}>💬 Chat</p>
            <div style={styles.messageList}>
              {messages.slice(-3).map((msg, i) => (
                <div key={i} style={styles.miniMessage}>
                  <strong style={styles.sender}>{msg.sender?.username}:</strong> {msg.content}
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div style={styles.section}>
            <div style={styles.quickActions}>
              <button style={styles.actionBtn}>👍 GG</button>
              <button style={styles.actionBtn}>🔥 Nice</button>
              <button style={styles.actionBtn}>🆘 Help</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  overlayContainer: {
    position: 'fixed',
    top: '20px',
    right: '20px',
    width: '240px',
    backgroundColor: 'rgba(39, 36, 36, 0.85)',
    backdropFilter: 'blur(10px)',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    color: '#fff',
    zIndex: 2000,
    fontFamily: 'system-ui, sans-serif',
    overflow: 'hidden'
  },
  header: {
    padding: '10px 15px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderBottom: '1px solid rgba(255,255,255,0.05)'
  },
  title: {
    fontSize: '12px',
    fontWeight: 'bold',
    opacity: 0.9,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  toggleBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '12px',
    padding: '2px'
  },
  body: {
    padding: '12px'
  },
  section: {
    marginBottom: '10px'
  },
  sectionTitle: {
    fontSize: '10px',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    opacity: 0.5,
    marginBottom: '6px',
    margin: 0
  },
  voiceList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px'
  },
  voiceBadge: {
    fontSize: '11px',
    backgroundColor: 'rgba(40, 167, 69, 0.2)',
    border: '1px solid rgba(40, 167, 69, 0.4)',
    color: '#34d058',
    padding: '2px 6px',
    borderRadius: '4px'
  },
  messageList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    maxHeight: '100px',
    overflowY: 'auto'
  },
  miniMessage: {
    fontSize: '11px',
    lineHeight: '1.4',
    wordBreak: 'break-word'
  },
  sender: {
    color: '#556158ff'
  },
  empty: {
    fontSize: '11px',
    opacity: 0.3
  },
  quickActions: {
    display: 'flex',
    gap: '6px',
    marginTop: '5px'
  },
  actionBtn: {
    flex: 1,
    padding: '4px',
    fontSize: '10px',
    backgroundColor: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '4px',
    color: '#fff',
    cursor: 'pointer',
    transition: 'all 0.2s'
  }
};

export default MiniOverlay;
