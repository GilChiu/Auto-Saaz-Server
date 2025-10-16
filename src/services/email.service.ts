import nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';
import logger from '../config/logger';
import env from '../config/env';

/**
 * Email Service for sending transactional emails
 * Supports Gmail, SendGrid, AWS SES, and other SMTP providers
 */
class EmailService {
    private transporter: Mail | null = null;

    constructor() {
        this.initializeTransporter();
    }

    /**
     * Initialize email transporter based on environment configuration
     */
    private initializeTransporter(): void {
        try {
            const emailConfig = {
                host: process.env.SMTP_HOST || 'smtp.gmail.com',
                port: parseInt(process.env.SMTP_PORT || '587'),
                secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS,
                },
            };

            // Only initialize if SMTP credentials are provided
            if (emailConfig.auth.user && emailConfig.auth.pass) {
                this.transporter = nodemailer.createTransport(emailConfig);
                logger.info('✅ Email service initialized successfully');
                
                // Verify connection
                this.transporter.verify((error, success) => {
                    if (error) {
                        logger.error('❌ Email service verification failed:', error);
                        this.transporter = null;
                    } else {
                        logger.info('✅ Email service verified and ready to send emails');
                    }
                });
            } else {
                logger.warn('⚠️  Email service not initialized - SMTP credentials missing');
                logger.warn('⚠️  Emails will be logged to console only');
            }
        } catch (error) {
            logger.error('❌ Failed to initialize email service:', error);
            this.transporter = null;
        }
    }

    /**
     * Send email (generic method)
     */
    private async sendMail(options: Mail.Options): Promise<boolean> {
        try {
            // If transporter is not initialized, just log
            if (!this.transporter) {
                logger.info('📧 [EMAIL - NOT SENT] To:', options.to);
                logger.info('📧 [EMAIL - NOT SENT] Subject:', options.subject);
                console.log('\n' + '='.repeat(80));
                console.log('📧 EMAIL (Console Mode - SMTP not configured)');
                console.log('='.repeat(80));
                console.log('To:', options.to);
                console.log('Subject:', options.subject);
                console.log('Content:', options.text || 'See HTML content');
                console.log('='.repeat(80));
                console.log('');
                return true;
            }

            const info = await this.transporter.sendMail({
                from: process.env.SMTP_FROM || `"AutoSaaz" <${process.env.SMTP_USER}>`,
                ...options,
            });

            logger.info(`✅ Email sent successfully: ${info.messageId}`);
            logger.info(`📧 To: ${options.to}`);
            return true;
        } catch (error) {
            logger.error('❌ Failed to send email:', error);
            return false;
        }
    }

    /**
     * Send OTP verification code email
     */
    async sendOTPEmail(email: string, code: string, name?: string): Promise<boolean> {
        const subject = 'Your AutoSaaz Verification Code';
        const html = this.generateOTPEmailTemplate(code, name);
        const text = `Your AutoSaaz verification code is: ${code}\n\nThis code will expire in 15 minutes.\n\nIf you didn't request this code, please ignore this email.`;

        return await this.sendMail({
            to: email,
            subject,
            text,
            html,
        });
    }

    /**
     * Send welcome email with auto-generated password
     */
    async sendWelcomeEmail(email: string, name: string, password: string): Promise<boolean> {
        const subject = 'Welcome to AutoSaaz - Your Account Details';
        const html = this.generateWelcomeEmailTemplate(name, email, password);
        const text = `Welcome to AutoSaaz, ${name}!\n\nYour account has been created successfully.\n\nEmail: ${email}\nPassword: ${password}\n\nPlease keep this password secure and change it after your first login.\n\nLogin at: ${process.env.APP_URL || 'https://auto-saaz-garage-client.vercel.app'}\n\nBest regards,\nAutoSaaz Team`;

        return await this.sendMail({
            to: email,
            subject,
            text,
            html,
        });
    }

    /**
     * Send password reset email
     */
    async sendPasswordResetEmail(email: string, name: string, resetToken: string): Promise<boolean> {
        const resetUrl = `${process.env.APP_URL || 'https://auto-saaz-garage-client.vercel.app'}/reset-password?token=${resetToken}`;
        const subject = 'Reset Your AutoSaaz Password';
        const html = this.generatePasswordResetTemplate(name, resetUrl);
        const text = `Hi ${name},\n\nYou requested to reset your password. Click the link below to reset it:\n\n${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you didn't request this, please ignore this email.\n\nBest regards,\nAutoSaaz Team`;

        return await this.sendMail({
            to: email,
            subject,
            text,
            html,
        });
    }

    /**
     * OTP Email Template
     */
    private generateOTPEmailTemplate(code: string, name?: string): string {
        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verification Code</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #FF6B35 0%, #FF8A5B 100%); padding: 40px 20px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">🚗 AutoSaaz</h1>
                            <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">One Stop Auto Shop</p>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            ${name ? `<h2 style="color: #333333; margin: 0 0 20px 0; font-size: 22px;">Hi ${name},</h2>` : ''}
                            <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                                Thank you for registering with AutoSaaz. Use the verification code below to complete your registration:
                            </p>
                            
                            <!-- OTP Code -->
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding: 20px; background-color: #f8f8f8; border-radius: 8px; border: 2px dashed #FF6B35;">
                                        <div style="font-size: 36px; font-weight: bold; color: #FF6B35; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                                            ${code}
                                        </div>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0; text-align: center;">
                                ⏱️ This code will expire in <strong>15 minutes</strong>
                            </p>
                            
                            <div style="margin-top: 30px; padding-top: 30px; border-top: 1px solid #eeeeee;">
                                <p style="color: #999999; font-size: 13px; line-height: 1.6; margin: 0;">
                                    If you didn't request this code, please ignore this email or contact our support team.
                                </p>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8f8f8; padding: 30px; text-align: center; border-top: 1px solid #eeeeee;">
                            <p style="color: #999999; font-size: 12px; margin: 0 0 10px 0;">
                                © ${new Date().getFullYear()} AutoSaaz. All rights reserved.
                            </p>
                            <p style="color: #999999; font-size: 12px; margin: 0;">
                                Dubai, United Arab Emirates
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `;
    }

    /**
     * Welcome Email Template
     */
    private generateWelcomeEmailTemplate(name: string, email: string, password: string): string {
        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to AutoSaaz</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #FF6B35 0%, #FF8A5B 100%); padding: 40px 20px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 600;">🎉 Welcome to AutoSaaz!</h1>
                            <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Your account is ready</p>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 22px;">Hi ${name},</h2>
                            <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                                Congratulations! Your AutoSaaz account has been created successfully. Below are your login credentials:
                            </p>
                            
                            <!-- Credentials Box -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                                <tr>
                                    <td style="padding: 25px; background-color: #f8f8f8; border-radius: 8px; border-left: 4px solid #FF6B35;">
                                        <p style="margin: 0 0 15px 0; color: #666666; font-size: 14px;">
                                            <strong style="color: #333333;">📧 Email:</strong><br/>
                                            <span style="font-size: 16px; color: #FF6B35;">${email}</span>
                                        </p>
                                        <p style="margin: 0; color: #666666; font-size: 14px;">
                                            <strong style="color: #333333;">🔑 Password:</strong><br/>
                                            <span style="font-size: 18px; font-family: 'Courier New', monospace; color: #333333; background-color: #ffffff; padding: 8px 12px; border-radius: 4px; display: inline-block; margin-top: 8px;">${password}</span>
                                        </p>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Security Notice -->
                            <div style="padding: 20px; background-color: #fff3e0; border-radius: 8px; border-left: 4px solid #ff9800; margin-bottom: 30px;">
                                <p style="margin: 0; color: #e65100; font-size: 14px; line-height: 1.6;">
                                    <strong>🔒 Security Notice:</strong><br/>
                                    Please save this password securely. We recommend changing your password after your first login for security purposes.
                                </p>
                            </div>
                            
                            <!-- CTA Button -->
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding: 20px 0;">
                                        <a href="${process.env.APP_URL || 'https://auto-saaz-garage-client.vercel.app'}/login" 
                                           style="display: inline-block; padding: 15px 40px; background-color: #FF6B35; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600; box-shadow: 0 2px 4px rgba(255,107,53,0.3);">
                                            Login to Your Account
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <div style="margin-top: 30px; padding-top: 30px; border-top: 1px solid #eeeeee;">
                                <p style="color: #999999; font-size: 13px; line-height: 1.6; margin: 0;">
                                    Need help? Contact our support team at <a href="mailto:support@autosaaz.com" style="color: #FF6B35;">support@autosaaz.com</a>
                                </p>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8f8f8; padding: 30px; text-align: center; border-top: 1px solid #eeeeee;">
                            <p style="color: #999999; font-size: 12px; margin: 0 0 10px 0;">
                                © ${new Date().getFullYear()} AutoSaaz. All rights reserved.
                            </p>
                            <p style="color: #999999; font-size: 12px; margin: 0;">
                                Dubai, United Arab Emirates
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `;
    }

    /**
     * Password Reset Email Template
     */
    private generatePasswordResetTemplate(name: string, resetUrl: string): string {
        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #FF6B35 0%, #FF8A5B 100%); padding: 40px 20px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">🔒 Password Reset</h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 22px;">Hi ${name},</h2>
                            <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                                We received a request to reset your password. Click the button below to create a new password:
                            </p>
                            
                            <!-- CTA Button -->
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding: 20px 0;">
                                        <a href="${resetUrl}" 
                                           style="display: inline-block; padding: 15px 40px; background-color: #FF6B35; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600; box-shadow: 0 2px 4px rgba(255,107,53,0.3);">
                                            Reset Password
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0; text-align: center;">
                                ⏱️ This link will expire in <strong>1 hour</strong>
                            </p>
                            
                            <div style="margin-top: 30px; padding-top: 30px; border-top: 1px solid #eeeeee;">
                                <p style="color: #999999; font-size: 13px; line-height: 1.6; margin: 0;">
                                    If you didn't request this password reset, please ignore this email or contact our support team if you have concerns.
                                </p>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8f8f8; padding: 30px; text-align: center; border-top: 1px solid #eeeeee;">
                            <p style="color: #999999; font-size: 12px; margin: 0 0 10px 0;">
                                © ${new Date().getFullYear()} AutoSaaz. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `;
    }
}

export default new EmailService();
