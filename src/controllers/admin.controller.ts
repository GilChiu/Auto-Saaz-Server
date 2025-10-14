import { Request, Response } from 'express';
import { UserService } from '../services/user.service';
import { AuthService } from '../services/auth.service';

export class AdminController {
    private userService: UserService;
    private authService: AuthService;

    constructor() {
        this.userService = new UserService();
        this.authService = new AuthService();
    }

    public async getAllUsers(req: Request, res: Response): Promise<void> {
        try {
            const users = await this.userService.getAllUsers();
            res.status(200).json({ success: true, data: users });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to retrieve users', error: error.message });
        }
    }

    public async deleteUser(req: Request, res: Response): Promise<void> {
        const { userId } = req.params;
        try {
            await this.userService.deleteUser(userId);
            res.status(200).json({ success: true, message: 'User deleted successfully' });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to delete user', error: error.message });
        }
    }

    public async updateUser(req: Request, res: Response): Promise<void> {
        const { userId } = req.params;
        const userData = req.body;
        try {
            const updatedUser = await this.userService.updateUser(userId, userData);
            res.status(200).json({ success: true, data: updatedUser });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to update user', error: error.message });
        }
    }
}