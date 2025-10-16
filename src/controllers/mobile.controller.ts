import { Request, Response } from 'express';
import { UserService } from '../services/user.service';
import { FileService } from '../services/file.service';
import { asyncHandler } from '../middleware/asyncHandler';

export class MobileController {
    private userService: UserService;
    private fileService: FileService;

    constructor() {
        this.userService = new UserService();
        this.fileService = new FileService();
    }

    public register = asyncHandler(async (req: Request, res: Response) => {
        const userData = req.body;
        // TODO: Implement registration in auth.service instead
        res.status(201).json({ message: 'User registered successfully', user: userData });
    });

    public login = asyncHandler(async (req: Request, res: Response) => {
        const { email, password } = req.body;
        // TODO: Implement login in auth.service instead
        res.status(200).json({ message: 'Login successful', token: 'placeholder' });
    });

    public uploadFile = asyncHandler(async (req: Request, res: Response) => {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        const uploadedFile = await this.fileService.uploadFile(req.file.originalname, req.file.buffer);
        res.status(201).json({ message: 'File uploaded successfully', file: uploadedFile });
    });

    public getUserProfile = asyncHandler(async (req: Request, res: Response) => {
        // TODO: Add user type to Request
        const userId = 'placeholder'; // req.user?.id
        const userProfile = await this.userService.getUserById(userId);
        res.status(200).json({ userProfile });
    });
}