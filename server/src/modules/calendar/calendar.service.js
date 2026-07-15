import { pool } from '../../db/pool.js';

/**
 * Flattens each athlete's key dates (visa appointment, departure, return,
 * competition window) into a single list of calendar events for the given
 * month, since the frontend calendar renders one unified event stream.
 */
export async function getEvents({ start, end }) {
  const [athletes] = await pool.query(
    `SELECT id, athlete_code, full_name, destination_country, departure_date, return_date
     FROM athletes
     WHERE deleted_at IS NULL AND (
       departure_date BETWEEN ? AND ? OR return_date BETWEEN ? AND ?
     )`,
    [start, end, start, end]
  );

  const [visaAppointments] = await pool.query(
    `SELECT a.id, a.athlete_code, a.full_name, tr.appointment_date
     FROM athletes a
     JOIN travel_requirements tr ON tr.athlete_id = a.id AND tr.requirement_key = 'visa_appointment'
     WHERE a.deleted_at IS NULL AND tr.appointment_date BETWEEN ? AND ?`,
    [start, end]
  );

  const events = [];
  for (const a of athletes) {
    events.push({ type: 'departure', date: a.departure_date, athleteId: a.id, athleteCode: a.athlete_code, title: `${a.full_name} departs \u2192 ${a.destination_country}` });
    events.push({ type: 'return', date: a.return_date, athleteId: a.id, athleteCode: a.athlete_code, title: `${a.full_name} returns` });
  }
  for (const v of visaAppointments) {
    events.push({ type: 'visa_appointment', date: v.appointment_date, athleteId: v.id, athleteCode: v.athlete_code, title: `${v.full_name} - visa appointment` });
  }
  return events;
}
