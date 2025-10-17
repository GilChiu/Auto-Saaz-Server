import { UserModel, GarageModel } from '../models/user.model';
import { RegistrationSessionModel } from '../models/registration.model';
import { hashPassword, comparePassword, validatePasswordStrength, generateSecurePassword } from '../utils/password';
import { createToken, createRefreshToken, verifyToken } from './token.service';
import verificationService from './verification.service';
import logger from '../config/logger';
import env from '../config/env';
import {
    User,
    UserRole,
    RegistrationStatus,
    GarageProfile,
    VerificationMethod,
} from '../types/garage.types';
import {
    PersonalInfoInput,
    BusinessLocationInput,
    BusinessDetailsInput,
} from '../validators/auth.schema';

export interface AuthResponse {
    success: boolean;
    message: string;
    data?: any;
    status?: number;
}

export interface LoginResponse {
    user: Partial<User>;
    accessToken: string;
    refreshToken: string;
    profile?: {
        fullName?: string;
        email?: string;
        phoneNumber?: string;
        companyLegalName?: string;
        status?: RegistrationStatus;
    };
}

export class AuthService {
    /**
     * Step 1: Collect personal information (NO password, NO user creation)
     */
    async registerStep1(data: PersonalInfoInput): Promise<AuthResponse> {
        try {
            // Check if email already exists
            const existingUser = await UserModel.getUserByEmail(data.email);
            if (existingUser) {
                return {
                    success: false,
                    message: 'Email already registered',
                    status: 409,
                };
            }

            // Create registration session (temporary storage)
            const { sessionId, expiresAt } = await RegistrationSessionModel.createSession({
                fullName: data.fullName,
                email: data.email,
                phoneNumber: data.phoneNumber,
            });

            logger.info(`Registration Step 1 completed for: ${data.email}`);

            return {
                success: true,
                message: 'Personal information saved. Please continue to business location.',
                data: {
                    sessionId,
                    expiresAt,
                    nextStep: 2,
                },
                status: 201,
            };
        } catch (error: any) {
            logger.error('AuthService.registerStep1 error:', error);
            return {
                success: false,
                message: error.message || 'Registration failed',
                status: 500,
            };
        }
    }

    /**
     * Step 2: Update business location
     */
    async registerStep2(data: BusinessLocationInput): Promise<AuthResponse> {
        try {
            // Get session
            const session = await RegistrationSessionModel.getSession(data.sessionId);
            if (!session) {
                return {
                    success: false,
                    message: 'Invalid or expired session',
                    status: 404,
                };
            }

            // Check if Step 1 was completed
            if (session.step_completed < 1) {
                return {
                    success: false,
                    message: 'Please complete Step 1 first',
                    status: 400,
                };
            }

            // Update session with location data
            const updated = await RegistrationSessionModel.updateLocationData(data.sessionId, {
                address: data.address,
                street: data.street,
                state: data.state,
                location: data.location,
                coordinates: data.coordinates,
            });

            if (!updated) {
                return {
                    success: false,
                    message: 'Failed to save business location',
                    status: 500,
                };
            }

            logger.info(`Business location updated for session: ${data.sessionId}`);

            return {
                success: true,
                message: 'Business location saved successfully',
                data: {
                    nextStep: 3,
                },
                status: 200,
            };
        } catch (error: any) {
            logger.error('AuthService.registerStep2 error:', error);
            return {
                success: false,
                message: error.message || 'Failed to save business location',
                status: 500,
            };
        }
    }

    /**
     * Step 3: Update business details and send verification
     */
    async registerStep3(data: BusinessDetailsInput): Promise<AuthResponse> {
        try {
            // Get session
            const session = await RegistrationSessionModel.getSession(data.sessionId);
            if (!session) {
                return {
                    success: false,
                    message: 'Invalid or expired session',
                    status: 404,
                };
            }

            // Check if Step 2 was completed
            if (session.step_completed < 2) {
                return {
                    success: false,
                    message: 'Please complete Step 2 first',
                    status: 400,
                };
            }

            // Update session with business data
            const updated = await RegistrationSessionModel.updateBusinessData(data.sessionId, {
                companyLegalName: data.companyLegalName,
                emiratesIdUrl: data.emiratesIdUrl,
                tradeLicenseNumber: data.tradeLicenseNumber,
                vatCertification: data.vatCertification,
            });

            if (!updated) {
                return {
                    success: false,
                    message: 'Failed to save business details',
                    status: 500,
                };
            }

            // Generate and send OTP to the user's email and phone
            const { code } = await verificationService.createVerificationCode({
                email: session.email,
                phoneNumber: session.phone_number,
                method: VerificationMethod.BOTH,
            });

            // Send verification code via email and SMS
            await Promise.all([
                verificationService.sendEmailVerification(session.email, code),
                verificationService.sendSMSVerification(session.phone_number, code),
            ]);

            logger.info(`Business details updated and OTP sent for session: ${data.sessionId}`);

            return {
                success: true,
                message: 'Business details saved. Verification code sent to your email and phone.',
                data: {
                    nextStep: 4,
                    message: 'Please verify your account with the code sent to complete registration',
                },
                status: 200,
            };
        } catch (error: any) {
            logger.error('AuthService.registerStep3 error:', error);
            return {
                success: false,
                message: error.message || 'Failed to save business details',
                status: 500,
            };
        }
    }

