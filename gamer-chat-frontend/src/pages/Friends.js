import React, { useEffect, useState, useRef } from 'react';
import { jwtDecode } from 'jwt-decode';

const Friends = () => {
  const [friends, setFriends] = useState([]);
  const [selectedFriendId, setSelectedFriendId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showRequestsModal, setShowRequestsModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [requests, setRequests] = useState([]);
  const chatBoxRef = useRef(null);

  const token = localStorage.getItem('token');
  const currentUserId = token ? jwtDecode(token).id : null;

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/user/friends', {
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

  const fetchMessages = async (friendId = selectedFriendId) => {
    if (!friendId) return;
    try {
      const res = await fetch(`http://localhost:5000/api/message/${friendId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setMessages(Array.isArray(data.chat) ? data.chat : []);
    } catch (err) {
      console.error('Error fetching messages', err);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [selectedFriendId]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (selectedFriendId) fetchMessages();
    }, 5000);
    return () => clearInterval(interval);
  }, [selectedFriendId]);

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedFriendId) return;
    try {
      const res = await fetch(`http://localhost:5000/api/message/${selectedFriendId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: newMessage }),
      });

      const result = await res.json();
      const sentMessage = {
        _id: result._id || Date.now().toString(),
        content: newMessage,
        sender: currentUserId,
        receiver: selectedFriendId,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, sentMessage]);
      setNewMessage('');
    } catch (err) {
      console.error('Error sending message', err);
    }
  };

  const handleSearch = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/user/search?username=${searchTerm}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setSearchResults(data.users || []);
    } catch (err) {
      console.error('Search failed', err);
    }
  };

  const handleSendRequest = async (username) => {
    try {
      const res = await fetch(`http://localhost:5000/api/user/request-by-username/${username}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      alert(data.message);
      setSearchResults([]);
      setSearchTerm('');
      setShowSearchModal(false);
    } catch (err) {
      console.error('Request failed', err);
    }
  };

  const handleViewRequests = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/user/requests', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setRequests(data.requests || []);
      setShowRequestsModal(true);
    } catch (err) {
      console.error('View requests failed', err);
    }
  };

  const handleAcceptRequest = async (senderId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/user/accept/${senderId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      alert(data.message);
      setRequests((prev) => prev.filter((r) => r._id !== senderId));
      window.location.reload();
    } catch (err) {
      console.error('Accept failed', err);
    }
  };

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <h3 style={styles.sidebarTitle}>Friends</h3>
        <div style={styles.friendsList}>
          {friends.map((friend) => (
            <div
              key={friend._id}
              onClick={() => setSelectedFriendId(friend._id)}
              style={{
                ...styles.friendItem,
                backgroundColor: friend._id === selectedFriendId ? '#575050ff' : 'transparent',
              }}
            >
              {friend.username}
            </div>
          ))}
        </div>

        {/* Fixed Buttons */}
        <div style={styles.sidebarButtons}>
          <button
            style={styles.sendRequestBtn}
            onClick={() => setShowSearchModal(true)}
          >
            Send Request
          </button>
          <button
            style={styles.viewRequestsBtn}
            onClick={handleViewRequests}
          >
            View Requests
          </button>
        </div>
      </div>

      {/* Chat Panel */}
      <div style={styles.chatPanel}>
        {selectedFriendId ? (
          <div style={styles.chatContainer}>
            <div ref={chatBoxRef} style={styles.messagesContainer}>
              {messages.length === 0 ? (
                <p style={styles.noMessages}>No messages yet</p>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg._id}
                    style={{
                      textAlign: msg.sender === currentUserId ? 'right' : 'left',
                      marginBottom: '8px',
                    }}
                  >
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '8px 12px',
                        backgroundColor: msg.sender === currentUserId ? '#556158ff' : '#575050ff',
                        borderRadius: '8px',
                        maxWidth: '60%',
                        wordWrap: 'break-word',
                        color: '#fff',
                      }}
                    >
                      {msg.content}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div style={styles.inputContainer}>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                style={styles.input}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <button onClick={handleSendMessage} style={styles.sendBtn}>
                Send
              </button>
            </div>
          </div>
        ) : (
          <div style={styles.placeholder}>
            👈 Select a friend to start chatting
          </div>
        )}
      </div>

      {/* Search Modal */}
      {showSearchModal && (
        <Modal onClose={() => setShowSearchModal(false)} title="Send Friend Request">
          <input
            type="text"
            placeholder="Enter username"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.modalInput}
          />
          <button onClick={handleSearch} style={styles.searchBtn}>
            Search
          </button>
          {searchResults.map((user) => (
            <div key={user._id} style={styles.searchResult}
              onClick={() => handleSendRequest(user.username)}>
              {user.username}
            </div>
          ))}
        </Modal>
      )}

      {/* Requests Modal */}
      {showRequestsModal && (
        <Modal onClose={() => setShowRequestsModal(false)} title="Friend Requests">
          {requests.length === 0 ? (
            <p style={{ color: '#ccc' }}>No incoming requests</p>
          ) : (
            requests.map((req) => (
              <div key={req._id} style={styles.requestItem}>
                <strong style={{ color: '#fff' }}>{req.username}</strong>
                <button
                  onClick={() => handleAcceptRequest(req._id)}
                  style={styles.acceptBtn}
                >
                  Accept
                </button>
              </div>
            ))
          )}
        </Modal>
      )}
    </div>
  );
};

// Reusable Modal Component
const Modal = ({ onClose, title, children }) => (
  <div style={styles.modalOverlay}>
    <div style={styles.modalContent}>
      <h3 style={styles.modalTitle}>{title}</h3>
      <div>{children}</div>
      <button onClick={onClose} style={styles.closeBtn}>Close</button>
    </div>
  </div>
);

const styles = {
  container: {
    display: 'flex',
    height: '100vh',
    backgroundColor: '#3d3a3aff'
  },
  sidebar: {
    width: '25%',
    borderRight: '1px solid #555',
    padding: '10px',
    position: 'relative',
    backgroundColor: '#272424ff',
    color: '#fff'
  },
  sidebarTitle: {
    color: '#fff',
    marginTop: 0
  },
  friendsList: {
    overflowY: 'auto',
    maxHeight: 'calc(100vh - 150px)',
    marginBottom: '60px'
  },
  friendItem: {
    padding: '12px',
    cursor: 'pointer',
    borderRadius: '5px',
    marginBottom: '5px',
    transition: 'background-color 0.2s',
    color: '#fff'
  },
  sidebarButtons: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10
  },
  sendRequestBtn: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#556158ff',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginBottom: '8px',
    fontSize: '14px'
  },
  viewRequestsBtn: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#556158ff',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  chatPanel: {
    width: '75%',
    padding: '10px',
    backgroundColor: '#3d3a3aff'
  },
  chatContainer: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%'
  },
  messagesContainer: {
    flex: 1,
    overflowY: 'auto',
    border: '1px solid #555',
    padding: '15px',
    backgroundColor: '#272424ff',
    borderRadius: '8px'
  },
  noMessages: {
    color: '#999',
    textAlign: 'center'
  },
  inputContainer: {
    display: 'flex',
    marginTop: '10px',
    gap: '10px'
  },
  input: {
    flex: 1,
    padding: '12px',
    backgroundColor: '#272424ff',
    border: '1px solid #555',
    borderRadius: '5px',
    color: '#fff',
    fontSize: '14px'
  },
  sendBtn: {
    padding: '12px 25px',
    backgroundColor: '#556158ff',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  placeholder: {
    textAlign: 'center',
    marginTop: '40px',
    color: '#999',
    fontSize: '18px'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999
  },
  modalContent: {
    backgroundColor: '#272424ff',
    padding: '25px',
    borderRadius: '10px',
    width: '400px',
    border: '1px solid #555'
  },
  modalTitle: {
    marginTop: 0,
    color: '#fff'
  },
  modalInput: {
    width: '100%',
    padding: '10px',
    marginBottom: '10px',
    backgroundColor: '#3d3a3aff',
    border: '1px solid #555',
    borderRadius: '5px',
    color: '#fff',
    boxSizing: 'border-box'
  },
  searchBtn: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#556158ff',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginBottom: '10px'
  },
  searchResult: {
    padding: '10px',
    borderBottom: '1px solid #555',
    cursor: 'pointer',
    color: '#fff',
    transition: 'background-color 0.2s'
  },
  requestItem: {
    marginBottom: '10px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  acceptBtn: {
    padding: '8px 15px',
    backgroundColor: '#556158ff',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  closeBtn: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#dc3545',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginTop: '15px'
  }
};

export default Friends;

