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

module.exports = router;

const User = require('../models/User');

// Send Friend Request by Username → POST /api/user/request-by-username/:username
router.post('/request-by-username/:username', verifyToken, async (req, res) => {
  try {
    const fromUserId = req.user.id;
    const toUsername = req.params.username;

    const fromUser = await User.findById(fromUserId);
    const toUser = await User.findOne({ username: toUsername });

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
      const user = await User.findById(req.user.id).populate('friends', 'username email');
      res.status(200).json({ friends: user.friends });
    } catch (err) {
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  });
  

