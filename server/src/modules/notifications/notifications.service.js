import nodemailer from 'nodemailer';
import { pool } from '../../db/pool.js';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import { AppError } from '../../utils/AppError.js';
import { STATUS_LABELS } from '../../utils/progress.js';
import * as activityLogService from '../activityLog/activityLog.service.js';

let mailer = null;
function getMailer() {
  if (!mailer && env.smtp.host) {
    mailer = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.port === 465,
      auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.password } : undefined,
    });
  }
  return mailer;
}

function buildMessageBody(athlete, missing) {
  return [
    `Athlete: ${athlete.full_name}`,
    `Competition: ${athlete.competition_name}`,
    `Destination: ${athlete.destination_country}`,
    `Progress: ${athlete.progress_percent}% (${STATUS_LABELS[athlete.status]})`,
    `Missing requirements: ${missing.length ? missing.join(', ') : 'None'}`,
    `Departure date: ${athlete.departure_date}`,
  ].join('\n');
}

async function sendEmail(recipient, subject, body) {
  const transport = getMailer();
  if (!transport) {
    // No SMTP configured (e.g. local dev) - log instead of throwing, so the
    // rest of the flow (DB record, activity log) still exercises correctly.
    logger.warn('SMTP not configured - email not actually sent', { recipient, subject });
    return { simulated: true };
  }
  await transport.sendMail({ from: env.smtp.from, to: recipient, subject, text: body });
  return { simulated: false };
}

async function sendWhatsApp(recipient, body) {
  if (!env.whatsapp.phoneNumberId || !env.whatsapp.accessToken) {
    logger.warn('WhatsApp Business API not configured - message not actually sent', { recipient });
    return { simulated: true };
  }
  const url = `${env.whatsapp.apiUrl}/${env.whatsapp.phoneNumberId}/messages`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.whatsapp.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: recipient,
      type: 'text',
      text: { body },
    }),
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`WhatsApp API error: ${response.status} ${errText}`);
  }
  return { simulated: false };
}

export async function send({ athleteId, channel, recipient, customMessage }, actorId) {
  const [[athlete]] = await pool.query('SELECT * FROM athletes WHERE id = ? AND deleted_at IS NULL', [athleteId]);
  if (!athlete) throw AppError.notFound('Athlete not found');

  const [pendingRows] = await pool.query(
    "SELECT requirement_key FROM travel_requirements WHERE athlete_id = ? AND status = 'pending'",
    [athleteId]
  );
  const missing = pendingRows.map((r) => r.requirement_key.replace(/_/g, ' '));
  const body = customMessage || buildMessageBody(athlete, missing);
  const subject = `Travel update: ${athlete.full_name} - ${athlete.competition_name}`;

  let status = 'sent';
  let errorMessage = null;
  try {
    if (channel === 'email') await sendEmail(recipient, subject, body);
    else await sendWhatsApp(recipient, body);
  } catch (err) {
    status = 'failed';
    errorMessage = err.message;
  }

  const [result] = await pool.query(
    `INSERT INTO notifications (athlete_id, sent_by, channel, recipient, message, status, error_message)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [athleteId, actorId, channel, recipient, body, status, errorMessage]
  );

  await activityLogService.record(null, {
    userId: actorId, action: 'notification.sent', entityType: 'athlete', entityId: athleteId,
    details: { channel, recipient, status },
  });

  if (status === 'failed') throw new AppError(`Failed to send ${channel} notification: ${errorMessage}`, 502, 'NOTIFICATION_FAILED');
  return { id: result.insertId, status };
}

export async function history(athleteId) {
  const [rows] = await pool.query(
    'SELECT id, channel, recipient, status, created_at FROM notifications WHERE athlete_id = ? ORDER BY created_at DESC',
    [athleteId]
  );
  return rows;
}
