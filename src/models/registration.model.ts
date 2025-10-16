import supabase from '../config/supabase';
import logger from '../config/logger';
import crypto from 'crypto';

export interface RegistrationSession {
    id: string;
    session_id: string;
    email: string;
    phone_number: string;
    full_name: string;
    address?: string;
    street?: string;
    state?: string;
    location?: string;
    coordinates?: any;
    company_legal_name?: string;
    emirates_id_url?: string;
    trade_license_number?: string;
    vat_certification?: string;
    step_completed: number;
    expires_at: string;
    created_at: string;
    updated_at: string;
}

export class RegistrationSessionModel {
    /**
     * Generate a unique session ID
     */
    private static generateSessionId(): string {
        return crypto.randomBytes(32).toString('hex');
    }

    /**
     * Create a new registration session
     */
    static async createSession(data: {
        fullName: string;
        email: string;
        phoneNumber: string;
    }): Promise<{ sessionId: string; expiresAt: Date }> {
        try {
            const sessionId = this.generateSessionId();
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour expiry

            const { error } = await supabase.from('registration_sessions').insert([
                {
                    session_id: sessionId,
                    email: data.email.toLowerCase(),
                    phone_number: data.phoneNumber,
                    full_name: data.fullName,
                    step_completed: 1,
                    expires_at: expiresAt.toISOString(),
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                },
            ]);

            if (error) {
                logger.error('Error creating registration session:', error);
                throw new Error('Failed to create registration session');
            }

            logger.info(`Registration session created: ${sessionId}`);
            return { sessionId, expiresAt };
        } catch (error) {
            logger.error('RegistrationSessionModel.createSession error:', error);
            throw error;
        }
    }

    /**
     * Get session by ID
     */
    static async getSession(sessionId: string): Promise<RegistrationSession | null> {
        try {
            const { data, error } = await supabase
                .from('registration_sessions')
                .select('*')
                .eq('session_id', sessionId)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    return null;
                }
                throw new Error(error.message);
            }

            // Check if expired
            const now = new Date();
            const expiresAt = new Date(data.expires_at);
            if (now > expiresAt) {
                return null;
            }

            return data as RegistrationSession;
        } catch (error) {
            logger.error('RegistrationSessionModel.getSession error:', error);
            return null;
        }
    }

    /**
     * Update session with Step 2 data (Location)
     */
    static async updateLocationData(
        sessionId: string,
        data: {
            address: string;
            street: string;
            state: string;
            location: string;
            coordinates?: any;
        }
    ): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('registration_sessions')
                .update({
                    address: data.address,
                    street: data.street,
                    state: data.state,
                    location: data.location,
                    coordinates: data.coordinates,
                    step_completed: 2,
                    updated_at: new Date().toISOString(),
                })
                .eq('session_id', sessionId);

            if (error) {
                logger.error('Error updating location data:', error);
                return false;
            }

            return true;
        } catch (error) {
            logger.error('RegistrationSessionModel.updateLocationData error:', error);
            return false;
        }
    }

    /**
     * Update session with Step 3 data (Business Details)
     */
    static async updateBusinessData(
        sessionId: string,
        data: {
            companyLegalName: string;
            emiratesIdUrl: string;
            tradeLicenseNumber: string;
            vatCertification?: string;
        }
    ): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('registration_sessions')
                .update({
                    company_legal_name: data.companyLegalName,
                    emirates_id_url: data.emiratesIdUrl,
                    trade_license_number: data.tradeLicenseNumber,
                    vat_certification: data.vatCertification,
                    step_completed: 3,
                    updated_at: new Date().toISOString(),
                })
                .eq('session_id', sessionId);

            if (error) {
                logger.error('Error updating business data:', error);
                return false;
            }

            return true;
        } catch (error) {
            logger.error('RegistrationSessionModel.updateBusinessData error:', error);
            return false;
        }
    }

    /**
     * Delete session (after successful registration)
     */
    static async deleteSession(sessionId: string): Promise<void> {
        try {
            await supabase.from('registration_sessions').delete().eq('session_id', sessionId);
        } catch (error) {
            logger.error('RegistrationSessionModel.deleteSession error:', error);
        }
    }

    /**
     * Cleanup expired sessions (run as cron job)
     */
    static async cleanupExpiredSessions(): Promise<number> {
        try {
            const now = new Date().toISOString();

            const { count, error } = await supabase
                .from('registration_sessions')
                .delete()
                .lt('expires_at', now);

            if (error) {
                logger.error('Error cleaning up expired sessions:', error);
                return 0;
            }

            logger.info(`Cleaned up ${count} expired registration sessions`);
            return count || 0;
        } catch (error) {
            logger.error('RegistrationSessionModel.cleanupExpiredSessions error:', error);
            return 0;
        }
    }
}