    /**
     * Step 4: Verify code and CREATE USER (auto-generates password, final step)
     */
    async verifyRegistration(
        sessionId: string,
        code: string
    ): Promise<AuthResponse> {
        try {
            // Get session
            const session = await RegistrationSessionModel.getSession(sessionId);
            if (!session) {
                return {
                    success: false,
                    message: 'Invalid or expired session',
                    status: 404,
                };
            }

            // Check if Step 3 was completed
            if (session.step_completed < 3) {
                return {
                    success: false,
                    message: 'Please complete all previous steps first',
                    status: 400,
                };
            }

            // Verify the code
            const verification = await verificationService.verifyCode({
                code,
                email: session.email,
                phoneNumber: session.phone_number,
            });

            if (!verification.success) {
                return {
                    success: false,
                    message: verification.message,
                    status: 400,
                };
            }

            // Auto-generate a secure password
            const generatedPassword = generateSecurePassword(12);
            logger.info(`Generated password for ${session.email}: ${generatedPassword.substring(0, 4)}****`);
            
            // Hash the generated password
            const hashedPassword = await hashPassword(generatedPassword);
            logger.info(`Password hashed successfully for ${session.email}`);

            // NOW Create the user (after verification)
            logger.info(`Attempting to create user for ${session.email}`);
            const user = await UserModel.createUser({
                email: session.email,
                password: hashedPassword,
                role: UserRole.GARAGE_OWNER,
            });

            if (!user) {
                logger.error(`User creation failed for ${session.email} - createUser returned null`);
                return {
                    success: false,
                    message: 'Failed to create user',
                    status: 500,
                };
            }

            logger.info(`User created successfully with ID: ${user.id}`);

            // Update user status to ACTIVE (skip PENDING_VERIFICATION since already verified)
            logger.info(`Updating user status to ACTIVE for ${user.id}`);
            await UserModel.updateUser(user.id, {
                status: RegistrationStatus.ACTIVE,
            });

            // Create garage profile with all collected data
            logger.info(`Creating garage profile for user ${user.id}`);
            const createdProfile = await GarageModel.createProfile(user.id, {
                user_id: user.id,
                full_name: session.full_name,
                email: session.email,
                phone_number: session.phone_number,
                address: session.address,
                street: session.street,
                state: session.state,
                location: session.location,
                coordinates: session.coordinates,
                company_legal_name: session.company_legal_name,
                emirates_id_url: session.emirates_id_url,
                trade_license_number: session.trade_license_number,
                vat_certification: session.vat_certification,
                role: UserRole.GARAGE_OWNER,
                status: RegistrationStatus.ACTIVE,
                is_email_verified: true,
                is_phone_verified: true,
                email_verified_at: new Date(),
                phone_verified_at: new Date(),
            });

            if (!createdProfile) {
                logger.error(`Garage profile creation failed for user ${user.id}`);
            } else {
                logger.info(`Garage profile created successfully for user ${user.id}`);
            }

            // Send the auto-generated password via email
            logger.info(`Sending welcome email to ${session.email}`);
            await this.sendWelcomeEmail(session.email, session.full_name, generatedPassword);
            
            // Delete the registration session
            logger.info(`Deleting registration session ${sessionId}`);
            await RegistrationSessionModel.deleteSession(sessionId);

            // Get created profile
            const profile = await GarageModel.getProfileByUserId(user.id);
            logger.info(`Profile retrieved for user ${user.id}: ${profile ? 'Found' : 'Not Found'}`);

            // Generate tokens for automatic login
            const accessToken = createToken(user.id, user.email, user.role);
            const refreshToken = createRefreshToken(user.id);

            // Remove sensitive data
            const { password: _, ...userWithoutPassword } = user;

            logger.info(`Registration completed and user created: ${session.email}`);

            return {
                success: true,
                message: 'Registration successful! Your password has been sent to your email.',
                data: {
                    user: {
                        ...userWithoutPassword,
                        status: RegistrationStatus.ACTIVE,
                    },
                    profile: profile ? {
                        fullName: profile.full_name,
                        email: profile.email,
                        phoneNumber: profile.phone_number,
                        companyLegalName: profile.company_legal_name,
                        status: profile.status,
                    } : null,
                    accessToken,
                    refreshToken,
                    // In development, include password in response (remove in production)
                    ...(process.env.NODE_ENV === 'development' && { generatedPassword }),
                },
                status: 200,
            };
        } catch (error: any) {
            logger.error('AuthService.verifyRegistration error:', error);
            logger.error('Error stack:', error.stack);
            logger.error('Error details:', JSON.stringify(error, null, 2));
            return {
                success: false,
                message: error.message || 'Verification failed',
                status: 500,
            };
        }
    }

