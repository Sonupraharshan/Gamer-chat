import React, { useEffect, useState } from 'react';
import { getMyGroups } from '../api/groupApi';

function GroupList({ onSelectGroup, selectedGroup, onRefresh }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadGroups();
  }, [onRefresh]);

  const loadGroups = async () => {
    try {
      setLoading(true);
      const data = await getMyGroups();
      setGroups(data.groups);
      setError('');
    } catch (err) {
      setError('Failed to load groups');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (role) => {
    const badges = {
      'admin': { text: 'Admin', color: '#dc3545' },
      'co-admin': { text: 'Co-Admin', color: '#ffc107' },
      'member': { text: 'Member', color: '#6c757d' }
    };
    return badges[role] || badges.member;
  };

  if (loading) {
    return <div style={styles.container}>Loading groups...</div>;
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>{error}</div>
        <button onClick={loadGroups} style={styles.retryBtn}>Retry</button>
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div style={styles.container}>
        <p style={styles.emptyText}>No lobbies yet. Create one to get started!</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h3>My Lobbies</h3>
      <div style={styles.groupList}>
        {groups.map((group) => {
          const badge = getRoleBadge(group.userRole);
          const isSelected = selectedGroup?._id === group._id;
          
          return (
            <div
              key={group._id}
              style={{
                ...styles.groupCard,
                ...(isSelected ? styles.selectedCard : {})
              }}
              className="animate-in glass-panel glow-hover"
              onClick={() => onSelectGroup(group)}
            >
              <div style={styles.groupHeader}>
                <h4 style={styles.groupName}>{group.name}</h4>
                <span
                  style={{
                    ...styles.badge,
                    backgroundColor: badge.color
                  }}
                >
                  {badge.text}
                </span>
              </div>
              
              {group.description && (
                <p style={styles.groupDescription}>{group.description}</p>
              )}
              
              <div style={styles.groupFooter}>
                <span style={styles.memberCount}>
                  👥 {group.memberCount} {group.memberCount === 1 ? 'member' : 'members'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: '20px',
    overflowY: 'auto',
    height: '100%'
  },
  error: {
    color: '#ff6b6b',
    marginBottom: '10px'
  },
  retryBtn: {
    padding: '5px 15px',
    cursor: 'pointer',
    backgroundColor: '#556158ff',
    color: '#fff',
    border: 'none',
    borderRadius: '5px'
  },
  emptyText: {
    color: '#999',
    textAlign: 'center',
    fontSize: '14px'
  },
  groupList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginTop: '15px'
  },
  groupCard: {
    border: '1px solid var(--glass-border)',
    borderRadius: '12px',
    padding: '16px',
    cursor: 'pointer',
    transition: 'var(--transition-smooth)',
    backgroundColor: 'var(--bg-tertiary)'
  },
  selectedCard: {
    backgroundColor: 'rgba(125, 95, 255, 0.2)',
    border: '1px solid var(--accent-primary)',
    boxShadow: 'var(--shadow-neon)'
  },
  groupHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px'
  },
  groupName: {
    margin: 0,
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#fff'
  },
  badge: {
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    color: '#fff',
    fontWeight: 'bold'
  },
  groupDescription: {
    margin: '8px 0',
    fontSize: '13px',
    color: '#ccc',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  groupFooter: {
    fontSize: '12px',
    color: '#999',
    marginTop: '8px'
  },
  memberCount: {
    fontSize: '12px'
  }
};

export default GroupList;
