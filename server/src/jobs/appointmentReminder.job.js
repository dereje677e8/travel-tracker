import cron from 'node-cron';
import { pool } from '../db/pool.js';
import { logger } from '../utils/logger.js';
import * as notificationsService from '../modules/notifications/notifications.service.js';

/**
 * Daily sweep (07:00): finds visa appointments scheduled for tomorrow and
 * emails a reminder. Since the query only ever matches "tomorrow", every
 * athlete caught in one sweep run shares the same date by construction -
 * so consolidating them into one email per recipient (rather than one
 * email per athlete) naturally covers "appointments on the same day get
 * one notification listing all of them."
 */
export function startAppointmentReminderJob() {
  cron.schedule('0 7 * * *', () => runAppointmentReminderSweep());
  logger.info('Appointment reminder job scheduled (daily 07:00, 1 day before visa appointments)');
}

function formatTime12h(timeStr) {
  if (!timeStr) return 'time not set';
  const [h, m] = timeStr.split(':');
  const hour = Number(h);
  const period = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${m} ${period}`;
}

function buildBatchMessage(rows) {
  const date = rows[0].appointment_date;
  const lines = [
    `The following visa appointment${rows.length > 1 ? 's are' : ' is'} scheduled for tomorrow (${date}):`,
    '',
    ...rows.map((r) =>
      `\u2022 ${r.full_name} \u2014 ${formatTime12h(r.appointment_time)} \u2014 ${r.destination_country} (${r.competition_name})`
    ),
  ];
  return lines.join('\n');
}

export async function runAppointmentReminderSweep() {
  try {
    const [rows] = await pool.query(`
      SELECT a.id AS athlete_id, a.full_name, a.competition_name, a.destination_country,
             tr.appointment_date, tr.appointment_time, u.email AS officer_email
      FROM athletes a
      JOIN travel_requirements tr ON tr.athlete_id = a.id AND tr.requirement_key = 'visa_appointment'
      LEFT JOIN users u ON u.id = a.assigned_officer_id
      WHERE a.deleted_at IS NULL AND tr.status = 'pending'
        AND tr.appointment_date = DATE_ADD(CURDATE(), INTERVAL 1 DAY)
      ORDER BY tr.appointment_time ASC
    `);

    if (rows.length === 0) return 0;

    // Group by assigned officer's email; athletes with no officer go into
    // their own bucket, routed to every active administrator instead.
    const byOfficer = new Map();
    const unassigned = [];
    for (const row of rows) {
      if (row.officer_email) {
        if (!byOfficer.has(row.officer_email)) byOfficer.set(row.officer_email, []);
        byOfficer.get(row.officer_email).push(row);
      } else {
        unassigned.push(row);
      }
    }

    let sentCount = 0;
    const subject = `Visa appointment reminder${rows.length > 1 ? 's' : ''} - tomorrow`;

    async function sendTo(recipient, group, note) {
      try {
        await notificationsService.sendBatch({
          recipient, subject, message: buildBatchMessage(group) + (note ? `\n\n${note}` : ''),
        }, null); // actorId null - system-triggered, shows as "System" in the activity log
        sentCount++;
        logger.info('Sent consolidated appointment reminder', { recipient, athleteCount: group.length });
      } catch (err) {
        logger.error('Failed to send appointment reminder', { recipient, error: err.message });
      }
    }

    for (const [email, group] of byOfficer) {
      await sendTo(email, group);
    }

    if (unassigned.length > 0) {
      const [adminRows] = await pool.query("SELECT email FROM users WHERE role = 'administrator' AND is_active = 1");
      const note = 'No officer is assigned to the athlete(s) above - routed to administrators.';
      for (const admin of adminRows) {
        await sendTo(admin.email, unassigned, note);
      }
      if (adminRows.length === 0) {
        logger.warn('Unassigned athletes have appointments tomorrow but no active administrators to notify', { count: unassigned.length });
      }
    }

    return sentCount;
  } catch (err) {
    logger.error('Appointment reminder sweep failed', { error: err.message });
    return 0;
  }
}
