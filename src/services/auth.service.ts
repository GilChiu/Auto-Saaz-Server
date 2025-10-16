import { UserModel, GarageModel } from '../models/user.model';
import { hashPassword, comparePassword, validatePasswordStrength } from '../utils/password';
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
    profile?: Partial<GarageProfile>;
}

export class AuthService {
    /**
     * Step 1: Register personal information
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

            // Validate password strength
            const passwordValidation = validatePasswordStrength(data.password);
            if (!passwordValidation.isValid) {
                return {
                    success: false,
                    message: passwordValidation.message!,
                    status: 400,
                };
            }

            // Hash password
            const hashedPassword = await hashPassword(data.password);

            // Create user
            const user = await UserModel.createUser({
                email: data.email,
                password: hashedPassword,
                role: UserRole.GARAGE_OWNER,
            });

            if (!user) {
                return {
                    success: false,
                    message: 'Failed to create user',
                    status: 500,
                };
            }

            // Create initial garage profile with personal info
            await GarageModel.createProfile(user.id, {
                userId: user.id,
                fullName: data.fullName,
                email: data.email,
                phoneNumber: data.phoneNumber,
                role: UserRole.GARAGE_OWNER,
                status: RegistrationStatus.PENDING_VERIFICATION,
                isEmailVerified: false,
                isPhoneVerified: false,
            });

            // Generate verification code
            const verification = await verificationService.createVerificationCode({
                userId: user.id,
                email: data.email,
                phoneNumber: data.phoneNumber,
                method: VerificationMethod.BOTH,
            });

            // Send verification codes
            await verificationService.sendEmailVerification(data.email, verification.code);
            await verificationService.sendSMSVerification(data.phoneNumber, verification.code);

            logger.info(`User registered (Step 1): ${data.email}`);

            return {
                success: true,
                message: 'Registration successful. Please verify your email or phone number.',
                data: {
                    userId: user.id,
                    email: data.email,
                    phoneNumber: data.phoneNumber,
                    requiresVerification: true,
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
    async registerStep2(userId: string, data: BusinessLocationInput): Promise<AuthResponse> {
        try {
            const user = await UserModel.getUserById(userId);
            if (!user) {
                return {
                    success: false,
                    message: 'User not found',
                    status: 404,
                };
            }

            // Update garage profile with location info
            await GarageModel.updateProfile(userId, {
                address: data.address,
                street: data.street,
                state: data.state,
                location: data.location,
                coordinates: data.coordinates,
            });

            logger.info(`Business location updated for user: ${userId}`);

            return {
                success: true,
                message: 'Business location saved successfully',
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
     * Step 3: Update business details
     */
    async registerStep3(userId: string, data: BusinessDetailsInput): Promise<AuthResponse> {
        try {
            const user = await UserModel.getUserById(userId);
            if (!user) {
                return {
                    success: false,
                    message: 'User not found',
                    status: 404,
                };
            }

            // Update garage profile with business details
            await GarageModel.updateProfile(userId, {
                companyLegalName: data.companyLegalName,
                emiratesIdUrl: data.emiratesIdUrl,
                tradeLicenseNumber: data.tradeLicenseNumber,
                vatCertification: data.vatCertification,
            });

            logger.info(`Business details updated for user: ${userId}`);

            return {
                success: true,
                message: 'Business details saved successfully',
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
     * Step 4: Verify code and activate account
     */
    async verifyRegistration(
        code: string,
        email?: string,
        phoneNumber?: string
    ): Promise<AuthResponse> {
        try {
            const verification = await verificationService.verifyCode({
                code,
                email,
                phoneNumber,
            });

            if (!verification.success) {
                return {
                    success: false,
                    message: verification.message,
                    status: 400,
                };
            }

            if (!verification.userId) {
                return {
                    success: false,
                    message: 'Invalid verification code',
                    status: 400,
                };
            }

            // Update user status to verified
            await UserModel.updateUser(verification.userId, {
                status: RegistrationStatus.VERIFIED,
            });

            // Update profile verification status
            const profile = await GarageModel.getProfileByUserId(verification.userId);
            if (profile) {
                await GarageModel.updateProfile(verification.userId, {
                    isEmailVerified: email ? true : profile.isEmailVerified,
                    isPhoneVerified: phoneNumber ? true : profile.isPhoneVerified,
                    emailVerifiedAt: email ? new Date() : profile.emailVerifiedAt,
                    phoneVerifiedAt: phoneNumber ? new Date() : profile.phoneVerifiedAt,
                    status: RegistrationStatus.ACTIVE,
                });
            }

            logger.info(`User verified: ${verification.userId}`);

            return {
                success: true,
                message: 'Verification successful. Your account is now active.',
                status: 200,
            };
        } catch (error: any) {
            logger.error('AuthService.verifyRegistration error:', error);
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
                        fullName: profile.fullName,
                        email: profile.email,
                        phoneNumber: profile.phoneNumber,
                        companyLegalName: profile.companyLegalName,
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
    async resendVerificationCode(email?: string, phoneNumber?: string): Promise<AuthResponse> {
        try {
            if (!email && !phoneNumber) {
                return {
                    success: false,
                    message: 'Email or phone number is required',
                    status: 400,
                };
            }

            let user: User | null = null;
            
            if (email) {
                user = await UserModel.getUserByEmail(email);
            }

            if (!user) {
                return {
                    success: false,
                    message: 'User not found',
                    status: 404,
                };
            }

            const method = email && phoneNumber 
                ? VerificationMethod.BOTH 
                : email 
                ? VerificationMethod.EMAIL 
                : VerificationMethod.PHONE;

            const verification = await verificationService.resendCode({
                email,
                phoneNumber,
                method,
            });

            if (email) {
                await verificationService.sendEmailVerification(email, verification.code);
            }
            if (phoneNumber) {
                await verificationService.sendSMSVerification(phoneNumber, verification.code);
            }

            logger.info(`Verification code resent to: ${email || phoneNumber}`);

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
}

export default new AuthService();