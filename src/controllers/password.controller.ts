import { Request, Response } from 'express';
import authService from '../services/auth.service';
import { asyncHandler } from '../middleware/asyncHandler';
import {
    successResponse,
    badRequestResponse,
    unauthorizedResponse,
    tooManyRequestsResponse,
} from '../utils/responses';
import logger from '../config/logger';

export class PasswordResetController {
    /**
     * Request password reset (sends reset code to email)
     * POST /api/auth/password/forgot
     */
    forgotPassword = asyncHandler(async (req: Request, res: Response) => {
        const { email } = req.body;

        if (!email) {
            return badRequestResponse(res, 'Email is required');
        }

        const result = await authService.requestPasswordReset(email);

        if (!result.success) {
            // For security, always return success even if email doesn't exist
            // This prevents email enumeration attacks
            if (result.status === 404) {
                return successResponse(
                    res,
                    {},
                    'If an account with that email exists, a password reset code has been sent.'
                );
            }
            if (result.status === 429) {
                return tooManyRequestsResponse(res, result.message);
            }
            return badRequestResponse(res, result.message);
        }

        logger.info(`Password reset requested for email: ${email}`);
        return successResponse(
            res,
            {},
            'If an account with that email exists, a password reset code has been sent.'
        );
    });

    /**
     * Verify reset code
     * POST /api/auth/password/verify-code
     */
    verifyResetCode = asyncHandler(async (req: Request, res: Response) => {
        const { email, code } = req.body;

        if (!email || !code) {
            return badRequestResponse(res, 'Email and code are required');
        }

        const result = await authService.verifyResetCode(email, code);

        if (!result.success) {
            return unauthorizedResponse(res, result.message);
        }

        logger.info(`Reset code verified for email: ${email}`);
        return successResponse(res, result.data, 'Code verified successfully');
    });

    /**
     * Reset password with verified code
     * POST /api/auth/password/reset
     */
    resetPassword = asyncHandler(async (req: Request, res: Response) => {
        const { email, code, newPassword } = req.body;

        if (!email || !code || !newPassword) {
            return badRequestResponse(res, 'Email, code, and new password are required');
        }

        const result = await authService.resetPassword(email, code, newPassword);

        if (!result.success) {
            return badRequestResponse(res, result.message);
        }

        logger.info(`Password reset successful for email: ${email}`);
        return successResponse(res, {}, 'Password reset successfully. You can now login with your new password.');
    });

    /**
     * Change password (requires authentication)
     * POST /api/auth/password/change
     */
    changePassword = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).user.userId;
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return badRequestResponse(res, 'Current password and new password are required');
        }

        const result = await authService.changePassword(userId, currentPassword, newPassword);

        if (!result.success) {
            if (result.status === 401) {
                return unauthorizedResponse(res, result.message);
            }
            return badRequestResponse(res, result.message);
        }

        logger.info(`Password changed for user: ${userId}`);
        return successResponse(res, {}, 'Password changed successfully');
    });
}

export default new PasswordResetController();
