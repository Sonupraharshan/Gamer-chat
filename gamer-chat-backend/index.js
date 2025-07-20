// 1. Load the things we need
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const messageRoute = require('./routes/message');



// 2. Load secret keys from .env file
dotenv.config();

// 3. Create the app
const app = express();

// 4. Middleware to read JSON and allow frontend access
app.use(express.json());
app.use(cors());
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/message', messageRoute);

// 5. Test route (you can delete later)
app.get('/', (req, res) => {
  res.send('Hello gamer 🚀 Server is working!');
});

// 6. Connect to MongoDB
mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('✅ MongoDB connected');
}).catch(err => {
  console.error('❌ MongoDB failed to connect', err);
});

// 7. Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🔥 Server running on port ${PORT}`);
});