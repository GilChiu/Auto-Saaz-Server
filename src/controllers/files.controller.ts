import { Request, Response } from 'express';
import { FileService } from '../services/file.service';
import { asyncHandler } from '../middleware/asyncHandler';

export class FilesController {
    private fileService: FileService;

    constructor() {
        this.fileService = new FileService();
    }

    public uploadFile = asyncHandler(async (req: Request, res: Response) => {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const { originalname, buffer } = req.file;
        const fileUrl = await this.fileService.uploadFile(originalname, buffer);

        return res.status(201).json({ message: 'File uploaded successfully', fileUrl });
    });

    public getFile = asyncHandler(async (req: Request, res: Response) => {
        const { fileId } = req.params;
        const fileUrl = await this.fileService.getFileUrl(fileId);

        return res.status(200).json({ fileUrl });
    });

    public deleteFile = asyncHandler(async (req: Request, res: Response) => {
        const { fileId } = req.params;
        await this.fileService.deleteFile(fileId);

        return res.status(200).json({ message: 'File deleted successfully' });
    });
}