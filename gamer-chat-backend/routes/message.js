const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const User = require('../models/User');
const verifyToken = require('../middleware/authMiddleware');

// Send a message
router.post('/:receiverId', verifyToken, async (req, res) => {
  const { content } = req.body;
  const senderId = req.user.id;
  const receiverId = req.params.receiverId;

  try {
    // Make sure both users exist
    const receiver = await User.findById(receiverId);
    if (!receiver) return res.status(404).json({ message: "Receiver not found" });

    const message = new Message({ sender: senderId, receiver: receiverId, content });
    await message.save();

    // Emit real-time message to both parties
    if (req.io) {
      req.io.to(receiverId).emit('private-message', message);
      req.io.to(senderId).emit('private-message', message);
    }

    res.status(201).json({ message: "Message sent", data: message });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Get chat with a specific user
router.get('/:userId', verifyToken, async (req, res) => {
  const loggedInUserId = req.user.id;
  const otherUserId = req.params.userId;

  try {
    const messages = await Message.find({
      $or: [
        { sender: loggedInUserId, receiver: otherUserId },
        { sender: otherUserId, receiver: loggedInUserId }
      ]
    }).sort('createdAt');

    res.status(200).json({ chat: messages });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
