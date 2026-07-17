import multer from 'multer';
import { AppError } from '../utils/AppError.js';

/**
 * Photo uploads are resized/cropped client-side to a standard ID-photo
 * size before they ever reach the server (see the frontend PhotoUploader),
 * so the server just needs to validate type/size, not process the image -
 * no native image-processing dependency (sharp, etc.) required here.
 */
const MAX_PHOTO_BYTES = 3 * 1024 * 1024; // 3MB - plenty for an already-resized JPEG
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png']);

const storage = multer.memoryStorage();

export const uploadPhoto = multer({
  storage,
  limits: { fileSize: MAX_PHOTO_BYTES },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      return cb(AppError.validation('Only JPEG or PNG images are allowed', { photo: 'Invalid file type' }));
    }
    cb(null, true);
  },
}).single('photo');
