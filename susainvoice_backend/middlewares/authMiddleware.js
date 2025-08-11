import dotenv from 'dotenv';
dotenv.config();
import jwt from 'jsonwebtoken';
import User from '../models/user.js';

const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

const auth = async (req, res, next) => {
  try {
    // 🔍 Step 1: Get the token from headers, body, cookies, or query params
    const token =
      req.headers['authorization']?.split(' ')[1] || // Bearer token
      req.body?.refreshToken ||
      req.cookies?.refreshToken ||
      req.query?.refreshToken;

    // console.log('🔐 Received token:', token);

    // 🔍 Step 2: If no token is found, return 401
    if (!token) {
      // console.log('❌ No token provided');
      return res.status(401).json({ message: 'No token provided' });
    }

    // 🔍 Step 3: Find user with this refresh token
    const user = await User.findOne({ refreshToken: token });
    // console.log('👤 Fetched user with refresh token:', user);

    if (!user) {
      // console.log('❌ No user found with this refresh token');
      return res.status(403).json({ message: 'Invalid refresh token' });
    }

    // 🔍 Step 4: Verify the token using the refresh secret
    jwt.verify(token, JWT_REFRESH_SECRET, (err, decoded) => {
      if (err) {
        // console.log('❌ Token verification failed:', err.message);
        return res.status(403).json({ message: 'Token expired or invalid' });
      }

      // console.log('✅ Token verified successfully:', decoded);

      // 🔍 Step 5: Attach user ID to the request
      req.userId = decoded.userId;

      // 🔍 Step 6: Move to the next middleware/controller
      next();
    });
  } catch (err) {
    // console.log('❌ Error in auth middleware:', err.message);
    res.status(500).json({ message: 'Authentication error', error: err.message });
  }
};

export default auth;
