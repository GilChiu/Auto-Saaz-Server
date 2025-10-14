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
        const file = await this.fileService.getFile(fileId);

        if (!file) {
            return res.status(404).json({ message: 'File not found' });
        }

        return res.status(200).json({ file });
    });

    public deleteFile = asyncHandler(async (req: Request, res: Response) => {
        const { fileId } = req.params;
        const result = await this.fileService.deleteFile(fileId);

        if (!result) {
            return res.status(404).json({ message: 'File not found' });
        }

        return res.status(200).json({ message: 'File deleted successfully' });
    });
}