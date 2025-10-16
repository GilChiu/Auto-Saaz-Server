import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../services/token.service';

export const adminGuard = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Unauthorized: No token provided' });
        }

        const decoded = verifyToken(token);
        if (!decoded || decoded.role !== 'admin') {
            return res.status(403).json({ message: 'Forbidden: You do not have access to this resource' });
        }

        (req as any).user = decoded; // Attach user information to the request
        next();
    } catch (error) {
        console.error('Admin guard error:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};