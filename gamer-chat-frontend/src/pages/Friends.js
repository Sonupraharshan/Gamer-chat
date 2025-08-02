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
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* Sidebar */}
      <div style={{ width: '25%', borderRight: '1px solid #ccc', padding: '10px', position: 'relative' }}>
        <h3>Friends</h3>
        <div style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 150px)', marginBottom: '60px' }}>
          {friends.map((friend) => (
            <div
              key={friend._id}
              onClick={() => setSelectedFriendId(friend._id)}
              style={{
                padding: '8px',
                cursor: 'pointer',
                backgroundColor: friend._id === selectedFriendId ? '#eee' : 'transparent',
              }}
            >
              {friend.username}
            </div>
          ))}
        </div>

        {/* Fixed Buttons */}
        <div style={{ position: 'absolute', bottom: 10, left: 10, right: 10 }}>
          <button
            style={buttonStyle('#007bff')}
            onClick={() => setShowSearchModal(true)}
          >
            Send Request
          </button>
          <button
            style={buttonStyle('#28a745')}
            onClick={handleViewRequests}
          >
            View Requests
          </button>
        </div>
      </div>

      {/* Chat Panel */}
      <div style={{ width: '75%', padding: '10px' }}>
        {selectedFriendId ? (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div
              ref={chatBoxRef}
              style={{
                flex: 1,
                overflowY: 'auto',
                border: '1px solid #ccc',
                padding: '10px',
                backgroundColor: '#f9f9f9',
              }}
            >
              {messages.length === 0 ? (
                <p>No messages yet</p>
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
                        backgroundColor: msg.sender === currentUserId ? '#d1e7ff' : '#e0e0e0',
                        borderRadius: '8px',
                        maxWidth: '60%',
                        wordWrap: 'break-word',
                      }}
                    >
                      {msg.content}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div style={{ display: 'flex', marginTop: '10px' }}>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                style={{ flex: 1, padding: '10px' }}
              />
              <button onClick={handleSendMessage} style={{ padding: '10px 20px' }}>
                Send
              </button>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', marginTop: '40px', color: '#777' }}>
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
            style={{ width: '100%', padding: '10px', marginBottom: '10px' }}
          />
          <button onClick={handleSearch} style={{ ...buttonStyle('#007bff'), marginBottom: '10px' }}>
            Search
          </button>
          {searchResults.map((user) => (
            <div key={user._id} style={{ padding: '8px', borderBottom: '1px solid #ddd', cursor: 'pointer' }}
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
            <p>No incoming requests</p>
          ) : (
            requests.map((req) => (
              <div key={req._id} style={{ marginBottom: '10px' }}>
                <strong>{req.username}</strong>
                <button
                  onClick={() => handleAcceptRequest(req._id)}
                  style={{ ...buttonStyle('#28a745'), marginLeft: '10px' }}
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
  <div style={{
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 999
  }}>
    <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', width: '400px' }}>
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      <div>{children}</div>
      <button onClick={onClose} style={{ ...buttonStyle('#dc3545'), marginTop: '15px' }}>Close</button>
    </div>
  </div>
);

// Reusable button style
const buttonStyle = (bg) => ({
  width: '100%',
  padding: '10px',
  backgroundColor: bg,
  color: '#fff',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
});

export default Friends;
