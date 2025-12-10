const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();



// Register route: POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Basic validation
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'Email already in use' });
    }

    // Create and save new user
    // Hash the password
    const salt = await bcrypt.genSalt(10); // 10 = cost factor (more = safer)
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user with hashed password
    const newUser = new User({ username, email, password: hashedPassword });

    await newUser.save();

    res.status(201).json({ message: 'User registered successfully', user: newUser });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
      // 1. Get email and password from request
      const { email, password } = req.body;
  
      // 2. Make sure both fields are provided
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }
  
      // 3. Check if a user with that email exists
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      // 4. Compare the entered password with hashed password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid password' });
      }
      // Create JWT token
      const token = jwt.sign(
        { id: user._id, email: user.email },           // payload
        process.env.JWT_SECRET,                        // secret key
        { expiresIn: '7d' }                            // token expires in 1 minute
      );

  
      // 5. If everything is good, return success
      const { password: pwd, ...userWithoutPassword } = user._doc;

      res.status(200).json({
        message: 'Login successful',
        token,
        user: userWithoutPassword
      });
  
    } catch (error) {
      console.error('Login Error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  

module.exports = router;
