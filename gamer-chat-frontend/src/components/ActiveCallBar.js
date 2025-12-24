import React, { useContext, useEffect, useState } from 'react';
import { VoiceContext } from '../context/VoiceContext';
import * as groupApi from '../api/groupApi';

const ActiveCallBar = () => {
  const { 
    isInVoice, currentGroupId, isMuted, toggleMute, 
    isCameraOn, toggleCamera, isSharingScreen, 
    startScreenShare, stopScreenShare, leaveVoice 
  } = useContext(VoiceContext);
  
  const [groupName, setGroupName] = useState('Voice Channel');

  useEffect(() => {
    const fetchGroupName = async () => {
      if (currentGroupId) {
        try {
          const data = await groupApi.getGroupDetails(currentGroupId);
          setGroupName(data.name);
        } catch (error) {
          console.error("Error fetching group name for ActiveCallBar:", error);
        }
      }
    };
    fetchGroupName();
  }, [currentGroupId]);

  if (!isInVoice) return null;

  return (
    <div style={styles.bar}>
      <div style={styles.info}>
        <div style={styles.icon}>🔊</div>
        <div>
          <div style={styles.status}>Voice Connected</div>
          <div style={styles.channelName}>{groupName}</div>
        </div>
      </div>
      
      <div style={styles.controls}>
        <button 
          onClick={toggleMute} 
          style={{...styles.btn, backgroundColor: isMuted ? '#f04747' : '#36393f'}}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? '🎙️' : '🎙️'}
        </button>
        <button 
          onClick={toggleCamera} 
          style={{...styles.btn, backgroundColor: isCameraOn ? '#43b581' : '#36393f'}}
          title={isCameraOn ? 'Turn Off Camera' : 'Turn On Camera'}
        >
          📹
        </button>
        <button 
          onClick={() => isSharingScreen ? stopScreenShare() : startScreenShare()} 
          style={{...styles.btn, backgroundColor: isSharingScreen ? '#43b581' : '#36393f'}}
          title={isSharingScreen ? 'Stop Sharing' : 'Share Screen'}
        >
          🖥️
        </button>
        <button 
          onClick={leaveVoice} 
          style={styles.leaveBtn}
          title="Disconnect from Voice"
        >
          ✖️
        </button>
      </div>
    </div>
  );
};

const styles = {
  bar: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    width: '340px', // Matches your left panel width roughly
    height: '52px',
    backgroundColor: '#232428',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 12px',
    borderTop: '1px solid rgba(255,255,255,0.05)',
    zIndex: 9999,
    boxShadow: '0 -2px 10px rgba(0,0,0,0.2)',
    borderTopRightRadius: '8px'
  },
  info: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  icon: {
    fontSize: '18px'
  },
  status: {
    fontSize: '12px',
    fontWeight: 'bold',
    color: '#43b581'
  },
  channelName: {
    fontSize: '11px',
    color: '#b9bbbe',
    maxWidth: '120px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  controls: {
    display: 'flex',
    gap: '6px'
  },
  btn: {
    width: '32px',
    height: '32px',
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    transition: 'background-color 0.2s'
  },
  leaveBtn: {
    width: '32px',
    height: '32px',
    borderRadius: '4px',
    backgroundColor: '#f04747',
    border: 'none',
    cursor: 'pointer',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px'
  }
};

export default ActiveCallBar;
