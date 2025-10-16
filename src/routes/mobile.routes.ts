import { Router } from 'express';
import { MobileController } from '../controllers/mobile.controller';
import { asyncHandler } from '../middleware/asyncHandler';
import { authGuard } from '../middleware/authGuard';

const router = Router();
const mobileController = new MobileController();

// Mobile registration and login (use auth routes instead)
router.post('/register', mobileController.register);
router.post('/login', mobileController.login);

// File upload
router.post('/upload', authGuard, mobileController.uploadFile);

// User profile
router.get('/profile', authGuard, mobileController.getUserProfile);

// Add more mobile-specific routes as needed

export default router;