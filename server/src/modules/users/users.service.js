import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { pool } from '../../db/pool.js';
import { AppError } from '../../utils/AppError.js';
import * as activityLogService from '../activityLog/activityLog.service.js';

export async function list() {
  const [rows] = await pool.query(
    'SELECT id, full_name, email, role, is_active, created_at FROM users ORDER BY created_at DESC'
  );
  return rows;
}

export async function directory() {
  const [rows] = await pool.query(
    "SELECT id, full_name, role FROM users WHERE is_active = 1 ORDER BY full_name ASC"
  );
  return rows;
}

export async function create({ fullName, email, password, role }, actorId) {
  const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
  if (existing.length) throw AppError.conflict('A user with that email already exists');

  const passwordHash = await bcrypt.hash(password, 10);
  const [result] = await pool.query(
    'INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)',
    [fullName, email, passwordHash, role]
  );
  await activityLogService.record(null, {
    userId: actorId, action: 'user.created', entityType: 'user', entityId: result.insertId, details: { email, role },
  });
  return { id: result.insertId, fullName, email, role };
}

export async function update(id, patch, actorId) {
  const fields = [];
  const values = [];
  if (patch.fullName !== undefined) { fields.push('full_name = ?'); values.push(patch.fullName); }
  if (patch.role !== undefined) { fields.push('role = ?'); values.push(patch.role); }
  if (patch.isActive !== undefined) { fields.push('is_active = ?'); values.push(patch.isActive ? 1 : 0); }
  if (!fields.length) return;

  values.push(id);
  const [result] = await pool.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
  if (result.affectedRows === 0) throw AppError.notFound('User not found');

  await activityLogService.record(null, {
    userId: actorId, action: 'user.updated', entityType: 'user', entityId: id, details: patch,
  });
}

// Generates an 12-char password from an unambiguous charset (no 0/O/1/l/I)
// so it's easy to read aloud or retype if the admin has to relay it by phone.
const TEMP_PASSWORD_CHARSET = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
function generateTempPassword(length = 12) {
  return Array.from(crypto.randomFillSync(new Uint8Array(length)))
    .map((byte) => TEMP_PASSWORD_CHARSET[byte % TEMP_PASSWORD_CHARSET.length])
    .join('');
}

export async function resetPassword(id, explicitPassword, actorId) {
  const [existing] = await pool.query('SELECT id, email FROM users WHERE id = ?', [id]);
  if (!existing.length) throw AppError.notFound('User not found');

  const newPassword = explicitPassword || generateTempPassword();
  const passwordHash = await bcrypt.hash(newPassword, 10);
  await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, id]);

  // Never log or store the plaintext password anywhere - it's returned once
  // in the API response for the admin to relay, and that's it.
  await activityLogService.record(null, {
    userId: actorId, action: 'user.password_reset', entityType: 'user', entityId: id,
    details: { generatedByAdmin: !explicitPassword },
  });

  return { id, email: existing[0].email, temporaryPassword: newPassword };
}
