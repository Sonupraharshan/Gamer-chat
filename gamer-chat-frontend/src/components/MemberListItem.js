import React, { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import * as groupApi from '../api/groupApi';

function MemberListItem({ member, group, userRole, currentUserId, onUpdate, socket }) {
  const [showActions, setShowActions] = useState(false);
  const [loading, setLoading] = useState(false);

  const isCurrentUser = member._id === currentUserId;
  const memberRole = getMemberRole(member, group);

  function getMemberRole(member, group) {
    if (group.admin._id === member._id) return 'admin';
    if (group.coAdmins?.some(ca => ca._id === member._id)) return 'co-admin';
    return 'member';
  }

  const canPromote = () => {
    if (isCurrentUser) return false;
    if (memberRole !== 'member') return false;
    return userRole === 'admin' || userRole === 'co-admin';
  };

  const canDemote = () => {
    if (isCurrentUser) return false;
    if (memberRole !== 'co-admin') return false;
    return userRole === 'admin';
  };

  const canKick = () => {
    if (isCurrentUser) return false;
    if (memberRole === 'admin') return false;
    if (userRole === 'admin') return true;
    if (userRole === 'co-admin' && memberRole === 'member') return true;
    return false;
  };

  const canTransferAdmin = () => {
    return userRole === 'admin' && !isCurrentUser;
  };

  const handleAction = async (action) => {
    setLoading(true);
    try {
      if (action === 'promote') {
        await groupApi.promoteMember(group._id, member._id);
        socket?.emit('role-changed', {
          groupId: group._id,
          userId: member._id,
          username: member.username,
          newRole: 'co-admin'
        });
      } else if (action === 'demote') {
        await groupApi.demoteMember(group._id, member._id);
        socket?.emit('role-changed', {
          groupId: group._id,
          userId: member._id,
          username: member.username,
          newRole: 'member'
        });
      } else if (action === 'kick') {
        await groupApi.kickMember(group._id, member._id);
        socket?.emit('member-kicked', {
          groupId: group._id,
          kickedUserId: member._id,
          kickedUsername: member.username
        });
      } else if (action === 'transfer') {
        if (window.confirm(`Transfer admin role to ${member.username}?`)) {
          await groupApi.transferAdmin(group._id, member._id);
          socket?.emit('role-changed', {
            groupId: group._id,
            userId: member._id,
            username: member.username,
            newRole: 'admin'
          });
        }
      }
      onUpdate();
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed');
    } finally {
      setLoading(false);
      setShowActions(false);
    }
  };

  const getRoleBadge = () => {
    const badges = {
      'admin': { text: '👑 Admin', color: '#dc3545' },
      'co-admin': { text: '⭐ Co-Admin', color: '#ffc107' },
      'member': { text: 'Member', color: '#6c757d' }
    };
    return badges[memberRole];
  };

  const badge = getRoleBadge();
  const hasActions = canPromote() || canDemote() || canKick() || canTransferAdmin();

  return (
    <div style={styles.memberItem}>
      <div style={styles.memberInfo}>
        <span style={styles.username}>
          {member.username}
          {isCurrentUser && <span style={styles.youTag}> (You)</span>}
        </span>
        <span
          style={{
            ...styles.roleBadge,
            backgroundColor: badge.color
          }}
        >
          {badge.text}
        </span>
      </div>

      {hasActions && !loading && (
        <div style={styles.actionsContainer}>
          <button
            onClick={() => setShowActions(!showActions)}
            style={styles.actionsBtn}
          >
            ⋮
          </button>
          
          {showActions && (
            <div style={styles.actionsMenu}>
              {canPromote() && (
                <button
                  onClick={() => handleAction('promote')}
                  style={styles.actionItem}
                >
                  Promote to Co-Admin
                </button>
              )}
              {canDemote() && (
                <button
                  onClick={() => handleAction('demote')}
                  style={styles.actionItem}
                >
                  Demote to Member
                </button>
              )}
              {canTransferAdmin() && (
                <button
                  onClick={() => handleAction('transfer')}
                  style={{...styles.actionItem, color: '#007bff'}}
                >
                  Transfer Admin
                </button>
              )}
              {canKick() && (
                <button
                  onClick={() => handleAction('kick')}
                  style={{...styles.actionItem, color: 'red'}}
                >
                  Kick Member
                </button>
              )}
            </div>
          )}
        </div>
      )}
      
      {loading && <span style={styles.loading}>...</span>}
    </div>
  );
}

const styles = {
  memberItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px',
    borderBottom: '1px solid #eee',
    position: 'relative'
  },
  memberInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flex: 1
  },
  username: {
    fontWeight: '500',
    fontSize: '14px'
  },
  youTag: {
    fontSize: '12px',
    color: '#666',
    fontWeight: 'normal'
  },
  roleBadge: {
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    color: '#fff',
    fontWeight: 'bold'
  },
  actionsContainer: {
    position: 'relative'
  },
  actionsBtn: {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    padding: '0 10px',
    color: '#666'
  },
  actionsMenu: {
    position: 'absolute',
    right: 0,
    top: '100%',
    backgroundColor: '#fff',
    border: '1px solid #ddd',
    borderRadius: '4px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    zIndex: 100,
    minWidth: '180px'
  },
  actionItem: {
    display: 'block',
    width: '100%',
    padding: '10px 15px',
    border: 'none',
    background: 'none',
    textAlign: 'left',
    cursor: 'pointer',
    fontSize: '13px',
    transition: 'background 0.2s'
  },
  loading: {
    fontSize: '12px',
    color: '#999'
  }
};

export default MemberListItem;
