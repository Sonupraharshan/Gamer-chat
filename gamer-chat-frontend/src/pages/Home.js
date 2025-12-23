import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import CreateGroupModal from '../components/CreateGroupModal';
import JoinGroupModal from '../components/JoinGroupModal';
import GroupList from '../components/GroupList';
import GroupChat from '../components/GroupChat';
import NotificationBell from '../components/NotificationBell';
import { SocketContext } from '../context/SocketContext';

function Home() {
  const { user, logout } = useContext(AuthContext);
  const { socket, gameActivityAlerts } = useContext(SocketContext);
  const navigate = useNavigate();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [gameStatus, setGameStatus] = useState('');

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

  const handleSetGameStatus = (e) => {
    if (e.key === 'Enter') {
      socket.emit('set-game-status', gameStatus);
    }
  };

  useEffect(() => {
    if (socket) {
      socket.on('game-channel-suggested', ({ groupId, gameName }) => {
        if (window.confirm(`Multiple people are playing ${gameName}! Join the game-specific lobby?`)) {
          handleJoinSuccess({ _id: groupId });
        }
      });

      return () => {
        socket.off('game-channel-suggested');
      };
    }
  }, [socket]);

  return (
    <div style={styles.container} className="animate-in">
      {/* Header */}
      <div style={styles.header} className="glass-panel">
        <h1 style={styles.title} className="glow-text">🎮 Gamer Chat </h1>
        
        {user && (
          <div style={styles.userSection}>
            <div style={styles.gameStatusSection}>
              <input 
                type="text" 
                placeholder="🎮 What are you playing?" 
                value={gameStatus}
                onChange={(e) => setGameStatus(e.target.value)}
                onKeyDown={handleSetGameStatus}
                style={styles.gameInput}
                className="glass-panel"
              />
            </div>
            <span style={styles.username}>👤 {user.username}</span>
            <NotificationBell />
            <button onClick={() => navigate('/friends')} style={styles.navBtn} className="premium-btn">
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

      {/* Live Activity Banners */}
      <div style={styles.activityAlerts}>
        {gameActivityAlerts.map((alert, idx) => (
          <div key={idx} style={styles.alertBanner} className="animate-in glass-panel">
            <span style={styles.alertIcon}>🔥</span>
            <div>
              <span style={styles.alertText}><b>{alert.username}</b> is playing <b>{alert.gameName}</b>!</span>
              <div style={styles.alertSubText}>Join the lobby to play together.</div>
            </div>
            <button 
              onClick={() => handleJoinSuccess({ _id: alert.groupId })}
              style={styles.alertJoinBtn}
            >
              Join Lobby
            </button>
          </div>
        ))}
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
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    width: '100vw',
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-main)',
    fontFamily: "'Inter', system-ui, sans-serif"
  },
  header: {
    height: '70px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 30px',
    background: 'linear-gradient(180deg, rgba(125, 95, 255, 0.1) 0%, transparent 100%)',
    zIndex: 10
  },
  title: {
    fontSize: '24px',
    fontWeight: '800',
    letterSpacing: '-0.5px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  ultraTag: {
    fontSize: '10px',
    background: 'var(--accent-secondary)',
    color: '#000',
    padding: '2px 6px',
    borderRadius: '4px',
    fontWeight: 'bold',
    verticalAlign: 'middle'
  },
  gameInput: {
    padding: '8px 16px',
    borderRadius: '20px',
    border: 'none',
    width: '250px',
    color: '#fff',
    fontSize: '13px',
    outline: 'none',
    transition: 'var(--transition-smooth)'
  },
  userSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px'
  },
  username: {
    fontWeight: '600',
    fontSize: '14px'
  },
  navBtn: {
    padding: '8px 16px',
    fontSize: '13px'
  },
  logoutBtn: {
    backgroundColor: 'transparent',
    color: 'var(--text-muted)',
    border: 'none',
    cursor: 'pointer',
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
  gameStatusSection: {
    marginRight: '15px'
  },
  gameInput: {
    backgroundColor: '#3d3a3aff',
    border: '1px solid #555',
    borderRadius: '4px',
    padding: '6px 10px',
    color: '#fff',
    fontSize: '12px',
    width: '200px'
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
    flexDirection: 'column',
    overflow: 'hidden',
    backgroundColor: 'var(--bg-primary)'
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
  },
  activityAlerts: {
    position: 'fixed',
    top: '80px',
    right: '30px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    zIndex: 1000,
    width: '320px'
  },
  alertBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    backgroundColor: 'rgba(125, 95, 255, 0.15)',
    border: '1px solid var(--accent-primary)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    color: '#fff'
  },
  alertIcon: {
    fontSize: '24px'
  },
  alertText: {
    fontSize: '13px',
    display: 'block'
  },
  alertSubText: {
    fontSize: '11px',
    opacity: 0.7
  },
  alertJoinBtn: {
    marginLeft: 'auto',
    backgroundColor: 'var(--accent-secondary)',
    color: '#000',
    border: 'none',
    padding: '4px 10px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 'bold',
    cursor: 'pointer'
  }
};

export default Home;

