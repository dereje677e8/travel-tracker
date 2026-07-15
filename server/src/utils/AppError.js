/**
 * Known, expected application errors. The error middleware maps these
 * to correct HTTP status codes; anything else is treated as a 500 and
 * logged server-side only (never leaked to the client).
 */
export class AppError extends Error {
  constructor(message, statusCode = 400, code = 'BAD_REQUEST', fields = null) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.fields = fields;
  }

  static notFound(message = 'Resource not found') {
    return new AppError(message, 404, 'NOT_FOUND');
  }

  static forbidden(message = 'You do not have permission to do that') {
    return new AppError(message, 403, 'FORBIDDEN');
  }

  static unauthorized(message = 'Authentication required') {
    return new AppError(message, 401, 'UNAUTHORIZED');
  }

  static validation(message, fields) {
    return new AppError(message, 400, 'VALIDATION_ERROR', fields);
  }

  static conflict(message) {
    return new AppError(message, 409, 'CONFLICT');
  }
}
