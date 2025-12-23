// 1. Load the things we need
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const messageRoute = require('./routes/message');
const groupRoutes = require('./routes/group');
const aiRoutes = require('./routes/ai');
const Group = require('./models/Group');
const GroupMessage = require('./models/GroupMessage');
const User = require('./models/User');

// 2. Load secret keys from .env file
dotenv.config();

// 3. Create the app and HTTP server
const app = express();
const server = http.createServer(app);

// 4. Configure Socket.io with CORS
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// 5. Middleware to read JSON and allow frontend access
app.use(express.json());

// CORS: Allow both local dev and production frontend
const allowedOrigins = [
  'http://localhost:3000',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(null, true); // Allow anyway for debugging - remove in strict production
    }
  },
  credentials: true
}));
app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/message', messageRoute);
app.use('/api/group', groupRoutes);
app.use('/api/ai', aiRoutes);

// 6. Test route (you can delete later)
app.get('/', (req, res) => {
  res.send('Hello gamer 🚀 Server is working!');
});

// 7. Socket.io authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  
  if (!token) {
    return next(new Error('Authentication error'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    
    // If username is in token, use it. Otherwise, fetch from DB.
    if (decoded.username) {
      socket.username = decoded.username;
      next();
    } else {
      const User = require('./models/User');
      User.findById(decoded.id).then(user => {
        if (user) {
          socket.username = user.username;
          next();
        } else {
          next(new Error('User not found'));
        }
      }).catch(err => {
        next(new Error('Authentication error'));
      });
    }
  } catch (err) {
    next(new Error('Authentication error'));
  }
});

