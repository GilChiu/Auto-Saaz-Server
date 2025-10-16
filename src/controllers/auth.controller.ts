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
}

export default new AuthController();