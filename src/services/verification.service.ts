import supabase from '../config/supabase';
import env from '../config/env';
import logger from '../config/logger';
import { VerificationCode, VerificationMethod } from '../types/garage.types';
import crypto from 'crypto';

export class VerificationService {
    /**
     * Generate a random OTP code
     */
    private generateOTP(): string {
        const length = env.OTP_LENGTH;
        const digits = '0123456789';
        let otp = '';
        
        for (let i = 0; i < length; i++) {
            const randomIndex = crypto.randomInt(0, digits.length);
            otp += digits[randomIndex];
        }
        
        return otp;
    }

    /**
     * Create and store verification code
     */
    async createVerificationCode(data: {
        userId?: string;
        email?: string;
        phoneNumber?: string;
        method: VerificationMethod;
    }): Promise<{ code: string; expiresAt: Date }> {
        try {
            const code = this.generateOTP();
            const expiresAt = new Date();
            expiresAt.setMinutes(expiresAt.getMinutes() + env.OTP_EXPIRY_MINUTES);

            const { error } = await supabase.from('verification_codes').insert([
                {
                    user_id: data.userId,
                    email: data.email?.toLowerCase(),
                    phone_number: data.phoneNumber,
                    code,
                    method: data.method,
                    attempts: 0,
                    is_used: false,
                    expires_at: expiresAt.toISOString(),
                    created_at: new Date().toISOString(),
                },
            ]);

            if (error) {
                logger.error('Error creating verification code:', error);
                throw new Error('Failed to create verification code');
            }

            logger.info(`Verification code created for ${data.email || data.phoneNumber}`);
            return { code, expiresAt };
        } catch (error) {
            logger.error('VerificationService.createVerificationCode error:', error);
            throw error;
        }
    }

    /**
     * Verify code
     */
    async verifyCode(data: {
        code: string;
        email?: string;
        phoneNumber?: string;
    }): Promise<{ success: boolean; message: string; userId?: string }> {
        try {
            // Find the verification code
            const query = supabase
                .from('verification_codes')
                .select('*')
                .eq('code', data.code)
                .eq('is_used', false);

            if (data.email) {
                query.eq('email', data.email.toLowerCase());
            }
            if (data.phoneNumber) {
                query.eq('phone_number', data.phoneNumber);
            }

            const { data: verificationCode, error } = await query.order('created_at', { ascending: false }).limit(1).single();

            if (error || !verificationCode) {
                return {
                    success: false,
                    message: 'Invalid verification code',
                };
            }

            // Check if code is expired
            const now = new Date();
            const expiresAt = new Date(verificationCode.expires_at);
            
            if (now > expiresAt) {
                return {
                    success: false,
                    message: 'Verification code has expired',
                };
            }

            // Check attempts
            if (verificationCode.attempts >= env.MAX_OTP_ATTEMPTS) {
                return {
                    success: false,
                    message: 'Maximum verification attempts exceeded',
                };
            }

            // Mark as used
            await supabase
                .from('verification_codes')
                .update({ is_used: true })
                .eq('id', verificationCode.id);

            logger.info(`Verification code validated for ${data.email || data.phoneNumber}`);
            
            return {
                success: true,
                message: 'Verification successful',
                userId: verificationCode.user_id,
            };
        } catch (error) {
            logger.error('VerificationService.verifyCode error:', error);
            return {
                success: false,
                message: 'Verification failed',
            };
        }
    }

    /**
     * Increment verification attempt
     */
    async incrementAttempt(code: string): Promise<void> {
        try {
            const { data: verificationCode } = await supabase
                .from('verification_codes')
                .select('*')
                .eq('code', code)
                .single();

            if (verificationCode) {
                await supabase
                    .from('verification_codes')
                    .update({ attempts: verificationCode.attempts + 1 })
                    .eq('id', verificationCode.id);
            }
        } catch (error) {
            logger.error('VerificationService.incrementAttempt error:', error);
        }
    }

    /**
     * Resend verification code
     */
    async resendCode(data: {
        email?: string;
        phoneNumber?: string;
        method: VerificationMethod;
    }): Promise<{ code: string; expiresAt: Date }> {
        try {
            // Invalidate old codes
            const query = supabase
                .from('verification_codes')
                .update({ is_used: true });

            if (data.email) {
                query.eq('email', data.email.toLowerCase());
            }
            if (data.phoneNumber) {
                query.eq('phone_number', data.phoneNumber);
            }

            await query.eq('is_used', false);

            // Create new code
            return await this.createVerificationCode(data);
        } catch (error) {
            logger.error('VerificationService.resendCode error:', error);
            throw error;
        }
    }

    /**
     * Send verification code via email
     */
    async sendEmailVerification(email: string, code: string, name?: string): Promise<boolean> {
        try {
            // Import email service dynamically to avoid circular dependencies
            const emailService = (await import('./email.service')).default;
            
            // Send OTP email
            const sent = await emailService.sendOTPEmail(email, code, name);
            
            if (sent) {
                logger.info(`✅ Verification email sent to ${email}`);
            } else {
                logger.warn(`⚠️  Failed to send verification email to ${email}`);
            }
            
            // Also log for development/debugging
            logger.info(`[EMAIL] Verification code for ${email}: ${code}`);
            
            return sent;
        } catch (error) {
            logger.error('VerificationService.sendEmailVerification error:', error);
            return false;
        }
    }

    /**
     * Send verification code via SMS (placeholder - implement with SMS API)
     */
    async sendSMSVerification(phoneNumber: string, code: string): Promise<boolean> {
        try {
            // TODO: Implement SMS sending with SMS API (Twilio, AWS SNS, etc.)
            logger.info(`[SMS] Verification code for ${phoneNumber}: ${code}`);
            
            // In development, you might want to return the code
            if (env.NODE_ENV === 'development') {
                console.log(`📱 OTP for ${phoneNumber}: ${code}`);
            }
            
            return true;
        } catch (error) {
            logger.error('VerificationService.sendSMSVerification error:', error);
            return false;
        }
    }

    /**
     * Clean up expired verification codes (run as cron job)
     */
    async cleanupExpiredCodes(): Promise<number> {
        try {
            const now = new Date().toISOString();
            
            const { count, error } = await supabase
                .from('verification_codes')
                .delete()
                .lt('expires_at', now);

            if (error) {
                logger.error('Error cleaning up expired codes:', error);
                return 0;
            }

            logger.info(`Cleaned up ${count} expired verification codes`);
            return count || 0;
        } catch (error) {
            logger.error('VerificationService.cleanupExpiredCodes error:', error);
            return 0;
        }
    }
}

export default new VerificationService();