    /**
     * Login
     */
    async login(email: string, password: string, ipAddress?: string): Promise<AuthResponse> {
        try {
            // Get user by email
            const user = await UserModel.getUserByEmail(email);
            if (!user) {
                return {
                    success: false,
                    message: 'Invalid email or password',
                    status: 401,
                };
            }

            // Check if account is locked
            const isLocked = await UserModel.isAccountLocked(user.id);
            if (isLocked) {
                return {
                    success: false,
                    message: 'Account is temporarily locked due to multiple failed login attempts. Please try again later.',
                    status: 423,
                };
            }

            // Verify password
            const isPasswordValid = await comparePassword(password, user.password);
            if (!isPasswordValid) {
                // Increment failed login attempts
                await UserModel.incrementFailedLoginAttempts(user.id);

                // Lock account if max attempts reached
                const currentUser = await UserModel.getUserById(user.id);
                if (currentUser && currentUser.failedLoginAttempts >= env.MAX_LOGIN_ATTEMPTS) {
                    await UserModel.lockAccount(user.id, env.ACCOUNT_LOCKOUT_DURATION_MINUTES);
                    return {
                        success: false,
                        message: 'Account locked due to multiple failed login attempts. Please try again later.',
                        status: 423,
                    };
                }

                return {
                    success: false,
                    message: 'Invalid email or password',
                    status: 401,
                };
            }

            // Check if email verification is required
            if (env.REQUIRE_EMAIL_VERIFICATION && user.status === RegistrationStatus.PENDING_VERIFICATION) {
                return {
                    success: false,
                    message: 'Please verify your email before logging in',
                    status: 403,
                };
            }

            // Reset failed login attempts
            await UserModel.resetFailedLoginAttempts(user.id);

            // Update last login
            await UserModel.updateLastLogin(user.id, ipAddress);

            // Get garage profile
            const profile = await GarageModel.getProfileByUserId(user.id);

            // Generate tokens
            const accessToken = createToken(user.id, user.email, user.role);
            const refreshToken = createRefreshToken(user.id);

            // Remove sensitive data
            const { password: _, ...userWithoutPassword } = user;

            logger.info(`User logged in: ${email}`);

            return {
                success: true,
                message: 'Login successful',
                data: {
                    user: userWithoutPassword,
                    profile: profile ? {
                        fullName: profile.full_name,
                        email: profile.email,
                        phoneNumber: profile.phone_number,
                        companyLegalName: profile.company_legal_name,
                        status: profile.status,
                    } : null,
                    accessToken,
                    refreshToken,
                } as LoginResponse,
                status: 200,
            };
        } catch (error: any) {
            logger.error('AuthService.login error:', error);
            return {
                success: false,
                message: error.message || 'Login failed',
                status: 500,
            };
        }
    }

    /**
     * Resend verification code
     */
    async resendVerificationCode(sessionId: string): Promise<AuthResponse> {
        try {
            // Get session
            const session = await RegistrationSessionModel.getSession(sessionId);
            if (!session) {
                return {
                    success: false,
                    message: 'Invalid or expired session',
                    status: 404,
                };
            }

            // Check if Step 3 was completed
            if (session.step_completed < 3) {
                return {
                    success: false,
                    message: 'Please complete all steps before requesting verification code',
                    status: 400,
                };
            }

            // Resend verification code
            const verification = await verificationService.resendCode({
                email: session.email,
                phoneNumber: session.phone_number,
                method: VerificationMethod.BOTH,
            });

            // Send verification codes
            await verificationService.sendEmailVerification(session.email, verification.code);
            await verificationService.sendSMSVerification(session.phone_number, verification.code);

            logger.info(`Verification code resent for session: ${sessionId}`);

            return {
                success: true,
                message: 'Verification code sent successfully',
                status: 200,
            };
        } catch (error: any) {
            logger.error('AuthService.resendVerificationCode error:', error);
            return {
                success: false,
                message: error.message || 'Failed to resend verification code',
                status: 500,
            };
        }
    }

