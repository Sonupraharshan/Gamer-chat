import React, { useEffect, useState, useRef, useContext } from 'react';
import { API_URL } from '../config';
import { AuthContext } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';
import { VoiceContext } from '../context/VoiceContext';

const Friends = () => {
  const [friends, setFriends] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showRequestsModal, setShowRequestsModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [requests, setRequests] = useState([]);
  
  const { user } = useContext(AuthContext);
  const { socket } = useContext(SocketContext);
  const { 
    initiatePrivateCall, acceptPrivateCall, declinePrivateCall, 
    endPrivateCall, privateCall, remoteStreams 
  } = useContext(VoiceContext);
  
  const chatBoxRef = useRef(null);
  const token = user?.token;
  const currentUserId = user?._id;

  useEffect(() => {
    const fetchFriends = async () => {
      if (!token) return;
      try {
        const res = await fetch(`${API_URL}/api/user/friends`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setFriends(data.friends || []);
      } catch (err) {
        console.error('Error fetching friends', err);
      }
    };
    fetchFriends();
  }, [token]);

  useEffect(() => {
    if (!socket) return;
    
    socket.on('friend-status-changed', (data) => {
      const { userId, status, gameStatus } = data;
      setFriends(prev => prev.map(f => 
        f._id === userId ? { ...f, status, gameStatus } : f
      ));
    });

    socket.on('private-message', (msg) => {
      if (!selectedFriend) return;
      
      const isFromSelected = msg.sender === selectedFriend._id || (msg.sender?._id === selectedFriend._id);
      const isToSelected = msg.receiver === selectedFriend._id || (msg.receiver?._id === selectedFriend._id);
      
      if (isFromSelected || isToSelected) {
        setMessages(prev => {
          if (prev.some(m => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
      }
    });

    return () => {
      socket.off('friend-status-changed');
      socket.off('private-message');
    };
  }, [socket, selectedFriend]);

  const fetchMessages = async (friendId) => {
    if (!friendId || !token) return;
    try {
      const res = await fetch(`${API_URL}/api/message/${friendId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setMessages(Array.isArray(data.chat) ? data.chat : []);
    } catch (err) {
      console.error('Error fetching messages', err);
    }
  };

  useEffect(() => {
    if (selectedFriend) {
      fetchMessages(selectedFriend._id);
    }
  }, [selectedFriend]);

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedFriend || !token) return;
    try {
      const res = await fetch(`${API_URL}/api/message/${selectedFriend._id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: newMessage }),
      });

      const result = await res.json();
      const sentMessage = result.data;

      setMessages((prev) => {
        if (prev.some(m => m._id === sentMessage._id)) return prev;
        return [...prev, sentMessage];
      });
      setNewMessage('');
    } catch (err) {
      console.error('Error sending message', err);
    }
  };

  const handleSearch = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/user/search?username=${searchTerm}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setSearchResults(data.users || []);
    } catch (err) {
      console.error('Search failed', err);
    }
  };

  const handleSendRequest = async (username) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/user/request-by-username/${encodeURIComponent(username)}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      alert(data.message);
      setShowSearchModal(false);
      setSearchTerm('');
      setSearchResults([]);
    } catch (err) {
      console.error('Request failed', err);
      alert('Failed to send request');
    }
  };

  const handleViewRequests = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/user/requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setRequests(data.requests || []);
      setShowRequestsModal(true);
    } catch (err) {
      console.error('Failed to view requests', err);
    }
  };

  const handleAcceptRequest = async (senderId) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/user/accept/${senderId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      alert(data.message);
      setShowRequestsModal(false);
      // Refresh friends
      const fres = await fetch(`${API_URL}/api/user/friends`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const fdata = await fres.json();
      setFriends(fdata.friends || []);
    } catch (err) {
      console.error('Failed to accept request', err);
    }
  };

  return (
    <div style={styles.container} className="animate-in">
      {/* Sidebar: Friend List */}
      <div style={styles.sidebar} className="glass-panel">
        <div style={styles.sidebarHeader}>
          <h3>Direct Messages</h3>
          <button onClick={() => setShowSearchModal(true)} style={styles.addBtn}>+</button>
        </div>
        <div style={styles.friendsList}>
          {friends.map(friend => (
            <div 
              key={friend._id} 
              onClick={() => setSelectedFriend(friend)}
              style={{
                ...styles.friendItem,
                backgroundColor: selectedFriend?._id === friend._id ? '#3f4147' : 'transparent'
              }}
            >
              <div style={styles.avatarContainer}>
                <div style={styles.avatar}>{friend.username[0].toUpperCase()}</div>
                <div style={{
                  ...styles.statusDot,
                  backgroundColor: friend.status === 'online' ? '#23a559' : '#80848e'
                }} />
              </div>
              <div style={styles.friendInfo}>
                <div style={styles.friendName}>{friend.username}</div>
                <div style={styles.friendStatus}>
                  {friend.gameStatus ? `Playing ${friend.gameStatus}` : (friend.status || 'offline')}
                </div>
              </div>
            </div>
          ))}
          {friends.length === 0 && <p style={{ textAlign: 'center', opacity: 0.5, marginTop: '20px' }}>No friends yet</p>}
        </div>
        <div style={styles.sidebarFooter}>
          <button onClick={handleViewRequests} style={styles.footerBtn}>
            Pending Requests ({requests.length})
          </button>
        </div>
      </div>

      {/* Main Container: Chat or Empty State */}
      <div style={styles.mainContent} className="glass-panel">
        {selectedFriend ? (
          <>
            <div style={styles.chatHeader}>
              <div style={styles.headerLeft}>
                <span style={styles.headerUsername}>@ {selectedFriend.username}</span>
                <span style={styles.headerStatus}>
                   {selectedFriend.status === 'online' ? '● Online' : '○ Offline'}
                </span>
              </div>
              <div style={styles.headerActions}>
                <button onClick={() => initiatePrivateCall(selectedFriend, false)} title="Voice Call" style={styles.iconBtn}>📞</button>
                <button onClick={() => initiatePrivateCall(selectedFriend, true)} title="Video Call" style={styles.iconBtn}>📹</button>
              </div>
            </div>

            <div style={styles.messagesArea} ref={chatBoxRef}>
              {messages.length === 0 && <p style={{ textAlign: 'center', opacity: 0.5 }}>This is the beginning of your legendary conversation with {selectedFriend.username}.</p>}
              {messages.map((msg, idx) => (
                <div key={idx} style={styles.messageRow} className="animate-in">
                  <div style={styles.msgAvatar}>
                    {(msg.sender === currentUserId ? user.username : selectedFriend.username)[0].toUpperCase()}
                  </div>
                  <div style={styles.msgContent}>
                    <div style={styles.msgHeader}>
                      <span style={styles.msgUsername}>
                        {msg.sender === currentUserId ? user.username : selectedFriend.username}
                      </span>
                      <span style={styles.msgTime}>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div style={styles.msgText}>{msg.content}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={styles.inputArea}>
              <input 
                type="text" 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder={`Message @${selectedFriend.username}`}
                style={styles.messageInput}
              />
            </div>
          </>
        ) : (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>💬</div>
            <h2>Select a friend to start chatting</h2>
            <p>Or add new friends to grow your circle!</p>
          </div>
        )}
      </div>

      {/* Modals */}
      {showSearchModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h2>Add Friend</h2>
            <input 
              type="text" 
              placeholder="Enter username" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={styles.modalInput}
            />
            <button onClick={handleSearch} style={styles.primaryBtn}>Search</button>
            <div style={styles.searchResults}>
              {searchResults.map(u => (
                <div key={u._id} style={styles.searchItem}>
                  <span>{u.username}</span>
                  <button onClick={() => handleSendRequest(u.username)} style={styles.addReqBtn}>Send Request</button>
                </div>
              ))}
            </div>
            <button onClick={() => setShowSearchModal(false)} style={styles.closeBtn}>Close</button>
          </div>
        </div>
      )}

      {showRequestsModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h2>Requests</h2>
            {requests.map(req => (
              <div key={req._id} style={styles.requestItem}>
                <span>{req.username}</span>
                <button onClick={() => handleAcceptRequest(req._id)} style={styles.acceptCallBtn}>Accept</button>
              </div>
            ))}
            {requests.length === 0 && <p style={{ textAlign: 'center', opacity: 0.5 }}>No pending requests</p>}
            <button onClick={() => setShowRequestsModal(false)} style={styles.closeBtn}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    height: '100vh',
    width: '100vw',
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-main)',
    fontFamily: '"Inter", sans-serif',
    overflow: 'hidden'
  },
  sidebar: {
    width: '320px',
    backgroundColor: 'var(--bg-secondary)',
    display: 'flex',
    flexDirection: 'column',
    borderRight: '1px solid var(--glass-border)',
    backdropFilter: 'blur(20px)'
  },
  sidebarHeader: {
    padding: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #1e1f22'
  },
  addBtn: {
    background: 'none',
    border: 'none',
    color: '#fff',
    fontSize: '24px',
    cursor: 'pointer'
  },
  friendsList: {
    flex: 1,
    overflowY: 'auto',
    padding: '10px'
  },
  friendItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px',
    borderRadius: '8px',
    cursor: 'pointer',
    marginBottom: '4px',
    transition: 'background 0.2s'
  },
  avatarContainer: {
    position: 'relative',
    marginRight: '12px'
  },
  avatar: {
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    backgroundColor: 'var(--bg-tertiary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontWeight: '800',
    border: '1px solid var(--glass-border)',
    fontSize: '18px',
    boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
  },
  statusDot: {
    position: 'absolute',
    bottom: '-2px',
    right: '-2px',
    width: '14px',
    height: '14px',
    borderRadius: '50%',
    border: '3px solid var(--bg-secondary)',
    boxShadow: '0 0 10px rgba(0,0,0,0.5)'
  },
  friendInfo: {
    flex: 1
  },
  friendName: {
    fontSize: '15px',
    fontWeight: '500',
    color: '#fff'
  },
  friendStatus: {
    fontSize: '12px',
    color: '#949ba4'
  },
  sidebarFooter: {
    padding: '15px',
    borderTop: '1px solid #1e1f22'
  },
  footerBtn: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#3f4147',
    border: 'none',
    borderRadius: '4px',
    color: '#fff',
    cursor: 'pointer'
  },
  mainContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column'
  },
  chatHeader: {
    height: '70px',
    padding: '0 30px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid var(--glass-border)',
    backgroundColor: 'var(--bg-secondary)',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px'
  },
  headerUsername: {
    fontSize: '18px',
    fontWeight: '800',
    color: '#fff',
    letterSpacing: '-0.5px'
  },
  headerStatus: {
    fontSize: '12px',
    color: 'var(--accent-secondary)',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '1px'
  },
  headerActions: {
    display: 'flex',
    gap: '15px'
  },
  iconBtn: {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    opacity: 0.7,
    transition: 'opacity 0.2s'
  },
  messagesArea: {
    flex: 1,
    overflowY: 'auto',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  },
  messageRow: {
    display: 'flex',
    gap: '16px',
    '&:hover': {
      backgroundColor: '#2e3035'
    }
  },
  msgAvatar: {
    width: '42px',
    height: '42px',
    borderRadius: '10px',
    backgroundColor: 'var(--accent-primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    flexShrink: 0,
    fontWeight: 'bold',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
  },
  msgContent: {
    flex: 1,
    padding: '12px 16px',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: '0 12px 12px 12px',
    border: '1px solid var(--glass-border)'
  },
  msgHeader: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '8px',
    marginBottom: '4px'
  },
  msgUsername: {
    color: '#fff',
    fontWeight: '600',
    fontSize: '15px'
  },
  msgTime: {
    fontSize: '12px',
    color: '#949ba4'
  },
  msgText: {
    color: '#dbdee1',
    lineHeight: '1.4',
    wordBreak: 'break-word'
  },
  inputArea: {
    padding: '0 20px 24px 20px'
  },
  messageInput: {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#383a40',
    color: '#dbdee1',
    fontSize: '15px',
    outline: 'none',
    boxSizing: 'border-box'
  },
  emptyState: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#949ba4'
  },
  emptyIcon: {
    fontSize: '80px',
    marginBottom: '24px',
    opacity: 0.2
  },
  callOverlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.9)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 3000
  },
  callCard: {
    backgroundColor: '#1e1f22',
    padding: '48px',
    borderRadius: '24px',
    textAlign: 'center',
    width: '400px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
  },
  callAvatar: {
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    backgroundColor: '#556158ff',
    margin: '0 auto 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '48px',
    color: '#fff'
  },
  callButtons: {
    display: 'flex',
    gap: '24px',
    justifyContent: 'center',
    marginTop: '40px'
  },
  acceptCallBtn: {
    padding: '12px 32px',
    backgroundColor: '#23a559',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600'
  },
  declineCallBtn: {
    padding: '12px 32px',
    backgroundColor: '#da373c',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 4000
  },
  modal: {
    backgroundColor: '#313338',
    padding: '32px',
    borderRadius: '16px',
    width: '440px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
  },
  modalInput: {
    width: '100%',
    padding: '12px',
    margin: '20px 0',
    backgroundColor: '#1e1f22',
    border: 'none',
    borderRadius: '4px',
    color: '#fff',
    fontSize: '16px'
  },
  primaryBtn: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#5865f2',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '15px'
  },
  closeBtn: {
    marginTop: '16px',
    background: 'none',
    border: 'none',
    color: '#b5bac1',
    cursor: 'pointer',
    width: '100%',
    textAlign: 'center'
  },
  searchItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px',
    borderBottom: '1px solid #3f4147'
  },
  addReqBtn: {
    padding: '6px 12px',
    backgroundColor: '#23a559',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  requestItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    backgroundColor: '#2b2d31',
    padding: '12px',
    borderRadius: '8px'
  },
  remoteVideoContainer: {
    marginTop: '24px',
    backgroundColor: '#000',
    borderRadius: '12px',
    overflow: 'hidden',
    aspectRatio: '16/9'
  },
  remoteVideo: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  }
};

export default Friends;
