import { pool } from '../../db/pool.js';

/**
 * Records one immutable audit entry. Callers pass an existing transaction
 * connection when the log write must succeed-or-fail atomically with the
 * mutation it documents (the common case); falls back to the pool otherwise.
 */
export async function record(conn, { userId, action, entityType, entityId, details = {} }) {
  const runner = conn || pool;
  await runner.query(
    'INSERT INTO activity_log (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)',
    [userId, action, entityType, entityId, JSON.stringify(details)]
  );
}

export async function listForEntity(entityType, entityId) {
  const [rows] = await pool.query(
    `SELECT al.id, al.action, al.details, al.created_at, u.full_name AS user_name
     FROM activity_log al
     LEFT JOIN users u ON u.id = al.user_id
     WHERE al.entity_type = ? AND al.entity_id = ?
     ORDER BY al.created_at DESC`,
    [entityType, entityId]
  );
  return rows;
}

export async function listRecent(limit = 50) {
  const [rows] = await pool.query(
    `SELECT al.id, al.action, al.entity_type, al.entity_id, al.details, al.created_at, u.full_name AS user_name
     FROM activity_log al
     LEFT JOIN users u ON u.id = al.user_id
     ORDER BY al.created_at DESC
     LIMIT ?`,
    [limit]
  );
  return rows;
}
