import React, { useState } from 'react';

function CreateGroupModal({ onClose, onCreateSuccess }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Group name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { createGroup } = await import('../api/groupApi');
      const result = await createGroup(name, description);
      onCreateSuccess(result.group);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2>Create New Lobby</h2>
        
        <form onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <label>Lobby Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter lobby name"
              style={styles.input}
              maxLength={100}
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label>Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter lobby description"
              style={styles.textarea}
              maxLength={500}
            />
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <div style={styles.buttons}>
            <button type="button" onClick={onClose} style={styles.cancelBtn}>
              Cancel
            </button>
            <button type="submit" disabled={loading} style={styles.createBtn}>
              {loading ? 'Creating...' : 'Create Lobby'}
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
    maxWidth: '500px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
  },
  formGroup: {
    marginBottom: '20px'
  },
  input: {
    width: '100%',
    padding: '10px',
    fontSize: '14px',
    border: '1px solid #ddd',
    borderRadius: '5px',
    marginTop: '5px',
    boxSizing: 'border-box'
  },
  textarea: {
    width: '100%',
    padding: '10px',
    fontSize: '14px',
    border: '1px solid #ddd',
    borderRadius: '5px',
    marginTop: '5px',
    minHeight: '80px',
    resize: 'vertical',
    boxSizing: 'border-box'
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
  createBtn: {
    padding: '10px 20px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    backgroundColor: '#007bff',
    color: '#fff'
  }
};

export default CreateGroupModal;
