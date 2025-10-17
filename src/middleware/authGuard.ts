import { Request, Response, NextFunction } from 'express';
import { verify } from 'jsonwebtoken';
import env from '../config/env';
import logger from '../config/logger';

export const authGuard = (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader?.split(' ')[1];

        if (!token) {
            logger.warn('AuthGuard: No token provided');
            return res.status(401).json({ 
                success: false,
                message: 'No token provided, authorization denied.' 
            });
        }

        verify(token, env.JWT_SECRET, (err, decoded: any) => {
            if (err) {
                logger.warn('AuthGuard: Token verification failed:', err.message);
                return res.status(401).json({ 
                    success: false,
                    message: 'Token is not valid.' 
                });
            }

            if (!decoded || !decoded.userId) {
                logger.warn('AuthGuard: Invalid token payload');
                return res.status(401).json({ 
                    success: false,
                    message: 'Invalid token payload.' 
                });
            }

            // Set user info for controller access
            (req as any).user = {
                id: decoded.userId,
                email: decoded.email,
                role: decoded.role,
                type: decoded.type
            };

            logger.info(`AuthGuard: User authenticated - ${decoded.email} (${decoded.userId})`);
            next();
        });
    } catch (error: any) {
        logger.error('AuthGuard: Unexpected error:', error);
        return res.status(500).json({ 
            success: false,
            message: 'Authentication error.' 
        });
    }
};