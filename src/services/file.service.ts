import { supabase } from '../config/supabase';
import { v4 as uuidv4 } from 'uuid';
import { Request, Response } from 'express';

export class FileService {
    async uploadFile(file: Express.Multer.File): Promise<string> {
        const fileName = `${uuidv4()}-${file.originalname}`;
        const { data, error } = await supabase.storage
            .from('uploads')
            .upload(fileName, file.buffer, {
                contentType: file.mimetype,
                upsert: false,
            });

        if (error) {
            throw new Error(`File upload failed: ${error.message}`);
        }

        return data.Key; // Return the file path or URL as needed
    }

    async getFileUrl(fileName: string): Promise<string> {
        const { publicURL, error } = supabase.storage
            .from('uploads')
            .getPublicUrl(fileName);

        if (error) {
            throw new Error(`Failed to get file URL: ${error.message}`);
        }

        return publicURL;
    }

    async deleteFile(fileName: string): Promise<void> {
        const { error } = await supabase.storage
            .from('uploads')
            .remove([fileName]);

        if (error) {
            throw new Error(`File deletion failed: ${error.message}`);
        }
    }
}