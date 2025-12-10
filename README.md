# 🎮 Gamer Chat

A real-time chat application built for gamers to connect, create lobbies, and chat with friends.

![Platform](https://img.shields.io/badge/Platform-Web-blue)
![Frontend](https://img.shields.io/badge/Frontend-React-61DAFB)
![Backend](https://img.shields.io/badge/Backend-Node.js-339933)
![Database](https://img.shields.io/badge/Database-MongoDB-47A248)
![Realtime](https://img.shields.io/badge/Realtime-Socket.io-010101)

## ✨ Features

### 👥 Friends System
- **Search Users** - Find other gamers by username
- **Friend Requests** - Send and receive friend requests
- **Real-time Chat** - Private messaging with friends
- **Notifications** - Bell icon shows pending friend requests with accept functionality

### 🏠 Game Lobbies (Groups)
- **Create Lobbies** - Start your own gaming lobby with custom name and description
- **Join via Invite Code** - Share 8-character codes with friends
- **Invite by Username** - Search and invite users directly to your lobby
- **Role Management**:
  - 👑 **Admin** - Full control, can promote/demote/kick members
  - ⭐ **Co-Admin** - Can kick members and invite users
  - 👤 **Member** - Chat and participate

### 💬 Real-time Messaging
- **Instant Messages** - Socket.io powered real-time chat
- **Message Alignment** - Your messages on right, others on left
- **Polling Fallback** - Auto-refresh when socket is disconnected
- **Connection Indicator** - Green/red dot shows connection status

### 🔔 Notifications
- **Bell Icon** - Shows unread notification count
- **Friend Requests** - Accept requests directly from dropdown
- **Auto-refresh** - Updates every 30 seconds

## 🛠️ Tech Stack

### Frontend
- **React** - UI Framework
- **React Router** - Navigation
- **Socket.io Client** - Real-time communication
- **Axios** - HTTP requests
- **JWT Decode** - Token handling

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **Socket.io** - WebSocket server
- **JWT** - Authentication
- **bcrypt** - Password hashing

## 📁 Project Structure

```
Gamer-chat/
├── gamer-chat-backend/
│   ├── models/
│   │   ├── User.js
│   │   ├── Group.js
│   │   ├── GroupMessage.js
│   │   └── Notification.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── user.js
│   │   ├── group.js
│   │   └── message.js
│   ├── middleware/
│   │   └── authMiddleware.js
│   └── index.js
│
├── gamer-chat-frontend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── axios.js
│   │   │   └── groupApi.js
│   │   ├── components/
│   │   │   ├── GroupChat.js
│   │   │   ├── GroupList.js
│   │   │   ├── InviteModal.js
│   │   │   ├── JoinGroupModal.js
│   │   │   ├── MemberListItem.js
│   │   │   ├── NotificationBell.js
│   │   │   └── CreateGroupModal.js
│   │   ├── context/
│   │   │   ├── AuthContext.js
│   │   │   └── SocketContext.js
│   │   ├── pages/
│   │   │   ├── Home.js
│   │   │   ├── Friends.js
│   │   │   ├── Login.js
│   │   │   └── Register.js
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
│
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

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

5. **Create `.env` file in frontend folder** (optional)
   ```env
   REACT_APP_API_URL=http://localhost:5000
   ```

### Running the Application

1. **Start Backend** (Terminal 1)
   ```bash
   cd gamer-chat-backend
   npm run dev
   # or: nodemon index.js
   ```

2. **Start Frontend** (Terminal 2)
   ```bash
   cd gamer-chat-frontend
   npm start
   ```

3. **Open Browser**
   - Navigate to `http://localhost:3000`

## 📱 Usage

### Getting Started
1. **Register** - Create a new account
2. **Login** - Sign in with your credentials

### Making Friends
1. Click **Friends** in the header
2. Click **Send Request** button
3. Search for a username and click to send request
4. Other user accepts from **View Requests** or the **🔔 Notification Bell**

### Creating a Lobby
1. Click **➕ Create Lobby** on the Home page
2. Enter a name and optional description
3. Share the invite code or search for users to invite

### Joining a Lobby
1. Click **🔗 Join Lobby**
2. Enter the 8-character invite code
3. Start chatting!

## 🎨 Theme Colors

| Element | Color Code |
|---------|------------|
| Background | `#3d3a3aff` |
| Header/Sidebar | `#272424ff` |
| Primary Button | `#556158ff` |
| Accent | `#575050ff` |
| Danger | `#dc3545` |
| Text | `#ffffff` |

## 🔐 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/user/me` | Get current user |
| GET | `/api/user/friends` | Get friends list |
| GET | `/api/user/requests` | Get friend requests |
| GET | `/api/user/search` | Search users |
| POST | `/api/user/request-by-username/:username` | Send friend request |
| POST | `/api/user/accept/:id` | Accept friend request |
| GET | `/api/user/notifications` | Get notifications |

### Groups
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/group/create` | Create new group |
| GET | `/api/group/my-groups` | Get user's groups |
| POST | `/api/group/join` | Join via invite code |
| GET | `/api/group/:id` | Get group details |
| DELETE | `/api/group/:id/leave` | Leave group |
| POST | `/api/group/:id/invite-user` | Invite by username |
| GET | `/api/group/:id/messages` | Get messages |
| POST | `/api/group/:id/message` | Send message |

## 🔌 Socket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `join-group` | Client → Server | Join a group room |
| `leave-group` | Client → Server | Leave a group room |
| `send-group-message` | Client → Server | Send a message |
| `group-message` | Server → Client | Receive a message |
| `member-joined` | Server → Client | User joined group |
| `member-left` | Server → Client | User left group |

## 👨‍💻 Author

**Sonu Praharshan**
- GitHub: [@Sonupraharshan](https://github.com/Sonupraharshan)

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

<p align="center">Made with ❤️ for Gamers</p>