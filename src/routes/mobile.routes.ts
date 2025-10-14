import { Router } from 'express';
import { MobileController } from '../controllers/mobile.controller';
import { asyncHandler } from '../middleware/asyncHandler';
import { authGuard } from '../middleware/authGuard';

const router = Router();
const mobileController = new MobileController();

// Example route for fetching mobile-specific data
router.get('/data', authGuard, asyncHandler(mobileController.getMobileData));

// Example route for submitting mobile-specific feedback
router.post('/feedback', authGuard, asyncHandler(mobileController.submitFeedback));

// Add more mobile-specific routes as needed

export default router;