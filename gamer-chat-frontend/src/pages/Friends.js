import React, { useEffect, useState, useRef } from 'react';
import { jwtDecode } from 'jwt-decode';

const Friends = () => {
  const [friends, setFriends] = useState([]);
  const [selectedFriendId, setSelectedFriendId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const chatBoxRef = useRef(null);

  const token = localStorage.getItem('token');
  const currentUserId = token ? jwtDecode(token).id : null;

  // Fetch friends on mount
  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/user/friends', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        setFriends(data.friends || []);
      } catch (err) {
        console.error('Error fetching friends', err);
      }
    };
    fetchFriends();
  }, [token]);

  // Fetch messages when selectedFriendId changes
  const fetchMessages = async (friendId = selectedFriendId) => {
    if (!friendId) return;
    try {
      const res = await fetch(`http://localhost:5000/api/message/${friendId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      setMessages(data.chat || []);
    } catch (err) {
      console.error('Error fetching messages', err);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [selectedFriendId]);

  // Auto-refresh chat every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (selectedFriendId) fetchMessages();
    }, 5000);

    return () => clearInterval(interval);
  }, [selectedFriendId]);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages]);

  // Send message
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

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* Sidebar */}
      <div style={{ width: '25%', borderRight: '1px solid #ccc', padding: '10px', position: 'relative' }}>
        <h3>Friends</h3>
        <div style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 150px)', marginBottom: '60px' }}>
          {friends.map((friend) => (
            <div
              key={friend._id}
              onClick={() => {
                if (friend._id !== selectedFriendId) {
                  setSelectedFriendId(friend._id);
                }
              }}
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
            style={{
              width: '100%',
              padding: '10px',
              marginBottom: '10px',
              backgroundColor: '#007bff',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
            onClick={() => alert('Send Request clicked')}
          >
            Send Request
          </button>
          <button
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: '#28a745',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
            onClick={() => alert('View Requests clicked')}
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
    </div>
  );
};

export default Friends;
