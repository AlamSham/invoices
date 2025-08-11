import express from 'express';
import {
  registerUser,
  loginUser,
  validateRefreshToken,logoutUser
} from '../controllers/user.js';
import auth from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/validate', validateRefreshToken);
router.post('/logout', auth, logoutUser); // ✅ Protected route

export default router;
