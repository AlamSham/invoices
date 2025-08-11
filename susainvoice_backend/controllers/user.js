import dotenv from 'dotenv';
dotenv.config();
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/user.js';

const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;


// Register User
export const registerUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({ email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ success: true, message: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Registration error', error: err.message });
  }
};

// Login User and generate refresh token
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const refreshToken = jwt.sign({ userId: user._id }, JWT_REFRESH_SECRET, { expiresIn: '1d' });

    user.refreshToken = refreshToken;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Login successful',
      refreshToken,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Login error', error: err.message });
  }
};

// Validate refresh token (optional use for protected actions)
export const validateRefreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) return res.status(400).json({ message: 'Refresh token is required' });

    const user = await User.findOne({ refreshToken });
    if (!user) return res.status(403).json({ message: 'Invalid refresh token' });

    jwt.verify(refreshToken, JWT_REFRESH_SECRET, (err, decoded) => {
      if (err) return res.status(403).json({ message: 'Token expired or invalid' });

      res.status(200).json({ success: true, message: 'Token is valid', userId: decoded.userId });
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Token validation error', error: err.message });
  }
};


// controllers/user.js (add this below other exports)

export const logoutUser = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Clear the refreshToken
    user.refreshToken = null;
    await user.save();

    res.status(200).json({ success: true, message: 'Logout successful' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Logout error', error: err.message });
  }
};
