import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { adminGuard } from '../middleware/adminGuard';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();
const adminController = new AdminController();

// Route to get all users (admin only)
router.get('/users', adminGuard, asyncHandler(adminController.getAllUsers));

// Route to delete a user (admin only)
router.delete('/users/:id', adminGuard, asyncHandler(adminController.deleteUser));

// Route to update user (admin only)
router.put('/users/:id', adminGuard, asyncHandler(adminController.updateUser));

// Additional admin routes can be added here

export default router;