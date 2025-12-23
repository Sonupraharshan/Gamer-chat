import React, { useState } from 'react';

function JoinGroupModal({ onClose, onJoinSuccess }) {
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!inviteCode.trim()) {
      setError('Invite code is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { joinGroup } = await import('../api/groupApi');
      const result = await joinGroup(inviteCode.toUpperCase());
      onJoinSuccess(result.group);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to join group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2>Join Lobby</h2>
        
        <form onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <label>Invite Code *</label>
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="Enter 8-character invite code"
              style={styles.input}
              maxLength={8}
              required
            />
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <div style={styles.buttons}>
            <button type="button" onClick={onClose} style={styles.cancelBtn}>
              Cancel
            </button>
            <button type="submit" disabled={loading} style={styles.joinBtn}>
              {loading ? 'Joining...' : 'Join Lobby'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modal: {
    backgroundColor: '#556158ff',
    padding: '30px',
    borderRadius: '10px',
    width: '90%',
    maxWidth: '400px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
  },
  formGroup: {
    marginBottom: '20px'
  },
  input: {
    width: '100%',
    padding: '10px',
    fontSize: '16px',
    border: '1px solid #ddd',
    borderRadius: '5px',
    marginTop: '5px',
    boxSizing: 'border-box',
    textTransform: 'uppercase',
    letterSpacing: '2px',
    fontFamily: 'monospace'
  },
  error: {
    color: 'red',
    marginBottom: '10px',
    fontSize: '14px'
  },
  buttons: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'flex-end'
  },
  cancelBtn: {
    padding: '10px 20px',
    border: '1px solid #ddd',
    borderRadius: '5px',
    cursor: 'pointer',
    backgroundColor: '#f5f5f5'
  },
  joinBtn: {
    padding: '10px 20px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    backgroundColor: '#28a745',
    color: '#fff'
  }
};

export default JoinGroupModal;
