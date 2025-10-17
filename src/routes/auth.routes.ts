import { Router } from 'express';
import authController from '../controllers/auth.controller';
import passwordController from '../controllers/password.controller';
import { validate } from '../middleware/validate';
import {
    personalInfoSchema,
    businessLocationSchema,
    businessDetailsSchema,
    verificationCodeSchema,
    loginSchema,
    resendCodeSchema,
} from '../validators/auth.schema';
import { authGuard } from '../middleware/authGuard';
import rateLimit from 'express-rate-limit';
import env from '../config/env';

const router = Router();

/**
 * Rate limiter for authentication endpoints
 * Prevents brute force attacks
 */
const authRateLimiter = rateLimit({
    windowMs: env.AUTH_RATE_LIMIT_WINDOW_MS,
    max: env.AUTH_RATE_LIMIT_MAX_REQUESTS,
    message: 'Too many authentication attempts. Please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Registration Flow Routes
 */

// Step 1: Personal Information
router.post(
    '/register/step1',
    authRateLimiter,
    validate(personalInfoSchema),
    authController.registerStep1
);

// Step 2: Business Location
router.post(
    '/register/step2',
    validate(businessLocationSchema),
    authController.registerStep2
);

// Step 3: Business Details
router.post(
    '/register/step3',
    validate(businessDetailsSchema),
    authController.registerStep3
);

// Step 4: Verify Registration
router.post(
    '/verify',
    authRateLimiter,
    validate(verificationCodeSchema),
    authController.verifyRegistration
);

// Resend Verification Code
router.post(
    '/verify/resend',
    authRateLimiter,
    validate(resendCodeSchema),
    authController.resendVerificationCode
);

/**
 * Authentication Routes
 */

// Login
router.post(
    '/login',
    authRateLimiter,
    validate(loginSchema),
    authController.login
);

// Logout (client-side token removal)
router.post('/logout', authController.logout);

// Refresh access token
router.post('/refresh', authController.refreshToken);

// Get current authenticated user
router.get('/me', authGuard, authController.getCurrentUser);

/**
 * Password Management Routes
 */

// Request password reset (forgot password)
router.post(
    '/password/forgot',
    authRateLimiter,
    passwordController.forgotPassword
);

// Verify reset code
router.post(
    '/password/verify-code',
    authRateLimiter,
    passwordController.verifyResetCode
);

// Reset password with code
router.post(
    '/password/reset',
    authRateLimiter,
    passwordController.resetPassword
);

// Change password (authenticated users)
router.post(
    '/password/change',
    authGuard,
    passwordController.changePassword
);

export default router;