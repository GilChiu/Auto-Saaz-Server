import bcrypt from 'bcrypt';
import env from '../config/env';
import logger from '../config/logger';

/**
 * Hash a plain text password
 * @param password - Plain text password
 * @returns Hashed password
 */
export const hashPassword = async (password: string): Promise<string> => {
    try {
        const salt = await bcrypt.genSalt(env.BCRYPT_ROUNDS);
        const hashedPassword = await bcrypt.hash(password, salt);
        return hashedPassword;
    } catch (error) {
        logger.error('Error hashing password:', error);
        throw new Error('Failed to hash password');
    }
};

/**
 * Compare a plain text password with a hashed password
 * @param password - Plain text password
 * @param hashedPassword - Hashed password from database
 * @returns True if passwords match, false otherwise
 */
export const comparePassword = async (
    password: string,
    hashedPassword: string
): Promise<boolean> => {
    try {
        const isMatch = await bcrypt.compare(password, hashedPassword);
        return isMatch;
    } catch (error) {
        logger.error('Error comparing passwords:', error);
        return false;
    }
};

/**
 * Validate password strength
 * @param password - Plain text password to validate
 * @returns Object with validation result and message
 */
export const validatePasswordStrength = (password: string): {
    isValid: boolean;
    message?: string;
} => {
    if (password.length < env.PASSWORD_MIN_LENGTH) {
        return {
            isValid: false,
            message: `Password must be at least ${env.PASSWORD_MIN_LENGTH} characters long`,
        };
    }

    if (password.length > 128) {
        return {
            isValid: false,
            message: 'Password must not exceed 128 characters',
        };
    }

    if (!/[A-Z]/.test(password)) {
        return {
            isValid: false,
            message: 'Password must contain at least one uppercase letter',
        };
    }

    if (!/[a-z]/.test(password)) {
        return {
            isValid: false,
            message: 'Password must contain at least one lowercase letter',
        };
    }

    if (!/\d/.test(password)) {
        return {
            isValid: false,
            message: 'Password must contain at least one number',
        };
    }

    if (!/[@$!%*?&]/.test(password)) {
        return {
            isValid: false,
            message: 'Password must contain at least one special character (@$!%*?&)',
        };
    }

    // Check for common passwords (basic check)
    const commonPasswords = [
        'password',
        'password123',
        'admin',
        'admin123',
        '12345678',
        'qwerty',
        'letmein',
    ];
    
    if (commonPasswords.includes(password.toLowerCase())) {
        return {
            isValid: false,
            message: 'Password is too common. Please choose a stronger password',
        };
    }

    return { isValid: true };
};