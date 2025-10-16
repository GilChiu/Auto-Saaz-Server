import { supabase } from '../config/supabase';
import { User } from '../types/garage.types';
import { Response } from 'express';

export class UserService {
    async getUserById(userId: string): Promise<User | null> {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) {
            throw new Error(`Error fetching user: ${error.message}`);
        }

        return data;
    }

    async updateUser(userId: string, userData: Partial<User>): Promise<User | null> {
        const { data, error } = await supabase
            .from('users')
            .update(userData)
            .eq('id', userId)
            .single();

        if (error) {
            throw new Error(`Error updating user: ${error.message}`);
        }

        return data;
    }

    async deleteUser(userId: string): Promise<void> {
        const { error } = await supabase
            .from('users')
            .delete()
            .eq('id', userId);

        if (error) {
            throw new Error(`Error deleting user: ${error.message}`);
        }
    }

    async uploadProfilePicture(userId: string, file: Express.Multer.File): Promise<string> {
        const { data, error } = await supabase.storage
            .from('profile-pictures')
            .upload(`${userId}/${file.originalname}`, file.buffer);

        if (error) {
            throw new Error(`Error uploading profile picture: ${error.message}`);
        }

        return data.path;
    }
}