import multer from 'multer';
import { logger } from '../utils/logger.js';
import { AppError } from '../utils/AppError.js';

export function notFoundHandler(req, res) {
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: `No route for ${req.method} ${req.path}` } });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: { code: err.code, message: err.message, fields: err.fields || undefined },
    });
  }

  // Multer's own errors (file too large, wrong field name, etc) aren't
  // AppError instances - translate them into the same clean shape instead
  // of falling through to a generic, unhelpful 500.
  if (err instanceof multer.MulterError) {
    const message = err.code === 'LIMIT_FILE_SIZE'
      ? 'Photo is too large - please use an image under 3MB.'
      : `Upload error: ${err.message}`;
    return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message } });
  }

  // Unexpected error: log full detail server-side, never leak internals to the client.
  logger.error('Unhandled error', { message: err.message, stack: err.stack, path: req.path });
  res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: 'Something went wrong. Please try again.' },
  });
}
