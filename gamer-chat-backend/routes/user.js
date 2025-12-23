// Get  -> /api/user/me
const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware');

router.get('/me', verifyToken, async (req, res) => {
  try {
    res.status(200).json({ message: "Authorized", user: req.user });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

const User = require('../models/User');

// Send Friend Request by Username → POST /api/user/request-by-username/:username
router.post('/request-by-username/:username', verifyToken, async (req, res) => {
  try {
    const fromUserId = req.user.id;
    const toUsername = req.params.username;

    const fromUser = await User.findById(fromUserId);
    // Use case-insensitive lookup to match search behavior
    // Escape regex special characters for safety
    const escapedUsername = toUsername.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const toUser = await User.findOne({ username: { $regex: `^${escapedUsername}$`, $options: 'i' } });

    if (!toUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (fromUser._id.equals(toUser._id)) {
      return res.status(400).json({ message: "You can't send request to yourself" });
    }

    if (fromUser.friends.includes(toUser._id)) {
      return res.status(400).json({ message: 'Already friends' });
    }

    if (toUser.friendRequests.includes(fromUser._id)) {
      return res.status(400).json({ message: 'Request already sent' });
    }

    toUser.friendRequests.push(fromUser._id);
    await toUser.save();

    res.status(200).json({ message: 'Friend request sent!' });

  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});



// Accept Friend Request → POST /api/user/accept/:id
router.post('/accept/:id', verifyToken, async (req, res) => {
    try {
      const receiverId = req.user.id;        // logged-in user accepting the request
      const senderId = req.params.id;        // user who sent the request
  
      const receiver = await User.findById(receiverId);
      const sender = await User.findById(senderId);
  
      if (!receiver || !sender) {
        return res.status(404).json({ message: "User not found" });
      }
  
      // Check if request actually exists
      if (!receiver.friendRequests.includes(senderId)) {
        return res.status(400).json({ message: "No request from this user" });
      }
  
      // Add each other as friends
      receiver.friends.push(senderId);
      sender.friends.push(receiverId);
  
      // Remove request from pending list
      receiver.friendRequests = receiver.friendRequests.filter(
        (id) => id.toString() !== senderId
      );
  
      await receiver.save();
      await sender.save();
  
      res.status(200).json({ message: "Friend request accepted!" });
  
    } catch (err) {
      res.status(500).json({ message: "Server error", error: err.message });
    }
  });
  
  // View incoming friend requests
router.get('/requests', verifyToken, async (req, res) => {
    try {
      const user = await User.findById(req.user.id).populate('friendRequests', 'username email');
      res.status(200).json({ requests: user.friendRequests });
    } catch (err) {
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  });
  
  // View list of accepted friends
router.get('/friends', verifyToken, async (req, res) => {
    try {
      const user = await User.findById(req.user.id).populate('friends', 'username email status gameStatus lastSeen');
      res.status(200).json({ friends: user.friends });
    } catch (err) {
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  });
  
// GET /api/user/search?username=xyz
router.get('/search', verifyToken, async (req, res) => {
  const { username } = req.query;
  try {
    const users = await User.find({
      username: { $regex: username, $options: 'i' },
    }).select('_id username');
    res.status(200).json({ users });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ========== NOTIFICATIONS ==========

// Get all notifications for the current user
router.get('/notifications', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('friendRequests', 'username');
    
    // Get pending friend requests as notifications
    const friendRequestNotifications = user.friendRequests.map(req => ({
      _id: `fr_${req._id}`,
      type: 'friend_request',
      sender: req,
      message: `${req.username} sent you a friend request`,
      read: false,
      createdAt: new Date()
    }));

    res.json({ 
      notifications: friendRequestNotifications,
      unreadCount: friendRequestNotifications.length
    });
  } catch (err) {
    console.error('Get notifications error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get notification count only (for badge)
router.get('/notifications/count', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const unreadCount = user.friendRequests?.length || 0;
    res.json({ unreadCount });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