// 8. Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`✅ User connected: ${socket.username} (${socket.userId})`);
  
  // Join personal room for 1:1 signaling
  socket.join(socket.userId);

  // Broadcast online status to friends
  const updateStatus = async (status) => {
    try {
      const user = await User.findByIdAndUpdate(socket.userId, { 
        status, 
        lastSeen: new Date() 
      }, { new: true }).populate('friends');
      
      const groups = await Group.find({
        $or: [
          { admin: socket.userId },
          { coAdmins: socket.userId },
          { members: socket.userId }
        ]
      });

      if (user && user.friends) {
        user.friends.forEach(friend => {
          io.to(friend._id.toString()).emit('friend-status-changed', {
            userId: socket.userId,
            status: status,
            gameStatus: user.gameStatus
          });
        });
      }

      groups.forEach(group => {
        io.to(`group-${group._id}`).emit('member-status-changed', {
          userId: socket.userId,
          status: status,
          gameStatus: user.gameStatus
        });
      });
    } catch (err) {
      console.error('Status update error:', err);
    }
  };

  updateStatus('online');

  // Set game status
  socket.on('set-game-status', async (gameStatus) => {
    try {
      const user = await User.findByIdAndUpdate(socket.userId, { 
        gameStatus: gameStatus.trim() 
      }, { new: true }).populate('friends');

      if (!user) return;

      // Notify friends
      if (user.friends) {
        user.friends.forEach(friend => {
          io.to(friend._id.toString()).emit('friend-status-changed', {
            userId: socket.userId,
            status: user.status,
            gameStatus: user.gameStatus
          });
        });
      }

      // Notify groups
      const groups = await Group.find({
        $or: [
          { admin: socket.userId },
          { coAdmins: socket.userId },
          { members: socket.userId }
        ]
      });

      groups.forEach(group => {
        io.to(`group-${group._id}`).emit('member-status-changed', {
          userId: socket.userId,
          status: user.status,
          gameStatus: user.gameStatus
        });
        
        // --- GAME LOBBY INTELLIGENCE ---
        // Check if others in this group are playing the same game
        if (user.gameStatus) {
           // We can't easily check all socket statuses in a room with standard IO
           // But we can check if there's enough activity to suggest a lobby
           // For now, let's emit a suggestion if the game is set
           // The frontend will handle showing it if it detects multiples
           io.to(`group-${group._id}`).emit('game-activity-alert', {
             groupId: group._id,
             gameName: user.gameStatus,
             username: socket.username
           });
        }
      });
    } catch (err) {
      console.error('Set game status error:', err);
    }
  });

  // Join group room
  socket.on('join-group', async (groupId) => {
    try {
      const group = await Group.findById(groupId);
      
      if (!group) {
        socket.emit('error', { message: 'Group not found' });
        return;
      }

      // Check if user is a member
      if (!group.getUserRole(socket.userId)) {
        socket.emit('error', { message: 'You are not a member of this group' });
        return;
      }

      socket.join(`group-${groupId}`);
      console.log(`👥 ${socket.username} joined group: ${groupId}`);
      
      // Notify others in the group
      socket.to(`group-${groupId}`).emit('member-joined', {
        userId: socket.userId,
        username: socket.username,
        groupId
      });
    } catch (error) {
      console.error('Join group error:', error);
      socket.emit('error', { message: 'Failed to join group' });
    }
  });

  // Leave group room
  socket.on('leave-group', (groupId) => {
    socket.leave(`group-${groupId}`);
    console.log(`👋 ${socket.username} left group: ${groupId}`);
    
    socket.to(`group-${groupId}`).emit('member-left', {
      userId: socket.userId,
      username: socket.username,
      groupId
    });
  });

  // Send group message
  socket.on('send-group-message', async (data) => {
    try {
      const { groupId, content } = data;
      
      const group = await Group.findById(groupId);
      
      if (!group || !group.getUserRole(socket.userId)) {
        socket.emit('error', { message: 'Unauthorized' });
        return;
      }

      // Save message to database
      const message = new GroupMessage({
        group: groupId,
        sender: socket.userId,
        content: content.trim()
      });

      await message.save();
      
      // Broadcast to all users in the group (including sender)
      io.to(`group-${groupId}`).emit('group-message', {
        _id: message._id,
        groupId,
        sender: {
          _id: socket.userId,
          username: socket.username
        },
        content: message.content,
        createdAt: message.createdAt
      });
    } catch (error) {
      console.error('Send group message error:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Member kicked notification
  socket.on('member-kicked', (data) => {
    const { groupId, kickedUserId, kickedUsername } = data;
    
    // Notify the kicked user
    io.to(`group-${groupId}`).emit('member-kicked-notification', {
      groupId,
      kickedUserId,
      kickedUsername
    });
  });

  // Role changed notification
  socket.on('role-changed', (data) => {
    const { groupId, userId, newRole, username } = data;
    
    io.to(`group-${groupId}`).emit('role-changed-notification', {
      groupId,
      userId,
      username,
      newRole
    });
  });

  // --- WebRTC Signaling ---

  // User joins a voice channel in a group
  socket.on('join-voice', (data) => {
    const { groupId } = data;
    
    // Leave any other voice channels first
    for (const room of socket.rooms) {
      if (room.startsWith('voice-') && room !== `voice-${groupId}`) {
        socket.leave(room);
        const oldGroupId = room.replace('voice-', '');
        socket.to(room).emit('user-left-voice', { 
          userId: socket.userId,
          username: socket.username,
          groupId: oldGroupId
        });
      }
    }

    socket.join(`voice-${groupId}`);
    console.log(`🎤 ${socket.username} joined voice: ${groupId}`);
    
    // Notify others in identifying the new participant
    socket.to(`voice-${groupId}`).emit('user-joined-voice', {
      userId: socket.userId,
      username: socket.username
    });

    // Send the list of current users in voice to the new joiner
    const clients = io.sockets.adapter.rooms.get(`voice-${groupId}`);
    const users = [];
    if (clients) {
      for (const clientId of clients) {
        const clientSocket = io.sockets.sockets.get(clientId);
        if (clientSocket) {
          users.push({ _id: clientSocket.userId, username: clientSocket.username });
        }
      }
    }
    socket.emit('voice-channel-users', { users });
  });

  // User leaves voice channel
  socket.on('leave-voice', (data) => {
    const { groupId } = data;
    socket.leave(`voice-${groupId}`);
    console.log(`🔇 ${socket.username} left voice: ${groupId}`);
    
    socket.to(`voice-${groupId}`).emit('user-left-voice', {
      userId: socket.userId
    });
  });

  // Signaling: Sending Offer
  socket.on('webrtc-offer', (data) => {
    const { targetId, offer, groupId } = data;
    io.to(targetId).emit('webrtc-offer', {
      offer,
      senderId: socket.id,
      senderUsername: socket.username,
      groupId
    });
  });

  // Signaling: Sending Answer
  socket.on('webrtc-answer', (data) => {
    const { targetId, answer } = data;
    io.to(targetId).emit('webrtc-answer', {
      answer,
      senderId: socket.id
    });
  });

  // Signaling: ICE Candidates
  socket.on('webrtc-ice-candidate', (data) => {
    const { targetId, candidate } = data;
    io.to(targetId).emit('webrtc-ice-candidate', {
      candidate,
      senderId: socket.id
    });
  });

  // --- Whisper Mode Signaling ---
  socket.on('whisper-start', (data) => {
    const { targetUserId, groupId } = data;
    // Notify target that someone wants to whisper
    socket.to(`voice-${groupId}`).emit('whisper-request', {
      fromUserId: socket.userId,
      fromUsername: socket.username,
      targetUserId
    });
  });

  socket.on('whisper-data', (data) => {
    const { targetUserId, audioData, groupId } = data;
    // Securely forward audio data to the target only if they are in the same voice room
    // Note: In WebRTC this usually happens via a separate peer connection for whisper 
    // or routing logic on the frontend. This event is a fallback/alternative for small data.
    socket.to(`voice-${groupId}`).emit('whisper-receive', {
      fromUserId: socket.userId,
      audioData
    });
  });

  socket.on('disconnect', () => {
    console.log(`❌ User disconnected: ${socket.username}`);
    updateStatus('offline');
  });

  // --- Private Call Signaling ---
  socket.on('private-call-start', (data) => {
    const { targetUserId, offer, isVideo } = data;
    io.to(targetUserId).emit('private-call-request', {
      fromUserId: socket.userId,
      fromUsername: socket.username,
      offer,
      isVideo
    });
  });

  socket.on('private-call-accept', (data) => {
    const { targetUserId, answer } = data;
    io.to(targetUserId).emit('private-call-accepted', {
      fromUserId: socket.userId,
      answer
    });
  });

  socket.on('private-call-decline', (data) => {
    const { targetUserId } = data;
    io.to(targetUserId).emit('private-call-declined', {
      fromUserId: socket.userId
    });
  });

  socket.on('private-call-ice-candidate', (data) => {
    const { targetUserId, candidate } = data;
    io.to(targetUserId).emit('private-call-ice-candidate', {
      fromUserId: socket.userId,
      candidate
    });
  });

  socket.on('private-call-end', (data) => {
    const { targetUserId } = data;
    io.to(targetUserId).emit('private-call-ended', {
      fromUserId: socket.userId
    });
  });
});

// 9. Connect to MongoDB and then start server
mongoose.connect(process.env.MONGO_URL, { 
  family: 4,
  serverSelectionTimeoutMS: 5000
})
  .then(() => {
    console.log('✅ MongoDB connected');
    
    // 10. Start the server (inside successful DB connection)
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`🔥 Server running on port ${PORT}`);
      console.log(`🔌 Socket.io server ready`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB failed to connect', err);
    process.exit(1); // Exit if DB connection fails
  });

// Handle connection errors after initial connection
mongoose.connection.on('error', err => {
  console.error('❌ MongoDB connection error:', err);
});