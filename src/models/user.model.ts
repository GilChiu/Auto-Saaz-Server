import supabase from '../config/supabase';
import { User, UserRole, RegistrationStatus, GarageProfile } from '../types/garage.types';
import logger from '../config/logger';

export class UserModel {
    /**
     * Create a new user
     */
    static async createUser(data: {
        email: string;
        password: string;
        role?: UserRole;
    }): Promise<User | null> {
        try {
            const { data: user, error } = await supabase
                .from('users')
                .insert([
                    {
                        email: data.email,
                        password: data.password,
                        role: data.role || UserRole.GARAGE_OWNER,
                        status: RegistrationStatus.PENDING_VERIFICATION,
                        failed_login_attempts: 0,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    },
                ])
                .select()
                .single();

            if (error) {
                logger.error('Error creating user:', error);
                throw new Error(error.message);
            }

            return user as User;
        } catch (error) {
            logger.error('UserModel.createUser error:', error);
            throw error;
        }
    }

    /**
     * Get user by email
     */
    static async getUserByEmail(email: string): Promise<User | null> {
        try {
            const { data: user, error } = await supabase
                .from('users')
                .select('*')
                .eq('email', email.toLowerCase())
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    // Not found
                    return null;
                }
                throw new Error(error.message);
            }

            return user as User;
        } catch (error) {
            logger.error('UserModel.getUserByEmail error:', error);
            throw error;
        }
    }

    /**
     * Get user by ID
     */
    static async getUserById(id: string): Promise<User | null> {
        try {
            const { data: user, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    return null;
                }
                throw new Error(error.message);
            }

            return user as User;
        } catch (error) {
            logger.error('UserModel.getUserById error:', error);
            throw error;
        }
    }

    /**
     * Update user
     */
    static async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
        try {
            const { data: user, error } = await supabase
                .from('users')
                .update({
                    ...updates,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', id)
                .select()
                .single();

            if (error) {
                logger.error('Error updating user:', error);
                throw new Error(error.message);
            }

            return user as User;
        } catch (error) {
            logger.error('UserModel.updateUser error:', error);
            throw error;
        }
    }

    /**
     * Increment failed login attempts
     */
    static async incrementFailedLoginAttempts(id: string): Promise<void> {
        try {
            const user = await this.getUserById(id);
            if (!user) throw new Error('User not found');

            const failedAttempts = (user.failedLoginAttempts || 0) + 1;
            
            await supabase
                .from('users')
                .update({
                    failed_login_attempts: failedAttempts,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', id);
        } catch (error) {
            logger.error('UserModel.incrementFailedLoginAttempts error:', error);
            throw error;
        }
    }

    /**
     * Reset failed login attempts
     */
    static async resetFailedLoginAttempts(id: string): Promise<void> {
        try {
            await supabase
                .from('users')
                .update({
                    failed_login_attempts: 0,
                    locked_until: null,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', id);
        } catch (error) {
            logger.error('UserModel.resetFailedLoginAttempts error:', error);
            throw error;
        }
    }

    /**
     * Lock user account
     */
    static async lockAccount(id: string, durationMinutes: number): Promise<void> {
        try {
            const lockedUntil = new Date();
            lockedUntil.setMinutes(lockedUntil.getMinutes() + durationMinutes);

            await supabase
                .from('users')
                .update({
                    locked_until: lockedUntil.toISOString(),
                    updated_at: new Date().toISOString(),
                })
                .eq('id', id);
        } catch (error) {
            logger.error('UserModel.lockAccount error:', error);
            throw error;
        }
    }

    /**
     * Update last login
     */
    static async updateLastLogin(id: string, ip?: string): Promise<void> {
        try {
            await supabase
                .from('users')
                .update({
                    last_login_at: new Date().toISOString(),
                    last_login_ip: ip,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', id);
        } catch (error) {
            logger.error('UserModel.updateLastLogin error:', error);
            throw error;
        }
    }

    /**
     * Delete user
     */
    static async deleteUser(id: string): Promise<void> {
        try {
            const { error } = await supabase.from('users').delete().eq('id', id);

            if (error) {
                logger.error('Error deleting user:', error);
                throw new Error(error.message);
            }
        } catch (error) {
            logger.error('UserModel.deleteUser error:', error);
            throw error;
        }
    }

    /**
     * Check if account is locked
     */
    static async isAccountLocked(id: string): Promise<boolean> {
        try {
            const user = await this.getUserById(id);
            if (!user || !user.lockedUntil) return false;

            const now = new Date();
            const lockedUntil = new Date(user.lockedUntil);

            return now < lockedUntil;
        } catch (error) {
            logger.error('UserModel.isAccountLocked error:', error);
            return false;
        }
    }
}

export class GarageModel {
    /**
     * Create garage profile
     */
    static async createProfile(userId: string, data: Partial<GarageProfile>): Promise<GarageProfile | null> {
        try {
            const { data: profile, error } = await supabase
                .from('garage_profiles')
                .insert([
                    {
                        user_id: userId,
                        ...data,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    },
                ])
                .select()
                .single();

            if (error) {
                logger.error('Error creating garage profile:', error);
                throw new Error(error.message);
            }

            return profile as GarageProfile;
        } catch (error) {
            logger.error('GarageModel.createProfile error:', error);
            throw error;
        }
    }

    /**
     * Get garage profile by user ID
     */
    static async getProfileByUserId(userId: string): Promise<GarageProfile | null> {
        try {
            const { data: profile, error } = await supabase
                .from('garage_profiles')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    return null;
                }
                throw new Error(error.message);
            }

            return profile as GarageProfile;
        } catch (error) {
            logger.error('GarageModel.getProfileByUserId error:', error);
            throw error;
        }
    }

    /**
     * Update garage profile
     */
    static async updateProfile(userId: string, updates: Partial<GarageProfile>): Promise<GarageProfile | null> {
        try {
            const { data: profile, error } = await supabase
                .from('garage_profiles')
                .update({
                    ...updates,
                    updated_at: new Date().toISOString(),
                })
                .eq('user_id', userId)
                .select()
                .single();

            if (error) {
                logger.error('Error updating garage profile:', error);
                throw new Error(error.message);
            }

            return profile as GarageProfile;
        } catch (error) {
            logger.error('GarageModel.updateProfile error:', error);
            throw error;
        }
    }
}