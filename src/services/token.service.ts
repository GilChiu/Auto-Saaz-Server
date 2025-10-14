import jwt from 'jsonwebtoken';
import env from '../config/env';
import logger from '../config/logger';
import { UserRole } from '../types/garage.types';

export interface TokenPayload {
    userId: string;
    email: string;
    role: UserRole;
    type: 'access' | 'refresh';
}

export interface DecodedToken {
    userId: string;
    email: string;
    role: UserRole;
    type: 'access' | 'refresh';
    iat: number;
    exp: number;
}

/**
 * Create access token
 */
export const createToken = (userId: string, email: string, role: UserRole): string => {
    try {
        const payload: TokenPayload = {
            userId,
            email,
            role,
            type: 'access',
        };

        const token = jwt.sign(payload, env.JWT_SECRET, {
            expiresIn: env.JWT_EXPIRES_IN,
            issuer: 'autosaaz-api',
            audience: 'autosaaz-client',
        });

        return token;
    } catch (error) {
        logger.error('Error creating access token:', error);
        throw new Error('Failed to create access token');
    }
};

/**
 * Create refresh token
 */
export const createRefreshToken = (userId: string): string => {
    try {
        const payload = {
            userId,
            type: 'refresh',
        };

        const token = jwt.sign(payload, env.JWT_SECRET, {
            expiresIn: env.JWT_REFRESH_EXPIRES_IN,
            issuer: 'autosaaz-api',
            audience: 'autosaaz-client',
        });

        return token;
    } catch (error) {
        logger.error('Error creating refresh token:', error);
        throw new Error('Failed to create refresh token');
    }
};

/**
 * Verify and decode token
 */
export const verifyToken = (token: string): DecodedToken | null => {
    try {
        const decoded = jwt.verify(token, env.JWT_SECRET, {
            issuer: 'autosaaz-api',
            audience: 'autosaaz-client',
        }) as DecodedToken;

        return decoded;
    } catch (error: any) {
        if (error.name === 'TokenExpiredError') {
            logger.warn('Token expired');
            return null;
        }
        if (error.name === 'JsonWebTokenError') {
            logger.warn('Invalid token');
            return null;
        }
        logger.error('Error verifying token:', error);
        return null;
    }
};

/**
 * Decode token without verification (for debugging)
 */
export const decodeToken = (token: string): DecodedToken | null => {
    try {
        const decoded = jwt.decode(token) as DecodedToken;
        return decoded;
    } catch (error) {
        logger.error('Error decoding token:', error);
        return null;
    }
};

/**
 * Check if token is expired
 */
export const isTokenExpired = (token: string): boolean => {
    try {
        const decoded = decodeToken(token);
        if (!decoded) return true;

        const now = Math.floor(Date.now() / 1000);
        return decoded.exp < now;
    } catch (error) {
        return true;
    }
};

/**
 * Get remaining time for token (in seconds)
 */
export const getTokenRemainingTime = (token: string): number => {
    try {
        const decoded = decodeToken(token);
        if (!decoded) return 0;

        const now = Math.floor(Date.now() / 1000);
        const remaining = decoded.exp - now;
        
        return remaining > 0 ? remaining : 0;
    } catch (error) {
        return 0;
    }
};