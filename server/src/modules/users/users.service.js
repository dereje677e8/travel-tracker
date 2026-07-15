import bcrypt from 'bcryptjs';
import { pool } from '../../db/pool.js';
import { AppError } from '../../utils/AppError.js';
import * as activityLogService from '../activityLog/activityLog.service.js';

export async function list() {
  const [rows] = await pool.query(
    'SELECT id, full_name, email, role, is_active, created_at FROM users ORDER BY created_at DESC'
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
