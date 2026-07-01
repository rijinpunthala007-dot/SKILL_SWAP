import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import * as userController from '../controllers/user.controller';
import { authenticate, optionalAuthenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { updateProfileSchema, searchQuerySchema } from '../schemas/validation.schemas';

const router = Router();

// Multer config — local disk fallback for non-Cloudinary environments
const storage = multer.diskStorage({
  destination: 'uploads/avatars',
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and WebP images are allowed'));
    }
  },
});

router.get('/me', authenticate, userController.getMe);
router.put('/me', authenticate, validate(updateProfileSchema), userController.updateMe);
router.post('/me/avatar', authenticate, upload.single('avatar'), userController.uploadAvatar);
router.get('/matches', authenticate, userController.getMatches);
router.get('/search', optionalAuthenticate, validate(searchQuerySchema, 'query'), userController.searchUsers);
router.get('/:id', optionalAuthenticate, userController.getUserById);

export default router;
