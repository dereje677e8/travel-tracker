import cron from 'node-cron';
import { pool } from '../db/pool.js';
import { logger } from '../utils/logger.js';
import * as notificationsService from '../modules/notifications/notifications.service.js';

/**
 * Daily sweep (07:00): finds visa appointments scheduled for tomorrow and
 * emails the assigned officer a reminder. Only fires once per appointment,
 * since appointment_date only equals "tomorrow" on a single calendar day -
 * no separate de-dup tracking needed unless the job is manually re-run
 * within the same day.
 */
export function startAppointmentReminderJob() {
  cron.schedule('0 7 * * *', () => runAppointmentReminderSweep());
  logger.info('Appointment reminder job scheduled (daily 07:00, 1 day before visa appointments)');
}

export async function runAppointmentReminderSweep() {
  try {
    const [rows] = await pool.query(`
      SELECT a.id AS athlete_id, a.full_name, a.competition_name, a.destination_country,
             tr.appointment_date, u.email AS officer_email
      FROM athletes a
      JOIN travel_requirements tr ON tr.athlete_id = a.id AND tr.requirement_key = 'visa_appointment'
      LEFT JOIN users u ON u.id = a.assigned_officer_id
      WHERE a.deleted_at IS NULL AND tr.status = 'pending'
        AND tr.appointment_date = DATE_ADD(CURDATE(), INTERVAL 1 DAY)
    `);

    for (const row of rows) {
      if (!row.officer_email) {
        logger.warn('Skipping appointment reminder - athlete has no assigned officer with an email', { athleteId: row.athlete_id });
        continue;
      }
      try {
        // actorId is null (no human triggered this) - shows as "System" in
        // the activity log, same convention used elsewhere for automated actions.
        await notificationsService.send({
          athleteId: row.athlete_id,
          channel: 'email',
          recipient: row.officer_email,
          customMessage:
            `Reminder: ${row.full_name}'s visa appointment is scheduled for tomorrow ` +
            `(${row.appointment_date}) ahead of travel to ${row.destination_country} for ${row.competition_name}.`,
        }, null);
        logger.info('Sent appointment reminder', { athleteId: row.athlete_id, to: row.officer_email });
      } catch (err) {
        logger.error('Failed to send appointment reminder', { athleteId: row.athlete_id, error: err.message });
      }
    }

    return rows.length;
  } catch (err) {
    logger.error('Appointment reminder sweep failed', { error: err.message });
    return 0;
  }
}
