import mysql from 'mysql2/promise';
import { env } from '../config/env.js';

/**
 * Single shared connection pool. Never open ad-hoc connections elsewhere -
 * import `pool` and use pool.execute()/pool.getConnection() for transactions.
 */
export const pool = mysql.createPool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.database,
  connectionLimit: env.db.connectionLimit,
  namedPlaceholders: true,
  dateStrings: true,
});

export async function withTransaction(work) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await work(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}
