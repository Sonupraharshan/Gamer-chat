import React, { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { API_URL } from '../config';

function NotificationBell({ onNavigateToFriends }) {
  const { user } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  // Fetch notifications on mount and periodically
  useEffect(() => {
    fetchNotificationCount();
    const interval = setInterval(fetchNotificationCount, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotificationCount = async () => {
    try {
      const currentToken = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/user/notifications/count`, {
        headers: { Authorization: `Bearer ${currentToken}` }
      });
      const data = await res.json();
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.error('Failed to fetch notification count:', err);
    }
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const currentToken = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/user/notifications`, {
        headers: { Authorization: `Bearer ${currentToken}` }
      });
      const data = await res.json();
      setNotifications(data.notifications || []);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBellClick = () => {
    if (!showDropdown) {
      fetchNotifications();
    }
    setShowDropdown(!showDropdown);
  };

  const handleAcceptRequest = async (senderId) => {
    try {
      const currentToken = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/user/accept/${senderId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${currentToken}` }
      });
      const data = await res.json();
      
      if (res.ok) {
        // Remove from notifications
        setNotifications(prev => prev.filter(n => !n._id.includes(senderId)));
        setUnreadCount(prev => Math.max(0, prev - 1));
        alert(data.message);
      } else {
        alert(data.message || 'Failed to accept request');
      }
    } catch (err) {
      console.error('Accept request failed:', err);
      alert('Failed to accept request');
    }
  };

  return (
    <div style={styles.container} ref={dropdownRef}>
      <button onClick={handleBellClick} style={styles.bellButton}>
        🔔
        {unreadCount > 0 && (
          <span style={styles.badge}>{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {showDropdown && (
        <div style={styles.dropdown}>
          <div style={styles.dropdownHeader}>
            <strong>Notifications</strong>
          </div>
          
          <div style={styles.dropdownContent}>
            {loading ? (
              <div style={styles.loading}>Loading...</div>
            ) : notifications.length === 0 ? (
              <div style={styles.empty}>No notifications</div>
            ) : (
              notifications.map((notification) => (
                <div key={notification._id} style={styles.notificationItem}>
                  <div style={styles.notificationText}>
                    {notification.message}
                  </div>
                  {notification.type === 'friend_request' && (
                    <button
                      onClick={() => handleAcceptRequest(notification.sender._id)}
                      style={styles.acceptBtn}
                    >
                      Accept
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    position: 'relative',
    display: 'inline-block'
  },
  bellButton: {
    background: 'transparent',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    padding: '8px',
    position: 'relative'
  },
  badge: {
    position: 'absolute',
    top: '2px',
    right: '2px',
    backgroundColor: '#dc3545',
    color: '#fff',
    borderRadius: '50%',
    width: '18px',
    height: '18px',
    fontSize: '11px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold'
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    right: 0,
    width: '300px',
    backgroundColor: '#272424ff',
    border: '1px solid #555',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
    zIndex: 1000,
    marginTop: '8px'
  },
  dropdownHeader: {
    padding: '12px 15px',
    borderBottom: '1px solid #555',
    color: '#fff',
    fontSize: '14px'
  },
  dropdownContent: {
    maxHeight: '300px',
    overflowY: 'auto'
  },
  loading: {
    padding: '20px',
    textAlign: 'center',
    color: '#999'
  },
  empty: {
    padding: '20px',
    textAlign: 'center',
    color: '#999',
    fontSize: '13px'
  },
  notificationItem: {
    padding: '12px 15px',
    borderBottom: '1px solid #444',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '10px'
  },
  notificationText: {
    color: '#fff',
    fontSize: '13px',
    flex: 1
  },
  acceptBtn: {
    padding: '6px 12px',
    backgroundColor: '#556158ff',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
    whiteSpace: 'nowrap'
  }
};

export default NotificationBell;
