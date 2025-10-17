import { Request, Response } from 'express';
import authService from '../services/auth.service';
import { asyncHandler } from '../middleware/asyncHandler';
import {
    successResponse,
    createdResponse,
    badRequestResponse,
    unauthorizedResponse,
    conflictResponse,
} from '../utils/responses';
import logger from '../config/logger';

export class AuthController {
    /**
     * Simple registration endpoint for development/testing
     * POST /api/auth/register
     */
    simpleRegister = asyncHandler(async (req: Request, res: Response) => {
        const { fullName, email, phoneNumber, password } = req.body;

        // Basic validation
        if (!fullName || !email || !phoneNumber) {
            return badRequestResponse(res, 'Full name, email, and phone number are required');
        }

        try {
            // Step 1: Create session
            const step1Result = await authService.registerStep1({
                fullName,
                email,
                phoneNumber,
            });

            if (!step1Result.success) {
                if (step1Result.status === 409) {
                    return conflictResponse(res, step1Result.message);
                }
                return badRequestResponse(res, step1Result.message);
            }

            const sessionId = step1Result.data.sessionId;

            // Step 2: Add dummy business location
            const step2Result = await authService.registerStep2({
                sessionId,
                address: 'Dubai, UAE',
                street: 'Main Street',
                state: 'Dubai',
                location: 'Dubai',
                coordinates: { latitude: 25.2048, longitude: 55.2708 }
            });

            if (!step2Result.success) {
                return badRequestResponse(res, step2Result.message);
            }

            // Step 3: Add dummy business details
            const step3Result = await authService.registerStep3({
                sessionId,
                companyLegalName: fullName + ' Garage',
                emiratesIdUrl: '',
                tradeLicenseNumber: 'DEMO-' + Date.now(),
                vatCertification: ''
            });

            if (!step3Result.success) {
                return badRequestResponse(res, step3Result.message);
            }

            // Step 4: Auto-verify with dummy code (for development)
            const verifyResult = await authService.verifyRegistration(sessionId, '123456');

            if (!verifyResult.success) {
                return badRequestResponse(res, verifyResult.message);
            }

            logger.info(`Simple registration completed for: ${email}`);
            return createdResponse(res, verifyResult.data, 'Registration successful');

        } catch (error: any) {
            logger.error('Simple registration error:', error);
            return badRequestResponse(res, 'Registration failed');
        }
    });

    /**
     * Step 1: Collect personal information (NO password)
     * POST /api/auth/register/step1
     */
    registerStep1 = asyncHandler(async (req: Request, res: Response) => {
        const { fullName, email, phoneNumber } = req.body;

        const result = await authService.registerStep1({
            fullName,
            email,
            phoneNumber,
        });

        if (!result.success) {
            if (result.status === 409) {
                return conflictResponse(res, result.message);
            }
            return badRequestResponse(res, result.message);
        }

        logger.info(`Step 1 registration completed for: ${email}`);
        return createdResponse(res, result.data, result.message);
    });

    /**
     * Step 2: Collect business location
     * POST /api/auth/register/step2
     */
    registerStep2 = asyncHandler(async (req: Request, res: Response) => {
        const result = await authService.registerStep2(req.body);

        if (!result.success) {
            return badRequestResponse(res, result.message);
        }

        logger.info(`Step 2 registration completed for session: ${req.body.sessionId}`);
        return successResponse(res, result.data, result.message);
    });

    /**
     * Step 3: Collect business details and send verification
     * POST /api/auth/register/step3
     */
    registerStep3 = asyncHandler(async (req: Request, res: Response) => {
        const result = await authService.registerStep3(req.body);

        if (!result.success) {
            return badRequestResponse(res, result.message);
        }

        logger.info(`Step 3 registration completed for session: ${req.body.sessionId}`);
        return successResponse(res, result.data, result.message);
    });

    /**
    /**
     * Step 4: Verify registration code and create user (auto-generates password)
     * POST /api/auth/verify
     */
    verifyRegistration = asyncHandler(async (req: Request, res: Response) => {
        const { sessionId, code } = req.body;

        if (!sessionId || !code) {
            return badRequestResponse(res, 'Session ID and verification code are required');
        }

        const result = await authService.verifyRegistration(sessionId, code);

        if (!result.success) {
            return badRequestResponse(res, result.message);
        }

        logger.info(`Verification successful and user created for session: ${sessionId}`);
        return successResponse(res, result.data, result.message);
    });

