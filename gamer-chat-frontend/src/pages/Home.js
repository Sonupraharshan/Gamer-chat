// src/pages/Home.js
import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import CreateGroupModal from '../components/CreateGroupModal';
import JoinGroupModal from '../components/JoinGroupModal';
import GroupList from '../components/GroupList';
import GroupChat from '../components/GroupChat';
import NotificationBell from '../components/NotificationBell';

function Home() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCreateSuccess = (newGroup) => {
    setRefreshKey((prev) => prev + 1);
    setSelectedGroup(newGroup);
  };

  const handleJoinSuccess = (joinedGroup) => {
    setRefreshKey((prev) => prev + 1);
    setSelectedGroup(joinedGroup);
  };

  const handleSelectGroup = (group) => {
    setSelectedGroup(group);
  };

  const handleLeaveGroup = () => {
    setSelectedGroup(null);
    setRefreshKey((prev) => prev + 1);
  };

  const handleGroupUpdate = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>🎮 Gamer Chat</h1>
        
        {user && (
          <div style={styles.userSection}>
            <span style={styles.username}>👤 {user.username}</span>
            <NotificationBell />
            <button onClick={() => navigate('/friends')} style={styles.navBtn}>
              Friends
            </button>
            <button
              onClick={() => {
                logout();
                navigate('/', { replace: true });
              }}
              style={styles.logoutBtn}
            >
              Logout
            </button>
          </div>
        )}
      </div>

      {user ? (
        <div style={styles.mainContent}>
          {/* Left Panel - Group List */}
          <div style={styles.leftPanel}>
            <div style={styles.actionButtons}>
              <button
                onClick={() => setShowCreateModal(true)}
                style={styles.createBtn}
              >
                ➕ Create Lobby
              </button>
              <button
                onClick={() => setShowJoinModal(true)}
                style={styles.joinBtn}
              >
                🔗 Join Lobby
              </button>
            </div>

            <GroupList
              onSelectGroup={handleSelectGroup}
              selectedGroup={selectedGroup}
              onRefresh={refreshKey}
            />
          </div>

          {/* Right Panel - Chat */}
          <div style={styles.rightPanel}>
            {selectedGroup ? (
              <GroupChat
                key={selectedGroup._id}
                group={selectedGroup}
                onLeave={handleLeaveGroup}
                onUpdate={handleGroupUpdate}
              />
            ) : (
              <div style={styles.placeholder}>
                <h2>Welcome to Gamer Chat! 🎮</h2>
                <p>Create or join a lobby to start chatting</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={styles.welcomeScreen}>
          <h2>Welcome to Gamer Chat!</h2>
          <p>Connect with fellow gamers and chat in real-time lobbies</p>
          <div style={styles.authButtons}>
            <button onClick={() => navigate('/register')} style={styles.registerBtn}>
              Register
            </button>
            <button onClick={() => navigate('/login')} style={styles.loginBtn}>
              Login
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreateGroupModal
          onClose={() => setShowCreateModal(false)}
          onCreateSuccess={handleCreateSuccess}
        />
      )}

      {showJoinModal && (
        <JoinGroupModal
          onClose={() => setShowJoinModal(false)}
          onJoinSuccess={handleJoinSuccess}
        />
      )}
    </div>
  );
}

const styles = {
  container: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#3d3a3aff'
  },
  header: {
    backgroundColor: '#020305ff',
    color: '#fff',
    padding: '15px 30px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  title: {
    margin: 0,
    fontSize: '24px'
  },
  userSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px'
  },
  username: {
    fontSize: '14px',
    fontWeight: '500'
  },
  navBtn: {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    backgroundColor: '#575050ff',
    color: '#fff',
    fontSize: '13px',
    fontWeight: '500'
  },
  logoutBtn: {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    backgroundColor: '#556158ff',
    color: '#fff',
    fontSize: '13px',
    fontWeight: '500'
  },
  mainContent: {
    flex: 1,
    display: 'flex',
    overflow: 'hidden'
  },
  leftPanel: {
    width: '340px',
    backgroundColor: '#272424ff',
    borderRight: '1px solid #555', // Darker border
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },
  actionButtons: {
    padding: '15px',
    display: 'flex',
    gap: '10px',
    borderBottom: '1px solid #555' // Darker border
  },
  createBtn: {
    flex: 1,
    padding: '12px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    backgroundColor: '#556158ff',
    color: '#fff',
    fontSize: '14px',
    fontWeight: '500'
  },
  joinBtn: {
    flex: 1,
    padding: '12px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    backgroundColor: '#556158ff',
    color: '#fff',
    fontSize: '14px',
    fontWeight: '500'
  },
  rightPanel: {
    flex: 1,
    display: 'flex',
    alignItems: 'stretch', // Stretches child vertically
    justifyContent: 'flex-start', // Aligns child to start (or center if you prefer)
    overflow: 'hidden',
    width: '100%',
    backgroundColor: '#3d3a3aff' // Ensure background matches
  },
  placeholder: {
    textAlign: 'center',
    color: '#666'
  },
  welcomeScreen: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: '40px'
  },
  authButtons: {
    display: 'flex',
    gap: '15px',
    marginTop: '30px'
  },
  registerBtn: {
    padding: '12px 30px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    backgroundColor: '#556158ff',
    color: '#fff',
    fontSize: '16px',
    fontWeight: '500'
  },
  loginBtn: {
    padding: '12px 30px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    backgroundColor: '#556158ff',
    color: '#fff',
    fontSize: '16px',
    fontWeight: '500'
  }
};

export default Home;