    /**
     * Request password reset
     */
    async requestPasswordReset(email: string): Promise<AuthResponse> {
        try {
            // Get user by email
            const user = await UserModel.getUserByEmail(email);
            
            // For security, don't reveal if email exists
            if (!user) {
                logger.warn(`Password reset requested for non-existent email: ${email}`);
                return {
                    success: true, // Return success to prevent email enumeration
                    message: 'If an account exists, a reset code has been sent',
                    status: 200,
                };
            }

            // Check if there's a recent reset request (rate limiting)
            const recentCode = await verificationService.getRecentCode(email);
            if (recentCode && recentCode.createdAt) {
                const timeSinceLastRequest = Date.now() - new Date(recentCode.createdAt).getTime();
                const cooldownMs = 60 * 1000; // 1 minute cooldown
                
                if (timeSinceLastRequest < cooldownMs) {
                    return {
                        success: false,
                        message: 'Please wait before requesting another reset code',
                        status: 429,
                    };
                }
            }

            // Generate verification code for password reset
            const { code } = await verificationService.createVerificationCode({
                email,
                userId: user.id,
                method: VerificationMethod.EMAIL,
            });

            // Send reset code via email
            await verificationService.sendPasswordResetEmail(email, code);

            logger.info(`Password reset code sent to: ${email}`);

            return {
                success: true,
                message: 'Reset code sent successfully',
                status: 200,
            };
        } catch (error: any) {
            logger.error('AuthService.requestPasswordReset error:', error);
            return {
                success: false,
                message: 'Failed to process password reset request',
                status: 500,
            };
        }
    }

    /**
     * Verify reset code
     */
    async verifyResetCode(email: string, code: string): Promise<AuthResponse> {
        try {
            const verification = await verificationService.verifyCode({
                code,
                email,
            });

            if (!verification.success) {
                return {
                    success: false,
                    message: verification.message,
                    status: 401,
                };
            }

            // Return a temporary token for password reset
            // Don't mark code as used yet - will be used when password is actually reset
            return {
                success: true,
                message: 'Code verified successfully',
                data: {
                    verified: true,
                },
                status: 200,
            };
        } catch (error: any) {
            logger.error('AuthService.verifyResetCode error:', error);
            return {
                success: false,
                message: 'Failed to verify reset code',
                status: 500,
            };
        }
    }

    /**
     * Reset password with verified code
     */
    async resetPassword(email: string, code: string, newPassword: string): Promise<AuthResponse> {
        try {
            // Get user
            const user = await UserModel.getUserByEmail(email);
            if (!user) {
                return {
                    success: false,
                    message: 'Invalid reset request',
                    status: 404,
                };
            }

            // Verify code again
            const verification = await verificationService.verifyCode({
                code,
                email,
            });

            if (!verification.success) {
                return {
                    success: false,
                    message: 'Invalid or expired reset code',
                    status: 401,
                };
            }

            // Validate password strength
            const passwordValidation = validatePasswordStrength(newPassword);
            if (!passwordValidation.isValid) {
                return {
                    success: false,
                    message: passwordValidation.message || 'Password does not meet security requirements',
                    status: 400,
                };
            }

            // Hash new password
            const hashedPassword = await hashPassword(newPassword);

            // Update password
            const updated = await UserModel.updateUser(user.id, {
                password: hashedPassword,
            });

            if (!updated) {
                return {
                    success: false,
                    message: 'Failed to update password',
                    status: 500,
                };
            }

            // Reset failed login attempts
            await UserModel.resetFailedLoginAttempts(user.id);

            // Send confirmation email
            const emailService = (await import('./email.service')).default;
            await emailService.sendPasswordChangedEmail(email);

            logger.info(`Password reset successful for: ${email}`);

            return {
                success: true,
                message: 'Password reset successfully',
                status: 200,
            };
        } catch (error: any) {
            logger.error('AuthService.resetPassword error:', error);
            return {
                success: false,
                message: 'Failed to reset password',
                status: 500,
            };
        }
    }