    /**
     * Resend verification code
     * POST /api/auth/verify/resend
     */
    resendVerificationCode = asyncHandler(async (req: Request, res: Response) => {
        const { sessionId } = req.body;

        if (!sessionId) {
            return badRequestResponse(res, 'Session ID is required');
        }

        const result = await authService.resendVerificationCode(sessionId);

        if (!result.success) {
            if (result.status === 404) {
                return badRequestResponse(res, result.message);
            }
            return badRequestResponse(res, result.message);
        }

        logger.info(`Verification code resent for session: ${sessionId}`);
        return successResponse(res, {}, result.message);
    });

    /**
     * Login
     * POST /api/auth/login
     */
    login = asyncHandler(async (req: Request, res: Response) => {
        const { email, password } = req.body;
        const ipAddress = req.ip || req.headers['x-forwarded-for']?.toString() || 'unknown';

        const result = await authService.login(email, password, ipAddress);

        if (!result.success) {
            if (result.status === 401 || result.status === 403 || result.status === 423) {
                return unauthorizedResponse(res, result.message);
            }
            return badRequestResponse(res, result.message);
        }

        logger.info(`User logged in: ${email} from IP: ${ipAddress}`);
        return successResponse(res, result.data, result.message);
    });

    /**
     * Logout (client-side token removal)
     * POST /api/auth/logout
     */
    logout = asyncHandler(async (req: Request, res: Response) => {
        // In a JWT-based system, logout is typically handled client-side
        // by removing the token. However, you can implement token blacklisting
        // if needed.
        
        logger.info(`User logged out: ${req.body.userId || 'unknown'}`);
        return successResponse(res, {}, 'Logout successful');
    });

    /**
     * Get current user (requires authentication)
     * GET /api/auth/me
     */
    getCurrentUser = asyncHandler(async (req: Request, res: Response) => {
        // This would be implemented with authGuard middleware
        // that attaches user to req.user
        const user = (req as any).user;

        if (!user) {
            return unauthorizedResponse(res, 'Not authenticated');
        }

        return successResponse(res, user, 'User retrieved successfully');
    });

    /**
     * Get user profile with additional details
     * GET /api/auth/profile
     */
    getUserProfile = asyncHandler(async (req: Request, res: Response) => {
        const user = (req as any).user;

        if (!user) {
            return unauthorizedResponse(res, 'Not authenticated');
        }

        try {
            const result = await authService.getUserProfile(user.id);

            if (!result.success) {
                return badRequestResponse(res, result.message);
            }

            return successResponse(res, result.data, 'Profile retrieved successfully');
        } catch (error) {
            logger.error('AuthController.getUserProfile error:', error);
            return badRequestResponse(res, 'Failed to retrieve profile');
        }
    });

    /**
     * Update user profile
     * PUT /api/auth/profile
     */
    updateUserProfile = asyncHandler(async (req: Request, res: Response) => {
        const user = (req as any).user;
        const { email, phone, password, language, timezone } = req.body;

        if (!user) {
            return unauthorizedResponse(res, 'Not authenticated');
        }

        try {
            const result = await authService.updateUserProfile(user.id, {
                email,
                phone,
                password,
                language,
                timezone
            });

            if (!result.success) {
                return badRequestResponse(res, result.message);
            }

            return successResponse(res, result.data, 'Profile updated successfully');
        } catch (error) {
            logger.error('AuthController.updateUserProfile error:', error);
            return badRequestResponse(res, 'Failed to update profile');
        }
    });

    /**
     * Get user password (development only)
     * GET /api/auth/password
     */
    getUserPassword = asyncHandler(async (req: Request, res: Response) => {
        const user = (req as any).user;

        if (!user) {
            logger.warn('getUserPassword: No user in request');
            return unauthorizedResponse(res, 'Not authenticated');
        }

        logger.info(`getUserPassword: Getting password for user ${user.id} (${user.email})`);

        try {
            const result = await authService.getUserPassword(user.id);

            if (!result.success) {
                logger.warn(`getUserPassword failed: ${result.message}`);
                if (result.status === 404) {
                    return unauthorizedResponse(res, result.message);
                }
                return badRequestResponse(res, result.message);
            }

            logger.info(`getUserPassword: Success for user ${user.email}`);
            return successResponse(res, result.data, result.message);
        } catch (error: any) {
            logger.error('AuthController.getUserPassword error:', error);
            logger.error('Error details:', {
                message: error.message,
                stack: error.stack,
                userId: user.id
            });
            return badRequestResponse(res, 'Failed to retrieve password');
        }
    });

    /**
     * Refresh access token
     * POST /api/auth/refresh
     */
    refreshToken = asyncHandler(async (req: Request, res: Response) => {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return badRequestResponse(res, 'Refresh token is required');
        }

        const result = await authService.refreshAccessToken(refreshToken);

        if (!result.success) {
            return unauthorizedResponse(res, result.message);
        }

        logger.info(`Access token refreshed`);
        return successResponse(res, result.data, result.message);
    });
}

export default new AuthController();