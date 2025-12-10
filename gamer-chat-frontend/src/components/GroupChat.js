import React, { useContext, useEffect, useState, useRef } from 'react';
import { SocketContext } from '../context/SocketContext';
import { AuthContext } from '../context/AuthContext';
import { getGroupDetails, getMessages, leaveGroup } from '../api/groupApi';
import MemberListItem from './MemberListItem';
import InviteModal from './InviteModal';

function GroupChat({ group: initialGroup, onLeave, onUpdate }) {
  const { socket, connected } = useContext(SocketContext);
  const { user } = useContext(AuthContext);
  const [group, setGroup] = useState(initialGroup);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [showMembers, setShowMembers] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
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

      return () => {
        socket.emit('leave-group', group._id);
        socket.off('group-message', handleIncomingMessage);
        socket.off('member-joined', handleMemberJoined);
        socket.off('member-left', handleMemberLeft);
        socket.off('member-kicked-notification', handleMemberKicked);
        socket.off('role-changed-notification', handleRoleChanged);
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
    setMessages((prev) => [
      ...prev,
      {
        _id: `system-${Date.now()}-${Math.random()}`,
        system: true,
        content: `${username} joined the lobby`,
        createdAt: new Date()
      }
    ]);
    loadGroupDetails();
  };

  const handleMemberLeft = ({ username }) => {
    setMessages((prev) => [
      ...prev,
      {
        _id: `system-${Date.now()}-${Math.random()}`,
        system: true,
        content: `${username} left the lobby`,
        createdAt: new Date()
      }
    ]);
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
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div>
            <h2 style={styles.title}>{group.name}</h2>
            <p style={styles.subtitle}>
              {allMembers.length} {allMembers.length === 1 ? 'member' : 'members'}
            </p>
          </div>
          {/* Connection Status Indicator */}
          <div 
            title={connected ? "Connected" : "Disconnected"}
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: connected ? '#28a745' : '#dc3545',
              boxShadow: `0 0 5px ${connected ? '#28a745' : '#dc3545'}`
            }}
          />
        </div>
        <div style={styles.headerActions}>
          <button onClick={() => setShowInvite(true)} style={styles.inviteBtn}>
            📨 Invite
          </button>
          <button onClick={handleLeaveGroup} style={styles.leaveBtn}>
            🚪 Leave
          </button>
          <button
            onClick={() => setShowMembers(!showMembers)}
            style={styles.toggleBtn}
          >
            {showMembers ? '👥 Hide' : '👥 Show'} Members
          </button>
        </div>
      </div>

      <div style={styles.mainContent}>
        {/* Chat Area */}
        <div style={styles.chatArea}>
          <div style={styles.messagesContainer}>
            {loading ? (
              <div style={styles.loading}>Loading messages...</div>
            ) : (
              messages.map((msg) => {
                const isSystem = msg.system;
                // Compare IDs properly - user might have 'id' or '_id', sender has '_id'
                const currentUserId = user?.id || user?._id;
                const senderId = msg.sender?._id;
                const isMe = !isSystem && currentUserId && senderId && 
                             currentUserId.toString() === senderId.toString();
                
                return (
                  <div
                    key={msg._id}
                    style={{
                      display: 'flex',
                      justifyContent: isSystem ? 'center' : (isMe ? 'flex-end' : 'flex-start'),
                      marginBottom: '10px',
                      width: '100%'
                    }}
                  >
                    {isSystem ? (
                      <div style={styles.systemMessage}>{msg.content}</div>
                    ) : (
                      <div
                        style={{
                          ...styles.message,
                          backgroundColor: isMe ? '#556158ff' : '#575050ff', // Green for me, gray for others
                          color: '#fff',
                          textAlign: isMe ? 'right' : 'left'
                        }}
                      >
                        {!isMe && (
                          <div style={styles.messageHeader}>
                            <strong style={{ color: '#ccc' }}>
                              {msg.sender?.username}
                            </strong>
                          </div>
                        )}
                        <div style={styles.messageContent}>{msg.content}</div>
                        <span style={{ ...styles.timestamp, display: 'block', marginTop: '4px' }}>
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <form onSubmit={handleSendMessage} style={styles.inputForm}>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              style={styles.input}
              maxLength={2000}
            />
            <button type="submit" style={styles.sendBtn} disabled={!newMessage.trim()}>
              Send
            </button>
          </form>
        </div>

        {/* Members Sidebar */}
        {showMembers && (
          <div style={styles.membersSidebar}>
            <h3 style={styles.membersTitle}>Members</h3>
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
        )}
      </div>

      {/* Invite Modal */}
      {showInvite && (
        <InviteModal group={group} onClose={() => setShowInvite(false)} />
      )}
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '100%', // Fill the right panel width
    flex: 1, // Take all available flex space
    backgroundColor: '#3d3a3aff',
    color: '#fff'
  },
  header: {
    padding: '15px 20px',
    backgroundColor: '#272424ff', // Darker header
    color: '#fff',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #555'
  },
  // ... rest of styles ...
  title: {
    margin: 0,
    fontSize: '20px'
  },
  subtitle: {
    margin: '5px 0 0 0',
    fontSize: '12px',
    opacity: 0.7,
    color: '#ccc'
  },
  headerActions: {
    display: 'flex',
    gap: '10px'
  },
  inviteBtn: {
    padding: '8px 15px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    backgroundColor: '#556158ff',
    color: '#fff',
    fontSize: '13px'
  },
  leaveBtn: {
    padding: '8px 15px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    backgroundColor: '#dc3545',
    color: '#fff',
    fontSize: '13px'
  },
  toggleBtn: {
    padding: '8px 15px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    backgroundColor: '#6c757d',
    color: '#fff',
    fontSize: '13px'
  },
  mainContent: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden'
  },
  chatArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#3d3a3aff'
  },
  messagesContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: '20px',
    backgroundColor: '#3d3a3aff' // Match main background
  },
  loading: {
    textAlign: 'center',
    color: '#ccc',
    padding: '40px'
  },
  messageWrapper: {
    display: 'flex',
    flexDirection: 'column',
    marginBottom: '10px',
    width: '100%'
  },
  message: {
    padding: '10px 15px',
    borderRadius: '8px',
    maxWidth: '70%',
    width: 'fit-content',
    boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
  },
  systemMessage: {
    textAlign: 'center',
    color: '#999',
    fontSize: '12px',
    fontStyle: 'italic',
    margin: '10px 0',
    width: '100%'
  },
  messageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '5px',
    fontSize: '12px',
    gap: '10px'
  },
  timestamp: {
    fontSize: '11px',
    color: 'rgba(255,255,255,0.6)'
  },
  messageContent: {
    fontSize: '14px',
    wordWrap: 'break-word',
    lineHeight: '1.4'
  },
  inputForm: {
    display: 'flex',
    padding: '20px',
    borderTop: '1px solid #555',
    backgroundColor: '#272424ff'
  },
  input: {
    flex: 1,
    padding: '12px',
    border: '1px solid #555',
    borderRadius: '5px',
    fontSize: '14px',
    marginRight: '10px',
    backgroundColor: '#3d3a3aff',
    color: '#fff'
  },
  sendBtn: {
    padding: '10px 25px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    backgroundColor: '#556158ff',
    color: '#fff',
    fontSize: '14px',
    fontWeight: '500'
  },
  membersSidebar: {
    width: '280px',
    borderLeft: '1px solid #555',
    backgroundColor: '#272424ff',
    display: 'flex',
    flexDirection: 'column'
  },
  membersTitle: {
    padding: '15px',
    margin: 0,
    borderBottom: '1px solid #555',
    fontSize: '16px',
    color: '#fff'
  },
  membersList: {
    flex: 1,
    overflowY: 'auto'
  }
};

export default GroupChat;
