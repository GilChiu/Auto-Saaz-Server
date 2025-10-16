import { supabase } from '../config/supabase';
import { v4 as uuidv4 } from 'uuid';
import { Request, Response } from 'express';

export class FileService {
    async uploadFile(fileName: string, fileBuffer: Buffer): Promise<string> {
        const uniqueFileName = `${uuidv4()}-${fileName}`;
        const { data, error } = await supabase.storage
            .from('uploads')
            .upload(uniqueFileName, fileBuffer, {
                upsert: false,
            });

        if (error) {
            throw new Error(`File upload failed: ${error.message}`);
        }

        return data.path; // Return the file path
    }

    async getFileUrl(fileName: string): Promise<string> {
        const { data } = supabase.storage
            .from('uploads')
            .getPublicUrl(fileName);

        return data.publicUrl;
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