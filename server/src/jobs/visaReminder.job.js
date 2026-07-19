import cron from 'node-cron';
import { pool } from '../db/pool.js';
import { logger } from '../utils/logger.js';

/**
 * Daily sweep for athletes departing within 7 days who still have pending
 * requirements - logs a reminder. Wire this into the notifications service
 * if automatic (vs admin-triggered) sending is wanted later.
 */
export function startVisaReminderJob() {
  cron.schedule('0 7 * * *', async () => {
    try {
      const [rows] = await pool.query(`
        SELECT a.id, a.full_name, a.departure_date, COUNT(tr.id) AS pending_count
        FROM athletes a
        JOIN travel_requirements tr ON tr.athlete_id = a.id AND tr.status = 'pending'
        WHERE a.deleted_at IS NULL AND a.departure_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
        GROUP BY a.id
      `);
      if (rows.length) {
        logger.info('Athletes with pending requirements departing within 7 days', { count: rows.length, rows });
      }
    } catch (err) {
      logger.error('Visa reminder job failed', { error: err.message });
    }
  });
  logger.info('Visa reminder job scheduled (daily 07:00)');
}
