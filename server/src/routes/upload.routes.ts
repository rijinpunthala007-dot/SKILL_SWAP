import { Router, Request, Response } from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/authenticate';
import { cloudinary, isCloudinaryConfigured } from '../config/cloudinary';
import { AppError } from '../utils/AppError';
import { successResponse } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

// Configure multer for memory storage so we can upload directly to Cloudinary
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

router.post(
  '/attachment',
  authenticate,
  upload.single('file'),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      throw AppError.badRequest('No file provided');
    }

    if (!isCloudinaryConfigured) {
      throw AppError.internal('Cloudinary is not configured on the server');
    }

    // Upload to Cloudinary using a buffer stream
    const uploadToCloudinary = (buffer: Buffer): Promise<any> => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: 'skillswap/attachments',
            resource_type: 'auto', // Auto detects image vs raw file (like pdf)
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
        stream.end(buffer);
      });
    };

    const result = await uploadToCloudinary(req.file.buffer);

    let type = 'other';
    if (result.resource_type === 'image') {
      type = 'image';
    } else if (req.file.mimetype === 'application/pdf') {
      type = 'pdf';
    }

    const attachment = {
      url: result.secure_url,
      type,
      name: req.file.originalname,
      size: req.file.size,
    };

    res.json(successResponse(attachment));
  })
);

export default router;
