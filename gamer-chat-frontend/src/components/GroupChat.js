import React, { useContext, useEffect, useState, useRef } from 'react';
import { SocketContext } from '../context/SocketContext';
import { AuthContext } from '../context/AuthContext';
import { getGroupDetails, getMessages, leaveGroup } from '../api/groupApi';
import MemberListItem from './MemberListItem';
import InviteModal from './InviteModal';
import { VoiceContext } from '../context/VoiceContext';
import MiniOverlay from './MiniOverlay';
import CallControls from './CallControls';

function GroupChat({ group: initialGroup, onLeave, onUpdate }) {
  const { socket, connected } = useContext(SocketContext);
  const { user } = useContext(AuthContext);
  const { 
    isInVoice, voiceParticipants, isMuted, isDeafened, joinVoice, leaveVoice, toggleMute, 
    remoteStreams, remoteCameraStreams, remoteScreenStreams, isSharingScreen, 
    startScreenShare, stopScreenShare, localScreenStream,
    isCameraOn, toggleCamera, localStream
  } = useContext(VoiceContext);
  const [group, setGroup] = useState(initialGroup);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [showMembers, setShowMembers] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [isFullScreenVideo, setIsFullScreenVideo] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!group) return;

    loadGroupDetails();
    loadMessages();

    // Join Socket.io room
    if (socket) {
      socket.emit('join-group', group._id);

      // Listen for new messages
      socket.on('group-message', handleIncomingMessage);
      socket.on('member-joined', handleMemberJoined);
      socket.on('member-left', handleMemberLeft);
      socket.on('member-kicked-notification', handleMemberKicked);
      socket.on('role-changed-notification', handleRoleChanged);
      socket.on('member-status-changed', handleMemberStatusChanged);

      return () => {
        socket.emit('leave-group', group._id);
        socket.off('group-message', handleIncomingMessage);
        socket.off('member-joined', handleMemberJoined);
        socket.off('member-left', handleMemberLeft);
        socket.off('member-kicked-notification', handleMemberKicked);
        socket.off('role-changed-notification', handleRoleChanged);
        socket.off('member-status-changed', handleMemberStatusChanged);
      };
    }
  }, [group?._id, socket]);

  // Polling fallback when socket is not connected (silent - no loading indicator)
  useEffect(() => {
    if (!group || connected) return; // Only poll if socket is NOT connected
    
    const pollInterval = setInterval(() => {
      pollMessages(); // Use silent polling function
    }, 3000); // Poll every 3 seconds
    
    return () => clearInterval(pollInterval);
  }, [group?._id, connected]);

  // Track previous message count to detect new messages
  const prevMessageCountRef = useRef(0);
  
  useEffect(() => {
    // Only scroll if new messages were added (not on initial load or same count)
    if (messages.length > prevMessageCountRef.current) {
      scrollToBottom();
    }
    prevMessageCountRef.current = messages.length;
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadGroupDetails = async () => {
    try {
      const data = await getGroupDetails(group._id);
      setGroup(data.group);
    } catch (err) {
      console.error('Failed to load group details:', err);
    }
  };

  const loadMessages = async () => {
    try {
      setLoading(true);
      const data = await getMessages(group._id);
      setMessages(data.messages);
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setLoading(false);
    }
  };

  // Silent polling - doesn't show loading indicator
  const pollMessages = async () => {
    try {
      const data = await getMessages(group._id);
      // Only update if there are new messages to avoid unnecessary re-renders
      if (data.messages.length !== messages.length) {
        setMessages(data.messages);
      }
    } catch (err) {
      console.error('Poll messages error:', err);
    }
  };

  const handleIncomingMessage = (message) => {
    if (message.groupId === group._id) {
      setMessages((prev) => [...prev, message]);
    }
  };

  const handleMemberJoined = ({ username }) => {
    // Silenced as per user request: i don't wanna if someone joined the lobby everytime
    loadGroupDetails();
  };

  const handleMemberLeft = ({ username }) => {
    // Silenced as per user request
    loadGroupDetails();
  };

  const handleMemberKicked = ({ kickedUserId, kickedUsername }) => {
    setMessages((prev) => [
      ...prev,
      {
        _id: `system-${Date.now()}-${Math.random()}`,
        system: true,
        content: `${kickedUsername} was kicked from the lobby`,
        createdAt: new Date()
      }
    ]);
    
    // If current user was kicked, leave the group
    if (kickedUserId === user.id) {
      alert('You have been kicked from this lobby');
      onLeave();
    } else {
      loadGroupDetails();
    }
  };

  const handleRoleChanged = ({ username, newRole }) => {
    setMessages((prev) => [
      ...prev,
      {
        _id: `system-${Date.now()}-${Math.random()}`,
        system: true,
        content: `${username} is now a ${newRole}`,
        createdAt: new Date()
      }
    ]);
    loadGroupDetails();
  };

  const handleMemberStatusChanged = ({ userId, status, gameStatus }) => {
    setGroup(prev => {
      if (!prev) return prev;
      const updateMember = (m) => m._id === userId ? { ...m, status, gameStatus } : m;
      return {
        ...prev,
        admin: updateMember(prev.admin),
        coAdmins: prev.coAdmins?.map(updateMember),
        members: prev.members?.map(updateMember)
      };
    });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;
    
    const messageContent = newMessage.trim();
    setNewMessage(''); // Clear immediately for better UX

    // Try socket first, then fall back to HTTP API
    if (socket && socket.connected) {
      socket.emit('send-group-message', {
        groupId: group._id,
        content: messageContent
      });
    } else {
      // Fallback to HTTP API
      try {
        const { sendMessage } = await import('../api/groupApi');
        await sendMessage(group._id, messageContent);
        // Reload messages silently (no loading indicator)
        pollMessages();
      } catch (err) {
        console.error('Failed to send message:', err);
        alert('Failed to send message. Please try again.');
        setNewMessage(messageContent); // Restore message on failure
      }
    }
  };

  const handleLeaveGroup = async () => {
    if (group.userRole === 'admin') {
      alert('Admin must transfer ownership before leaving');
      return;
    }

    if (window.confirm('Are you sure you want to leave this lobby?')) {
      try {
        await leaveGroup(group._id);
        onLeave();
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to leave group');
      }
    }
  };

  if (!group) return null;

  // Build members list without duplicates
  const allMembers = [];
  const addedIds = new Set();
  
  const addMember = (member) => {
    if (!member || typeof member !== 'object' || !member._id) return;
    const idStr = member._id.toString();
    if (!addedIds.has(idStr)) {
      allMembers.push(member);
      addedIds.add(idStr);
    }
  };

  // Add admin first
  addMember(group.admin);
  
  // Add co-admins
  if (group.coAdmins && Array.isArray(group.coAdmins)) {
    group.coAdmins.forEach(addMember);
  }
  
  // Add regular members
  if (group.members && Array.isArray(group.members)) {
    group.members.forEach(addMember);
  }

  return (
    <div style={styles.container} className="animate-in">
      <div style={styles.contentWrapper}>
        {/* Left Voice Sidebar */}
        <div style={styles.voiceSidebar} className="glass-panel">
          <div style={styles.sidebarCategory}>
            <span style={styles.categoryLabel}>TEXT CHANNELS</span>
            <div style={styles.channelItemActive} className="glow-hover">
              <span style={styles.channelHash}>#</span>
              <span style={styles.channelName}>{group.name}</span>
            </div>
          </div>

          <div style={styles.sidebarCategory}>
            <div style={styles.categoryHeader}>
              <span style={styles.categoryLabel}>VOICE CHANNELS</span>
              {!isInVoice && (
                <button 
                  onClick={() => joinVoice(group._id)} 
                  style={{...styles.categoryAction, cursor: 'pointer'}}
                  className="glow-text"
                  title="Join Voice"
                >
                  +
                </button>
              )}
            </div>
            
            <div 
              style={{
                ...styles.channelItem, 
                backgroundColor: isInVoice ? 'rgba(125, 95, 255, 0.15)' : 'transparent',
                cursor: 'pointer'
              }}
              className="glow-hover"
              onClick={() => !isInVoice && joinVoice(group._id)}
            >
              <span style={styles.channelIcon}>🔊</span>
              <span style={styles.channelName}>General Lobby</span>
            </div>

            <div style={styles.voiceParticipants}>
              {voiceParticipants.map(participant => (
                <div key={participant._id} style={styles.voiceUser}>
                  <div style={styles.voiceAvatarSmall}>
                    {participant.username[0].toUpperCase()}
                    <div style={{
                      ...styles.talkingIndicator,
                      boxShadow: remoteStreams[participant._id] || (participant._id === (user.id || user._id) && !isMuted) ? '0 0 10px 2px var(--accent-secondary)' : 'none'
                    }} />
                  </div>
                  <span style={styles.voiceUsernameSmall}>{participant.username}</span>
                  <div style={styles.voiceStatusIcons}>
                    {isMuted && participant._id === (user.id || user._id) && <span style={styles.miniIcon}>🔇</span>}
                    {remoteCameraStreams[participant._id] && <span style={styles.miniIcon}>🎥</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* User Pane Bottom */}
          <div style={styles.userPane} className="glass-panel">
            <div style={styles.userPaneAvatar}>
              {user.username[0].toUpperCase()}
              <div style={styles.userPaneStatus} />
            </div>
            <div style={styles.userPaneInfo}>
              <div style={styles.userPaneName} className="glow-text">{user.username}</div>
              <div style={styles.userPaneTag}>#{user.id ? user.id.slice(-4) : user._id.slice(-4)}</div>
            </div>
            <div style={styles.userPaneActions}>
              <button 
                onClick={toggleMute} 
                style={styles.paneBtn}
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? '🔇' : '🎤'}
              </button>
              <button style={styles.paneBtn} title="Settings">⚙️</button>
            </div>
          </div>
        </div>

        {/* Center Main Area */}
        <div style={styles.mainArea}>
          {/* Header */}
          <div style={styles.header}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={styles.title}>{group.name}</h2>
              <div 
                title={connected ? "Connected" : "Disconnected"}
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: connected ? '#28a745' : '#dc3545'
                }}
              />
            </div>
            <div style={styles.headerActions}>
              <button onClick={() => setShowInvite(true)} style={styles.inviteBtn}>
                Invite Members
              </button>
            </div>
          </div>

          {/* Chat Container */}
          <div style={styles.chatContainer}>
            <div style={styles.messagesContainer}>
              {loading ? (
                <div style={styles.loading}>Loading messages...</div>
              ) : (
                messages.map((msg) => {
                  const isSystem = msg.system;
                  const currentUserId = user?.id || user?._id;
                  const senderId = msg.sender?._id;
                  const isMe = !isSystem && currentUserId && senderId && currentUserId.toString() === senderId.toString();
                  
                  return (
                    <div key={msg._id} style={{
                      display: 'flex', flexDirection: 'column',
                      alignItems: isSystem ? 'center' : (isMe ? 'flex-end' : 'flex-start'),
                      marginBottom: '15px'
                    }}>
                      {isSystem ? (
                        <div style={styles.systemMessage}>{msg.content}</div>
                      ) : (
                        <div 
                          className="animate-in"
                          style={{
                            ...styles.message,
                            backgroundColor: isMe ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                            borderRadius: isMe ? '12px 12px 0 12px' : '12px 12px 12px 0',
                            border: isMe ? 'none' : '1px solid var(--glass-border)',
                            boxShadow: isMe ? 'var(--shadow-neon)' : 'none'
                          }}
                        >
                          {!isMe && <div style={styles.senderName}>{msg.sender?.username}</div>}
                          <div style={styles.messageContent}>{msg.content}</div>
                          <div style={styles.timestamp}>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Wrapper */}
            <form onSubmit={handleSendMessage} style={styles.inputForm}>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={`Message #${group.name}`}
                style={styles.input}
                className="glass-panel"
              />
            </form>
          </div>
        </div>

        {/* Right Panel - Video or Members */}
        {isInVoice ? (
          <div style={isFullScreenVideo ? styles.videoGridFullscreen : styles.rightVideoPanel} className="glass-panel">
            <div style={styles.videoPanelHeader}>
              <h3 style={styles.membersTitle}>LIVE FEED</h3>
              <button 
                onClick={() => setIsFullScreenVideo(!isFullScreenVideo)}
                style={styles.fullScreenBtn}
                title={isFullScreenVideo ? "Exit Full Screen" : "Full Screen"}
              >
                {isFullScreenVideo ? "↙️" : "↗️"}
              </button>
            </div>
            
            <div style={isFullScreenVideo ? styles.videoGridWrapperFull : styles.videoGridWrapper}>
                {/* Local User Tile */}
                <div style={styles.videoTile}>
                  {isCameraOn ? (
                    <video ref={el => { if (el) el.srcObject = localStream; }} autoPlay muted style={styles.videoContent} />
                  ) : (
                    <div style={styles.avatarPlaceholderSmall}>
                      <span style={styles.placeholderCharSmall}>{user.username[0].toUpperCase()}</span>
                    </div>
                  )}
                  <div style={styles.tileOverlay}>
                    <span style={styles.tileName}>You {isMuted ? '(Muted)' : ''}</span>
                  </div>
                  {isSharingScreen && <div style={styles.screenTag}>LIVE</div>}
                </div>

                {/* Local Screen Share */}
                {isSharingScreen && (
                  <div style={styles.videoTile}>
                    <video ref={el => { if (el) el.srcObject = localScreenStream; }} autoPlay muted style={styles.videoContent} />
                    <div style={styles.tileOverlay}>Your Screen</div>
                  </div>
                )}

                {/* Remote Users */}
                {voiceParticipants.filter(p => p._id !== (user.id || user._id)).map(participant => {
                  const hasCamera = !!remoteCameraStreams[participant._id];
                  const hasScreen = !!remoteScreenStreams[participant._id];
                  
                  return (
                    <React.Fragment key={participant._id}>
                      <div style={{
                        ...styles.videoTile,
                        border: remoteStreams[participant._id] ? '2px solid var(--accent-secondary)' : '1px solid var(--glass-border)'
                      }}>
                        {hasCamera ? (
                          <video ref={el => { if (el) el.srcObject = remoteCameraStreams[participant._id]; }} autoPlay style={styles.videoContent} />
                        ) : (
                          <div style={styles.avatarPlaceholderSmall}>
                            <span style={styles.placeholderCharSmall}>{participant.username[0].toUpperCase()}</span>
                          </div>
                        )}
                        <div style={styles.tileOverlay}>
                          <span style={styles.tileName}>{participant.username}</span>
                        </div>
                      </div>
                      
                      {hasScreen && (
                        <div style={styles.videoTile}>
                          <video ref={el => { if (el) el.srcObject = remoteScreenStreams[participant._id]; }} autoPlay style={styles.videoContent} />
                          <div style={styles.tileOverlay}>{participant.username}'s Screen</div>
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
            </div>
            <CallControls />
          </div>
        ) : (
          showMembers && (
            <div style={styles.membersSidebar}>
              <h3 style={styles.membersTitle}>MEMBERS — {allMembers.length}</h3>
              <div style={styles.membersList}>
                {allMembers.map((member) => (
                  <MemberListItem
                    key={member._id}
                    member={member}
                    group={group}
                    userRole={group.userRole}
                    currentUserId={user.id}
                    onUpdate={loadGroupDetails}
                    socket={socket}
                  />
                ))}
              </div>
            </div>
          )
        )}
      </div>

      {/* Hidden Audio pool */}
      <div style={{ display: 'none' }}>
        {Object.entries(remoteStreams).map(([userId, stream]) => (
          <audio 
            key={userId} 
            ref={el => { if (el) el.srcObject = stream; }} 
            autoPlay 
            muted={isDeafened}
          />
        ))}
      </div>

      {showInvite && <InviteModal group={group} onClose={() => setShowInvite(false)} />}
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '100%',
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-main)',
    position: 'relative',
    overflow: 'hidden'
  },
  contentWrapper: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
    width: '100%'
  },
  voiceSidebar: {
    width: '260px',
    backgroundColor: 'var(--bg-secondary)',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    borderRight: '1px solid var(--glass-border)',
    flexShrink: 0
  },
  mainArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'var(--bg-primary)',
    position: 'relative',
    minWidth: 0 // Prevent flex overflow
  },
  header: {
    padding: '0 20px',
    height: '60px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderBottom: '1px solid var(--glass-border)',
    flexShrink: 0
  },
  title: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#fff',
    margin: 0
  },
  headerActions: {
    display: 'flex',
    gap: '12px'
  },
  inviteBtn: {
    padding: '6px 12px',
    backgroundColor: 'var(--accent-primary)',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  rightVideoPanel: {
    width: '500px', // Increased to fill more of the right screen
    backgroundColor: 'var(--bg-secondary)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    borderLeft: '1px solid var(--glass-border)',
    position: 'relative',
    flexShrink: 0,
    zIndex: 10
  },
  videoGridFullscreen: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(10, 10, 12, 0.95)',
    backdropFilter: 'blur(20px)',
    zIndex: 9999,
    display: 'flex',
    flexDirection: 'column',
    padding: '40px'
  },
  videoPanelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: '16px'
  },
  fullScreenBtn: {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid var(--glass-border)',
    color: '#fff',
    borderRadius: '4px',
    padding: '4px 8px',
    cursor: 'pointer',
    fontSize: '14px',
    marginTop: '16px',
    transition: 'var(--transition-smooth)',
    '&:hover': {
      backgroundColor: 'rgba(255,255,255,0.1)'
    }
  },
  videoGridWrapper: {
    padding: '16px 16px 80px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    flex: 1,
    overflowY: 'auto'
  },
  videoGridWrapperFull: {
    padding: '40px',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '24px',
    flex: 1,
    overflowY: 'auto'
  },
  videoTile: {
    position: 'relative',
    backgroundColor: 'var(--bg-tertiary)',
    borderRadius: '16px',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'var(--transition-smooth)',
    border: '1px solid var(--glass-border)',
    aspectRatio: '16/9',
    width: '100%',
    boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
  },
  videoTileLarge: {
    position: 'relative',
    backgroundColor: '#000',
    borderRadius: '16px',
    overflow: 'hidden',
    border: '1px solid var(--glass-border)',
    boxShadow: 'var(--shadow-neon)',
    aspectRatio: '16/9',
    width: '100%'
  },
  videoContent: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  avatarPlaceholderSmall: {
    width: '50px',
    height: '50px',
    borderRadius: '50%',
    backgroundColor: 'var(--accent-primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 15px rgba(0,0,0,0.4)'
  },
  placeholderCharSmall: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#fff'
  },
  tileOverlay: {
    position: 'absolute',
    bottom: '12px',
    left: '12px',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: '4px 8px',
    borderRadius: '4px',
  },
  tileName: {
    fontSize: '13px',
    color: '#fff',
    fontWeight: '600'
  },
  screenTag: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    backgroundColor: 'var(--accent-danger)',
    color: '#fff',
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 'bold'
  },
  sidebarCategory: {
    marginTop: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  },
  categoryHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: '8px'
  },
  categoryLabel: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#949ba4',
    padding: '0 8px',
    letterSpacing: '0.5px'
  },
  categoryAction: {
    background: 'none',
    border: 'none',
    color: '#949ba4',
    fontSize: '18px',
    lineHeight: '1'
  },
  channelItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 8px',
    borderRadius: '4px',
    color: '#949ba4',
    transition: 'var(--transition-smooth)'
  },
  channelItemActive: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 8px',
    borderRadius: '8px',
    backgroundColor: 'rgba(125, 95, 255, 0.2)',
    color: 'var(--accent-secondary)',
    border: '1px solid rgba(125, 95, 255, 0.3)'
  },
  channelHash: {
    fontSize: '20px',
    color: 'var(--accent-primary)'
  },
  channelIcon: {
    fontSize: '14px',
    filter: 'drop-shadow(0 0 5px var(--accent-primary))'
  },
  channelName: {
    fontSize: '15px',
    fontWeight: '600'
  },
  voiceParticipants: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    paddingLeft: '32px',
    marginTop: '4px'
  },
  voiceUser: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '4px 8px',
    borderRadius: '4px',
    transition: 'var(--transition-smooth)'
  },
  voiceAvatarSmall: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    backgroundColor: 'var(--accent-primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '11px',
    color: '#fff',
    position: 'relative',
    boxShadow: '0 0 10px rgba(125, 95, 255, 0.4)'
  },
  talkingIndicator: {
    position: 'absolute',
    top: '-2px',
    left: '-2px',
    right: '-2px',
    bottom: '-2px',
    borderRadius: '50%',
    transition: 'var(--transition-smooth)',
  },
  voiceUsernameSmall: {
    fontSize: '14px',
    color: 'var(--text-main)',
    fontWeight: '500'
  },
  voiceStatusIcons: {
    marginLeft: 'auto',
    display: 'flex',
    gap: '4px'
  },
  miniIcon: {
    fontSize: '12px'
  },
  userPane: {
    position: 'absolute',
    bottom: '10px',
    left: '10px',
    right: '10px',
    height: '56px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: '0 12px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    borderRadius: '12px'
  },
  userPaneAvatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: 'var(--accent-primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    color: '#fff',
    position: 'relative',
    cursor: 'pointer',
    boxShadow: 'var(--shadow-neon)'
  },
  userPaneStatus: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    backgroundColor: 'var(--accent-secondary)',
    border: '2px solid var(--bg-secondary)',
    position: 'absolute',
    bottom: '-2px',
    right: '-2px',
    boxShadow: '0 0 8px var(--accent-secondary)'
  },
  userPaneInfo: {
    flex: 1,
    overflow: 'hidden'
  },
  userPaneName: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#fff',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  userPaneTag: {
    fontSize: '11px',
    color: '#b5bac1'
  },
  userPaneActions: {
    display: 'flex',
    gap: '0px'
  },
  paneBtn: {
    width: '32px',
    height: '32px',
    background: 'none',
    border: 'none',
    borderRadius: '4px',
    color: '#b5bac1',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    transition: 'var(--transition-smooth)',
    '&:hover': {
      backgroundColor: 'rgba(255,255,255,0.05)',
      color: '#dbdee1'
    }
  },
  chatContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },
  messagesContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column'
  },
  message: {
    padding: '10px 15px',
    borderRadius: '8px',
    maxWidth: '85%',
    position: 'relative'
  },
  senderName: {
    fontSize: '13px',
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: '4px'
  },
  messageContent: {
    fontSize: '15px',
    lineHeight: '1.4'
  },
  timestamp: {
    fontSize: '10px',
    opacity: 0.5,
    marginTop: '4px',
    textAlign: 'right'
  },
  systemMessage: {
    color: '#8e9297',
    fontSize: '12px',
    fontStyle: 'italic',
    padding: '4px 0'
  },
  inputForm: {
    padding: '0 16px 24px 16px'
  },
  input: {
    width: '100%',
    backgroundColor: '#40444b',
    border: 'none',
    borderRadius: '8px',
    padding: '10px 16px',
    color: '#dcddde',
    fontSize: '15px',
    outline: 'none'
  },
  membersSidebar: {
    width: '260px',
    backgroundColor: 'var(--bg-secondary)',
    display: 'flex',
    flexDirection: 'column',
    borderLeft: '1px solid var(--glass-border)',
    flexShrink: 0
  },
  membersTitle: {
    fontSize: '12px',
    fontWeight: 'bold',
    color: '#8e9297',
    padding: '24px 16px 8px 16px',
    margin: 0
  },
  membersList: {
    flex: 1,
    overflowY: 'auto'
  },
  loading: {
    fontSize: '14px',
    color: '#8e9297',
    textAlign: 'center',
    marginTop: '40px'
  }
};

export default GroupChat;
