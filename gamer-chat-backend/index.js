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
const Group = require('./models/Group');
const GroupMessage = require('./models/GroupMessage');

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
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/message', messageRoute);
app.use('/api/group', groupRoutes);

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
    socket.username = decoded.username;
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
});

// 8. Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`✅ User connected: ${socket.username} (${socket.userId})`);

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

  socket.on('disconnect', () => {
    console.log(`❌ User disconnected: ${socket.username}`);
  });
});

// 9. Connect to MongoDB
mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('✅ MongoDB connected');
}).catch(err => {
  console.error('❌ MongoDB failed to connect', err);
});

// 10. Start the server (use 'server' instead of 'app' for Socket.io)
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🔥 Server running on port ${PORT}`);
  console.log(`🔌 Socket.io server ready`);
});