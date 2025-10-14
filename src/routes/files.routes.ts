import { Router } from 'express';
import { FilesController } from '../controllers/files.controller';
import { asyncHandler } from '../middleware/asyncHandler';
import { authGuard } from '../middleware/authGuard';
import { validate } from '../middleware/validate';
import { fileUploadSchema } from '../validators/file.schema';

const router = Router();
const filesController = new FilesController();

// Route for uploading files
router.post('/upload', authGuard, validate(fileUploadSchema), asyncHandler(filesController.uploadFile));

// Route for retrieving files
router.get('/:fileId', authGuard, asyncHandler(filesController.getFile));

// Route for deleting files
router.delete('/:fileId', authGuard, asyncHandler(filesController.deleteFile));

export default router;