    /**
     * Change password (for authenticated users)
     */
    async changePassword(
        userId: string,
        currentPassword: string,
        newPassword: string
    ): Promise<AuthResponse> {
        try {
            // Get user
            const user = await UserModel.getUserById(userId);
            if (!user) {
                return {
                    success: false,
                    message: 'User not found',
                    status: 404,
                };
            }

            // Verify current password
            const isPasswordValid = await comparePassword(currentPassword, user.password);
            if (!isPasswordValid) {
                return {
                    success: false,
                    message: 'Current password is incorrect',
                    status: 401,
                };
            }

            // Check if new password is same as current
            const isSamePassword = await comparePassword(newPassword, user.password);
            if (isSamePassword) {
                return {
                    success: false,
                    message: 'New password must be different from current password',
                    status: 400,
                };
            }

            // Validate new password strength
            const passwordValidation = validatePasswordStrength(newPassword);
            if (!passwordValidation.isValid) {
                return {
                    success: false,
                    message: passwordValidation.message || 'Password does not meet security requirements',
                    status: 400,
                };
            }

            // Hash new password
            const hashedPassword = await hashPassword(newPassword);

            // Update password
            const updated = await UserModel.updateUser(userId, {
                password: hashedPassword,
            });

            if (!updated) {
                return {
                    success: false,
                    message: 'Failed to update password',
                    status: 500,
                };
            }

            // Send confirmation email
            const emailService = (await import('./email.service')).default;
            await emailService.sendPasswordChangedEmail(user.email);

            logger.info(`Password changed for user: ${userId}`);

            return {
                success: true,
                message: 'Password changed successfully',
                status: 200,
            };
        } catch (error: any) {
            logger.error('AuthService.changePassword error:', error);
            return {
                success: false,
                message: 'Failed to change password',
                status: 500,
            };
        }
    }

    /**
     * Refresh access token using refresh token
     */
    async refreshAccessToken(refreshToken: string): Promise<AuthResponse> {
        try {
            // Verify refresh token
            const decoded = verifyToken(refreshToken);
            if (!decoded || !decoded.userId) {
                return {
                    success: false,
                    message: 'Invalid refresh token',
                    status: 401,
                };
            }

            // Get user
            const user = await UserModel.getUserById(decoded.userId);
            if (!user) {
                return {
                    success: false,
                    message: 'User not found',
                    status: 404,
                };
            }

            // Check if user is active
            if (user.status !== RegistrationStatus.ACTIVE) {
                return {
                    success: false,
                    message: 'Account is not active',
                    status: 403,
                };
            }

            // Generate new access token
            const newAccessToken = createToken(user.id, user.email, user.role);

            logger.info(`Access token refreshed for user: ${user.id}`);

            return {
                success: true,
                message: 'Token refreshed successfully',
                data: {
                    accessToken: newAccessToken,
                },
                status: 200,
            };
        } catch (error: any) {
            logger.error('AuthService.refreshAccessToken error:', error);
            return {
                success: false,
                message: 'Failed to refresh token',
                status: 500,
            };
        }
    }

    /**
     * Send welcome email with auto-generated password
     * @private
     */
    private async sendWelcomeEmail(
        email: string,
        fullName: string,
        password: string
    ): Promise<void> {
        try {
            // Import email service dynamically to avoid circular dependencies
            const emailService = (await import('./email.service')).default;
            
            // Send welcome email with password
            const sent = await emailService.sendWelcomeEmail(email, fullName, password);
            
            if (sent) {
                logger.info(`✅ Welcome email sent to ${email}`);
            } else {
                logger.warn(`⚠️  Failed to send welcome email to ${email}`);
            }
            
            // Also log for development/debugging
            logger.info(`[WELCOME EMAIL] Sent to ${email}`);
            logger.info(`[PASSWORD] Auto-generated password for ${email}: ${password}`);
            
            // Console output for development
            console.log('\n' + '='.repeat(80));
            console.log('🎉 WELCOME TO AUTOSAAZ!');
            console.log('='.repeat(80));
            console.log(`👤 Name: ${fullName}`);
            console.log(`📧 Email: ${email}`);
            console.log(`🔑 Password: ${password}`);
            console.log('');
            console.log('📌 IMPORTANT: Save this password securely!');
            console.log('📌 You can change your password after logging in.');
            console.log('='.repeat(80));
            console.log('');
        } catch (error) {
            logger.error('Failed to send welcome email:', error);
            // Don't throw - registration should succeed even if email fails
        }
    }
}

export default new AuthService();