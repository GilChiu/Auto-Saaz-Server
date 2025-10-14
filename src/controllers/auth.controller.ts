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
     * Step 1: Register personal information
     * POST /api/auth/register/step1
     */
    registerStep1 = asyncHandler(async (req: Request, res: Response) => {
        const { fullName, email, phoneNumber, password } = req.body;

        const result = await authService.registerStep1({
            fullName,
            email,
            phoneNumber,
            password,
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
     * Step 2: Update business location
     * POST /api/auth/register/step2
     */
    registerStep2 = asyncHandler(async (req: Request, res: Response) => {
        const { userId, address, street, state, location, coordinates } = req.body;

        if (!userId) {
            return badRequestResponse(res, 'User ID is required');
        }

        const result = await authService.registerStep2(userId, {
            address,
            street,
            state,
            location,
            coordinates,
        });

        if (!result.success) {
            return badRequestResponse(res, result.message);
        }

        logger.info(`Step 2 registration completed for user: ${userId}`);
        return successResponse(res, {}, result.message);
    });

    /**
     * Step 3: Update business details
     * POST /api/auth/register/step3
     */
    registerStep3 = asyncHandler(async (req: Request, res: Response) => {
        const { userId, companyLegalName, emiratesIdUrl, tradeLicenseNumber, vatCertification } =
            req.body;

        if (!userId) {
            return badRequestResponse(res, 'User ID is required');
        }

        const result = await authService.registerStep3(userId, {
            companyLegalName,
            emiratesIdUrl,
            tradeLicenseNumber,
            vatCertification,
        });

        if (!result.success) {
            return badRequestResponse(res, result.message);
        }

        logger.info(`Step 3 registration completed for user: ${userId}`);
        return successResponse(res, {}, result.message);
    });

    /**
     * Step 4: Verify registration code
     * POST /api/auth/verify
     */
    verifyRegistration = asyncHandler(async (req: Request, res: Response) => {
        const { code, email, phoneNumber } = req.body;

        if (!code) {
            return badRequestResponse(res, 'Verification code is required');
        }

        if (!email && !phoneNumber) {
            return badRequestResponse(res, 'Email or phone number is required');
        }

        const result = await authService.verifyRegistration(code, email, phoneNumber);

        if (!result.success) {
            return badRequestResponse(res, result.message);
        }

        logger.info(`Verification successful for: ${email || phoneNumber}`);
        return successResponse(res, {}, result.message);
    });

    /**
     * Resend verification code
     * POST /api/auth/verify/resend
     */
    resendVerificationCode = asyncHandler(async (req: Request, res: Response) => {
        const { email, phoneNumber } = req.body;

        if (!email && !phoneNumber) {
            return badRequestResponse(res, 'Email or phone number is required');
        }

        const result = await authService.resendVerificationCode(email, phoneNumber);

        if (!result.success) {
            if (result.status === 404) {
                return badRequestResponse(res, result.message);
            }
            return badRequestResponse(res, result.message);
        }

        logger.info(`Verification code resent to: ${email || phoneNumber}`);
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