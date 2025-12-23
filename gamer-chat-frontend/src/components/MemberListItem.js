import React, { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import * as groupApi from '../api/groupApi';
import { VoiceContext } from '../context/VoiceContext';

function MemberListItem({ member, group, userRole, currentUserId, onUpdate, socket }) {
  const { 
    isInVoice, startWhisper, stopWhisper, remoteStreams, whisperTarget,
    isMuted, isCameraOn, isSharingScreen, remoteCameraStreams, remoteScreenStreams
  } = useContext(VoiceContext);
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
          <span style={{ 
            display: 'inline-block', 
            width: '10px', 
            height: '10px', 
            borderRadius: '50%', 
            marginRight: '12px',
            backgroundColor: member.status === 'online' ? 'var(--accent-secondary)' : 'var(--text-muted)',
            boxShadow: member.status === 'online' ? '0 0 10px var(--accent-secondary)' : 'none'
          }}></span>
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
        
        {/* Voice Status Indicators */}
        <div style={styles.voiceStatusContainer}>
          {(remoteStreams[member._id] || (isCurrentUser && isInVoice && !isMuted)) && (
            <span style={styles.voiceIndicator} title="Speaking">🎙️</span>
          )}
          {(isCurrentUser && isInVoice && isMuted) && (
            <span style={styles.voiceIndicator} title="Muted">🔇</span>
          )}
          {(remoteCameraStreams[member._id] || (isCurrentUser && isCameraOn)) && (
            <span style={styles.voiceIndicator} title="Video On">📹</span>
          )}
          {(remoteScreenStreams[member._id] || (isCurrentUser && isSharingScreen)) && (
            <span style={styles.voiceIndicator} title="Screen Sharing">🖥️</span>
          )}
        </div>
      </div>

      <div style={styles.rightActions}>
        {/* Whisper Button */}
        {isInVoice && !isCurrentUser && remoteStreams[member._id] && (
          <button
            onMouseDown={() => startWhisper(member._id)}
            onMouseUp={stopWhisper}
            onMouseLeave={stopWhisper}
            style={{
              ...styles.whisperBtn,
              backgroundColor: whisperTarget === member._id ? '#28a745' : '#6c757d'
            }}
            title="Press and hold to whisper"
          >
            🤫 Whisper
          </button>
        )}

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
    </div>
  );
}

const styles = {
  memberItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    borderBottom: '1px solid var(--glass-border)',
    position: 'relative',
    transition: 'var(--transition-smooth)',
    cursor: 'pointer',
    backgroundColor: 'rgba(255,255,255,0.01)'
  },
  memberInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flex: 1
  },
  username: {
    fontWeight: '600',
    fontSize: '14px',
    color: 'var(--text-main)',
    display: 'flex',
    alignItems: 'center'
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
    fontWeight: 'bold',
    whiteSpace: 'nowrap'
  },
  voiceStatusContainer: {
    display: 'flex',
    gap: '5px',
    marginLeft: '5px'
  },
  voiceIndicator: {
    fontSize: '12px',
    cursor: 'help'
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
    backgroundColor: 'var(--bg-tertiary)',
    backdropFilter: 'blur(10px)',
    border: '1px solid var(--glass-border)',
    borderRadius: '8px',
    boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
    zIndex: 100,
    minWidth: '200px',
    overflow: 'hidden'
  },
  actionItem: {
    display: 'block',
    width: '100%',
    padding: '12px 16px',
    border: 'none',
    background: 'none',
    textAlign: 'left',
    cursor: 'pointer',
    fontSize: '13px',
    color: 'var(--text-main)',
    transition: 'var(--transition-smooth)'
  },
  loading: {
    fontSize: '12px',
    color: '#999'
  },
  voiceIndicator: {
    fontSize: '12px',
    marginLeft: '5px'
  },
  rightActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  whisperBtn: {
    padding: '4px 8px',
    border: 'none',
    borderRadius: '4px',
    color: '#fff',
    fontSize: '11px',
    cursor: 'pointer',
    transition: 'background 0.2s',
    whiteSpace: 'nowrap'
  }
};

export default MemberListItem;
