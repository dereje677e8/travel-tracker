import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../../db/pool.js';
import { env } from '../../config/env.js';
import { AppError } from '../../utils/AppError.js';

function signTokens(user) {
  const payload = { sub: user.id, role: user.role, fullName: user.full_name };
  const accessToken = jwt.sign(payload, env.jwt.accessSecret, { expiresIn: env.jwt.accessExpires });
  const refreshToken = jwt.sign({ sub: user.id }, env.jwt.refreshSecret, { expiresIn: env.jwt.refreshExpires });
  return { accessToken, refreshToken };
}

export async function login({ email, password }) {
  const [rows] = await pool.query(
    'SELECT id, full_name, email, password_hash, role, is_active FROM users WHERE email = ?',
    [email]
  );
  const user = rows[0];
  // Same error for "no such user" and "wrong password" - don't leak which one it was.
  if (!user || !user.is_active) throw AppError.unauthorized('Invalid email or password');

  const matches = await bcrypt.compare(password, user.password_hash);
  if (!matches) throw AppError.unauthorized('Invalid email or password');

  const tokens = signTokens(user);
  return {
    user: { id: user.id, fullName: user.full_name, email: user.email, role: user.role },
    ...tokens,
  };
}

export async function refresh({ refreshToken }) {
  let payload;
  try {
    payload = jwt.verify(refreshToken, env.jwt.refreshSecret);
  } catch {
    throw AppError.unauthorized('Invalid or expired refresh token');
  }
  const [rows] = await pool.query(
    'SELECT id, full_name, email, role, is_active FROM users WHERE id = ?',
    [payload.sub]
  );
  const user = rows[0];
  if (!user || !user.is_active) throw AppError.unauthorized();
  return signTokens(user);
}

export async function me(userId) {
  const [rows] = await pool.query(
    'SELECT id, full_name, email, role FROM users WHERE id = ?',
    [userId]
  );
  if (!rows[0]) throw AppError.notFound('User not found');
  return rows[0];
}
