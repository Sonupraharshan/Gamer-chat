# 🎮 Gamer Chat

A feature-rich, real-time communication platform designed for gamers. Connect with friends, create game lobbies, enjoy crystal-clear voice & video calls, and chat in real-time.

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-gamer--chat.vercel.app-00C853)](https://gamer-chat.vercel.app)
[![Frontend](https://img.shields.io/badge/Frontend-React_18-61DAFB?logo=react)](https://reactjs.org/)
[![Backend](https://img.shields.io/badge/Backend-Node.js-339933?logo=node.js)](https://nodejs.org/)
[![Database](https://img.shields.io/badge/Database-MongoDB_Atlas-47A248?logo=mongodb)](https://www.mongodb.com/)
[![Realtime](https://img.shields.io/badge/Realtime-Socket.io-010101?logo=socket.io)](https://socket.io/)
[![WebRTC](https://img.shields.io/badge/Voice%2FVideo-WebRTC-FF6F00?logo=webrtc)](https://webrtc.org/)

---

## 🌟 Key Features

### 📞 Voice & Video Calling
- **Group Voice Channels** - Join voice lobbies within game groups
- **Private 1:1 Calls** - Voice and video calls with friends
- **Screen Sharing** - Share your gameplay with the group
- **Camera Toggle** - Turn video on/off during calls
- **Mute/Deafen** - Control your audio input/output
- **Real-time Audio Visualization** - See who's speaking
- **Fullscreen Video** - Click any video to go fullscreen
- **Mobile-Responsive Call UI** - Optimized for mobile devices
- **Custom Ringtones** - Choose from 4 different ringtone patterns

### 👥 Friends System
- **Search Users** - Find gamers by username (case-insensitive)
- **Friend Requests** - Send and receive friend requests
- **Real-time DMs** - Private messaging with friends
- **Online Status** - See when friends are online/offline
- **Game Status** - See what games friends are playing
- **Incoming Call Overlay** - Answer calls from any page

### 🏠 Game Lobbies (Groups)
- **Create Lobbies** - Start gaming lobbies with custom names
- **Join via Invite Code** - 8-character unique invite codes
- **Invite by Username** - Search and invite users directly
- **Role-Based Permissions**:
  - 👑 **Admin** - Full control, promote/demote/kick members
  - ⭐ **Co-Admin** - Kick members, invite users
  - 👤 **Member** - Chat and participate
- **Voice Channel Preview** - See who's in voice before joining

### 💬 Real-time Messaging
- **Instant Messages** - Zero-latency Socket.io powered chat
- **Message History** - Scrollable chat with timestamps
- **Connection Indicator** - Green/red dot shows socket status
- **Auto-reconnect** - Seamlessly reconnects on disconnect

### 🔔 Notifications
- **Bell Icon** - Unread notification count badge
- **Friend Requests** - Accept directly from dropdown
- **Auto-refresh** - Updates every 30 seconds

### 🎨 Modern UI/UX
- **Glassmorphism Design** - Frosted glass aesthetic
- **Dark Theme** - Easy on the eyes for long gaming sessions
- **Smooth Animations** - CSS transitions and keyframe animations
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Landing Page** - Beautiful animated landing for new users

---

## 🛠️ Technology Stack

### Frontend Technologies

| Technology | Purpose | Details |
|------------|---------|---------|
| **React 18** | UI Framework | Component-based architecture with hooks |
| **React Router v6** | Navigation | Client-side routing with protected routes |
| **Socket.io Client** | Real-time Events | Bi-directional WebSocket communication |
| **WebRTC APIs** | Voice/Video | Peer-to-peer media streaming |
| **Web Audio API** | Audio Processing | Ringtones, join/leave sounds, audio visualization |
| **Context API** | State Management | AuthContext, SocketContext, VoiceContext |
| **CSS-in-JS** | Styling | Inline styles with dynamic values |
| **Webpack** | Bundler | Module bundling and dev server |

### Backend Technologies

| Technology | Purpose | Details |
|------------|---------|---------|
| **Node.js** | Runtime | JavaScript runtime for server-side code |
| **Express.js** | Web Framework | RESTful API with middleware support |
| **Socket.io** | WebSocket Server | Real-time bidirectional communication |
| **MongoDB** | Database | NoSQL document database |
| **Mongoose** | ODM | MongoDB object modeling for Node.js |
| **JWT** | Authentication | Stateless token-based auth |
| **bcryptjs** | Security | Password hashing with salt |
| **CORS** | Security | Cross-origin resource sharing |
| **dotenv** | Configuration | Environment variable management |

### Infrastructure & Deployment

| Service | Purpose |
|---------|---------|
| **Vercel** | Frontend hosting (Auto-deploy from GitHub) |
| **Railway** | Backend hosting (Auto-deploy from GitHub) |
| **MongoDB Atlas** | Cloud database hosting |
| **STUN/TURN** | WebRTC signaling (Google STUN servers) |

### WebRTC Architecture

```
┌─────────────┐     Socket.io      ┌─────────────┐
│   User A    │◄──────────────────►│   Server    │
│  (Browser)  │    Signaling       │  (Node.js)  │
└──────┬──────┘                    └──────┬──────┘
       │                                  │
       │         WebRTC P2P               │
       │◄────────────────────────────────►│
       │      (Audio/Video Stream)        │
       │                                  │
┌──────┴──────┐                    ┌──────┴──────┐
│   User B    │◄──────────────────►│   User C    │
│  (Browser)  │     WebRTC P2P     │  (Browser)  │
└─────────────┘                    └─────────────┘
```

---

## 📁 Project Structure

```
Gamer-chat/
├── gamer-chat-backend/
│   ├── models/
│   │   ├── User.js           # User schema with friends, status
│   │   ├── Group.js          # Group/lobby schema
│   │   ├── GroupMessage.js   # Group chat messages
│   │   ├── Message.js        # Private DM messages
│   │   └── Notification.js   # Notification schema
│   ├── routes/
│   │   ├── auth.js           # Login/Register endpoints
│   │   ├── user.js           # User, friends, notifications
│   │   ├── group.js          # Group CRUD, invites, roles
│   │   ├── message.js        # Private messaging
│   │   └── ai.js             # AI emotion detection (experimental)
│   ├── middleware/
│   │   └── authMiddleware.js # JWT verification
│   ├── index.js              # Main server + Socket.io setup
│   ├── package.json
│   └── .env                  # Environment variables
│
├── gamer-chat-frontend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── axios.js      # Axios instance with interceptors
│   │   │   └── groupApi.js   # Group-related API calls
│   │   ├── components/
│   │   │   ├── GroupChat.js          # Main chat + voice UI
│   │   │   ├── GroupList.js          # Sidebar group list
│   │   │   ├── InviteModal.js        # Invite users to group
│   │   │   ├── JoinGroupModal.js     # Join via invite code
│   │   │   ├── CreateGroupModal.js   # Create new lobby
│   │   │   ├── MemberListItem.js     # Member with role actions
│   │   │   ├── NotificationBell.js   # Notification dropdown
│   │   │   ├── ActiveCallBar.js      # Bottom bar during calls
│   │   │   ├── CallControls.js       # Mute/camera/screen buttons
│   │   │   ├── IncomingCallOverlay.js # Ringtone + answer UI
│   │   │   └── PrivateCallOverlay.js  # Active call video UI
│   │   ├── context/
│   │   │   ├── AuthContext.js    # User auth state
│   │   │   ├── SocketContext.js  # Socket.io connection
│   │   │   └── VoiceContext.js   # WebRTC, streams, call state
│   │   ├── pages/
│   │   │   ├── Home.js           # Dashboard with groups
│   │   │   ├── Friends.js        # DMs and friend management
│   │   │   ├── Login.js          # Login page (animated)
│   │   │   ├── Register.js       # Registration page
│   │   │   └── LandingPage.js    # Public landing page
│   │   ├── App.js                # Routes + global overlays
│   │   ├── index.js              # React entry point
│   │   ├── config.js             # API URL configuration
│   │   └── designSystem.css      # CSS variables + animations
│   ├── public/
│   │   └── index.html
│   ├── webpack.config.js
│   ├── vercel.json               # Vercel routing config
│   └── package.json
│
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v16 or higher
- **MongoDB** (local or MongoDB Atlas)
- **npm** or **yarn**

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/Sonupraharshan/Gamer-chat.git
   cd Gamer-chat
   ```

2. **Setup Backend**
   ```bash
   cd gamer-chat-backend
   npm install
   ```

3. **Create `.env` file in backend folder**
   ```env
   PORT=5000
   MONGO_URL=mongodb://localhost:27017/gamer-chat
   JWT_SECRET=your_super_secret_key_here
   FRONTEND_URL=http://localhost:3000
   ```

4. **Setup Frontend**
   ```bash
   cd ../gamer-chat-frontend
   npm install
   ```

5. **Create `.env` file in frontend folder**
   ```env
   REACT_APP_API_URL=http://localhost:5000
   ```

### Running the Application

1. **Start Backend** (Terminal 1)
   ```bash
   cd gamer-chat-backend
   npm run dev
   ```

2. **Start Frontend** (Terminal 2)
   ```bash
   cd gamer-chat-frontend
   npm run dev
   ```

3. **Open Browser** → `http://localhost:3000`

---

## 🌐 Deployment

### Frontend (Vercel)
1. Push to GitHub
2. Connect repository to Vercel
3. Set build command: `npm run build`
4. Set output directory: `dist`
5. Add environment variable: `REACT_APP_API_URL=https://your-backend.railway.app`

### Backend (Railway)
1. Push to GitHub
2. Connect repository to Railway
3. Set root directory: `gamer-chat-backend`
4. Add environment variables:
   - `MONGO_URL` - MongoDB Atlas connection string
   - `JWT_SECRET` - Your secret key
   - `FRONTEND_URL` - Your Vercel frontend URL

---

## 📱 Usage Guide

### Getting Started
1. **Register** - Create an account with username, email, password
2. **Login** - Sign in to access the dashboard

### Managing Friends
1. Navigate to **Friends** tab
2. Click **+ (Add Friend)** button
3. Search for a username
4. Click **Send Request**
5. Friend accepts from their **🔔 Notification Bell**

### Creating a Lobby
1. Click **➕ Create Lobby** on Home
2. Enter lobby name and description
3. Share the invite code or invite users directly

### Voice/Video Calls
1. **Group Voice** - Click "Join Voice" in any group
2. **Private Call** - Click 📞 or 📹 on a friend's chat
3. **Controls** - Mute, camera, screen share, leave
4. **Fullscreen** - Click any video or the ⛶ button

---

## 🔐 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login and get JWT |

### Users & Friends
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/user/me` | Get current user |
| GET | `/api/user/friends` | Get friends list |
| GET | `/api/user/requests` | Get pending friend requests |
| GET | `/api/user/search` | Search users by username |
| POST | `/api/user/request-by-username/:username` | Send friend request |
| POST | `/api/user/accept/:id` | Accept friend request |
| GET | `/api/user/notifications` | Get all notifications |
| GET | `/api/user/notifications/count` | Get unread count |

### Groups
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/group/create` | Create new group |
| GET | `/api/group/my-groups` | Get user's groups |
| POST | `/api/group/join` | Join via invite code |
| GET | `/api/group/:id` | Get group details |
| DELETE | `/api/group/:id/leave` | Leave group |
| POST | `/api/group/:id/invite-user` | Invite by username |
| PUT | `/api/group/:id/role` | Change member role |
| DELETE | `/api/group/:id/kick/:userId` | Kick member |

### Messages
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/group/:id/messages` | Get group messages |
| POST | `/api/group/:id/message` | Send group message |
| GET | `/api/message/:friendId` | Get DM history |
| POST | `/api/message/:friendId` | Send private message |

---

## 🔌 Socket.io Events

### Group Events
| Event | Direction | Description |
|-------|-----------|-------------|
| `join-group` | Client → Server | Join a group room |
| `leave-group` | Client → Server | Leave a group room |
| `send-group-message` | Client → Server | Send message |
| `group-message` | Server → Client | Receive message |

### Voice Channel Events
| Event | Direction | Description |
|-------|-----------|-------------|
| `join-voice` | Client → Server | Join voice channel |
| `leave-voice` | Client → Server | Leave voice channel |
| `user-joined-voice` | Server → Client | User joined voice |
| `user-left-voice` | Server → Client | User left voice |
| `voice-channel-users` | Server → Client | Current voice users |
| `voice-channel-preview` | Server → Client | Preview of who's in voice |

### WebRTC Signaling
| Event | Direction | Description |
|-------|-----------|-------------|
| `webrtc-offer` | Bidirectional | Send/receive SDP offer |
| `webrtc-answer` | Bidirectional | Send/receive SDP answer |
| `webrtc-ice-candidate` | Bidirectional | ICE candidate exchange |

### Private Call Events
| Event | Direction | Description |
|-------|-----------|-------------|
| `private-call-start` | Client → Server | Initiate call |
| `private-call-request` | Server → Client | Incoming call |
| `private-call-accept` | Client → Server | Accept call |
| `private-call-accepted` | Server → Client | Call accepted |
| `private-call-decline` | Client → Server | Decline call |
| `private-call-declined` | Server → Client | Call declined |
| `private-call-end` | Bidirectional | End call |
| `private-call-ice-candidate` | Bidirectional | Private call ICE |

### Status Events
| Event | Direction | Description |
|-------|-----------|-------------|
| `friend-status-changed` | Server → Client | Friend online/offline |
| `member-status-changed` | Server → Client | Group member status |

---

## 🎨 Design System

### Color Palette
| Variable | Color | Usage |
|----------|-------|-------|
| `--bg-primary` | `#0a0b0d` | Main background |
| `--bg-secondary` | `#16171d` | Sidebar/panels |
| `--bg-tertiary` | `#1e1f26` | Cards/elevated elements |
| `--accent-primary` | `#7d5fff` | Cyber Purple (buttons, links) |
| `--accent-secondary` | `#00ff88` | Neon Green (online status) |
| `--accent-tertiary` | `#ff3e81` | Hot Pink (notifications) |
| `--text-main` | `#f0f1f5` | Primary text |
| `--text-muted` | `#949ba4` | Secondary text |

### Effects
- **Glassmorphism** - `backdrop-filter: blur(20px)` with semi-transparent backgrounds
- **Neon Glow** - `box-shadow: 0 0 15px rgba(125, 95, 255, 0.3)`
- **Smooth Transitions** - `cubic-bezier(0.4, 0, 0.2, 1)` easing

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

