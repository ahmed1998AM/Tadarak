import express from 'express';
import { 
  register, 
  login, 
  refreshToken, 
  getMe, 
  logout, 
  forgotPassword, 
  resetPassword 
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { authLimiter } from '../middleware/error.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', authLimiter, login);
router.post('/refresh', refreshToken);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected routes
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);

export default router;
