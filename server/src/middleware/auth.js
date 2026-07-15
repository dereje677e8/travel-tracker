import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

/**
 * Verifies the JWT access token and attaches { id, role } to req.user.
 * Never trust a role/userId sent in the request body - it always comes
 * from the verified token.
 */
export function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) throw AppError.unauthorized();

    const payload = jwt.verify(token, env.jwt.accessSecret);
    req.user = { id: payload.sub, role: payload.role, fullName: payload.fullName };
    next();
  } catch (err) {
    next(AppError.unauthorized('Invalid or expired session'));
  }
}

/**
 * Deny by default: pass the roles allowed to call this route.
 * requireRole('administrator') or requireRole('administrator', 'staff')
 */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(AppError.forbidden());
    }
    next();
  };
}
