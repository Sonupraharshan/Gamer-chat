import React, { useState } from 'react';
import { inviteUser, searchUsers } from '../api/groupApi';

function InviteModal({ group, onClose }) {
  const [copied, setCopied] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [inviting, setInviting] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(group.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    
    try {
      setSearching(true);
      const data = await searchUsers(searchTerm.trim());
      setSearchResults(data.users || []);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setSearching(false);
    }
  };

  const handleInvite = async (username) => {
    try {
      setInviting(true);
      const result = await inviteUser(group._id, username);
      alert(result.message);
      // Remove from search results
      setSearchResults(prev => prev.filter(u => u.username !== username));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to invite user');
    } finally {
      setInviting(false);
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 style={styles.title}>Invite to {group.name}</h2>
        
        {/* Invite Code Section */}
        <div style={styles.section}>
          <h4 style={styles.sectionTitle}>📋 Share Invite Code</h4>
          <div style={styles.codeContainer}>
            <div style={styles.code}>{group.inviteCode}</div>
            <button onClick={handleCopy} style={styles.copyBtn}>
              {copied ? '✓ Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Username Search Section */}
        <div style={styles.section}>
          <h4 style={styles.sectionTitle}>🔍 Invite by Username</h4>
          <div style={styles.searchContainer}>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Enter username..."
              style={styles.searchInput}
            />
            <button 
              onClick={handleSearch} 
              style={styles.searchBtn}
              disabled={searching}
            >
              {searching ? '...' : 'Search'}
            </button>
          </div>
          
          {/* Search Results */}
          <div style={styles.results}>
            {searchResults.map((user) => (
              <div key={user._id} style={styles.resultItem}>
                <span style={styles.username}>{user.username}</span>
                <button 
                  onClick={() => handleInvite(user.username)}
                  style={styles.inviteBtn}
                  disabled={inviting}
                >
                  {inviting ? '...' : 'Invite'}
                </button>
              </div>
            ))}
            {searchResults.length === 0 && searchTerm && !searching && (
              <p style={styles.noResults}>No users found</p>
            )}
          </div>
        </div>

        <button onClick={onClose} style={styles.closeBtn}>
          Close
        </button>
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
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modal: {
    backgroundColor: '#272424ff',
    padding: '25px',
    borderRadius: '10px',
    width: '90%',
    maxWidth: '450px',
    border: '1px solid #555'
  },
  title: {
    margin: '0 0 20px 0',
    color: '#fff',
    fontSize: '20px'
  },
  section: {
    marginBottom: '20px',
    padding: '15px',
    backgroundColor: '#3d3a3aff',
    borderRadius: '8px'
  },
  sectionTitle: {
    margin: '0 0 12px 0',
    color: '#fff',
    fontSize: '14px'
  },
  codeContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  code: {
    flex: 1,
    padding: '12px',
    backgroundColor: '#272424ff',
    border: '2px dashed #556158ff',
    borderRadius: '5px',
    fontSize: '18px',
    fontFamily: 'monospace',
    letterSpacing: '2px',
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#556158ff'
  },
  copyBtn: {
    padding: '12px 18px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    backgroundColor: '#556158ff',
    color: '#fff',
    fontSize: '13px'
  },
  searchContainer: {
    display: 'flex',
    gap: '10px'
  },
  searchInput: {
    flex: 1,
    padding: '10px 12px',
    backgroundColor: '#272424ff',
    border: '1px solid #555',
    borderRadius: '5px',
    color: '#fff',
    fontSize: '14px'
  },
  searchBtn: {
    padding: '10px 18px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    backgroundColor: '#556158ff',
    color: '#fff',
    fontSize: '13px'
  },
  results: {
    marginTop: '10px',
    maxHeight: '150px',
    overflowY: 'auto'
  },
  resultItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px',
    borderBottom: '1px solid #555'
  },
  username: {
    color: '#fff',
    fontSize: '14px'
  },
  inviteBtn: {
    padding: '6px 15px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    backgroundColor: '#556158ff',
    color: '#fff',
    fontSize: '12px'
  },
  noResults: {
    color: '#999',
    textAlign: 'center',
    fontSize: '13px',
    margin: '10px 0'
  },
  closeBtn: {
    width: '100%',
    padding: '12px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    backgroundColor: '#dc3545',
    color: '#fff',
    fontSize: '14px'
  }
};

export default InviteModal;
