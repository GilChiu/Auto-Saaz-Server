import { Request, Response, NextFunction } from 'express';
import { verify } from 'jsonwebtoken';
import { env } from '../config/env';

export const authGuard = (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers['authorization']?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'No token provided, authorization denied.' });
    }

    verify(token, env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Token is not valid.' });
        }

        req.user = decoded;
        next();
    });
};