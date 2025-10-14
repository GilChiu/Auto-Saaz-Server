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
        const user = await this.userService.register(userData);
        res.status(201).json({ message: 'User registered successfully', user });
    });

    public login = asyncHandler(async (req: Request, res: Response) => {
        const { email, password } = req.body;
        const token = await this.userService.login(email, password);
        res.status(200).json({ message: 'Login successful', token });
    });

    public uploadFile = asyncHandler(async (req: Request, res: Response) => {
        const file = req.file;
        const uploadedFile = await this.fileService.uploadFile(file);
        res.status(201).json({ message: 'File uploaded successfully', file: uploadedFile });
    });

    public getUserProfile = asyncHandler(async (req: Request, res: Response) => {
        const userId = req.user.id;
        const userProfile = await this.userService.getUserProfile(userId);
        res.status(200).json({ userProfile });
    });
}