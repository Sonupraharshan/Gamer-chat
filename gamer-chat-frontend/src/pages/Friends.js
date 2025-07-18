// src/pages/Friends.js
import React, { useState, useEffect } from 'react';

function Friends() {
  const [friends, setFriends] = useState([]);

  useEffect(() => {
    fetch('http://localhost:5000/friends')
      .then(res => res.json())
      .then(data => setFriends(data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div>
      <h2>Friends List</h2>
      <ul>
        {friends.map(friend => (
          <li key={friend.id}>{friend.username || friend.email}</li>
        ))}
      </ul>
    </div>
  );
}

export default Friends;
