import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';

const authService = new AuthService();

export const adminGuard = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Unauthorized: No token provided' });
        }

        const user = await authService.verifyToken(token);
        if (!user || !user.isAdmin) {
            return res.status(403).json({ message: 'Forbidden: You do not have access to this resource' });
        }

        req.user = user; // Attach user information to the request
        next();
    } catch (error) {
        console.error('Admin guard error:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};