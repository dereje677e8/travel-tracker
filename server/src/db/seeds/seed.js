import bcrypt from 'bcryptjs';
import { pool } from '../pool.js';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import { REQUIRED_ITEMS } from '../../utils/progress.js';

/**
 * Idempotent-ish demo seed: creates the admin from env, two staff users,
 * and a handful of sample athletes with mixed progress so the dashboard
 * has something to show immediately after setup.
 */
async function upsertUser({ fullName, email, password, role }) {
  const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
  if (existing.length) return existing[0].id;
  const passwordHash = await bcrypt.hash(password, 10);
  const [result] = await pool.query(
    'INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)',
    [fullName, email, passwordHash, role]
  );
  return result.insertId;
}

async function seedAthlete(officerId, createdBy, data, completedKeys) {
  const [existing] = await pool.query('SELECT id FROM athletes WHERE athlete_code = ?', [data.athlete_code]);
  let athleteId;
  if (existing.length) {
    athleteId = existing[0].id;
  } else {
    const [result] = await pool.query(
      `INSERT INTO athletes
        (athlete_code, full_name, gender, date_of_birth, passport_number, sport, team_federation,
         destination_country, destination_city, competition_name, purpose_of_travel, visa_type,
         embassy, departure_date, return_date, assigned_officer_id, priority, notes, created_by)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        data.athlete_code, data.full_name, data.gender, data.date_of_birth, data.passport_number,
        data.sport, data.team_federation, data.destination_country, data.destination_city,
        data.competition_name, data.purpose_of_travel, data.visa_type, data.embassy,
        data.departure_date, data.return_date, officerId, data.priority, data.notes || null, createdBy,
      ]
    );
    athleteId = result.insertId;
  }

  for (const key of REQUIRED_ITEMS) {
    const isCompleted = completedKeys.includes(key);
    await pool.query(
      `INSERT INTO travel_requirements (athlete_id, requirement_key, status, date_completed, updated_by)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE status = VALUES(status), date_completed = VALUES(date_completed)`,
      [athleteId, key, isCompleted ? 'completed' : 'pending', isCompleted ? data.departure_date : null, createdBy]
    );
  }

  const percent = Math.round((completedKeys.length / REQUIRED_ITEMS.length) * 100);
  const status = percent === 0 ? 'new' : percent <= 40 ? 'preparing_documents'
    : percent <= 80 ? 'in_progress' : percent <= 99 ? 'almost_ready' : 'ready_for_travel';
  await pool.query('UPDATE athletes SET progress_percent = ?, status = ? WHERE id = ?', [percent, status, athleteId]);

  return athleteId;
}

async function run() {
  const adminId = await upsertUser({
    fullName: 'System Administrator',
    email: env.seedAdmin.email,
    password: env.seedAdmin.password,
    role: 'administrator',
  });
  const staff1Id = await upsertUser({
    fullName: 'Staff Officer One',
    email: 'staff1@attp.local',
    password: 'ChangeMe123!',
    role: 'staff',
  });
  await upsertUser({
    fullName: 'Staff Officer Two',
    email: 'staff2@attp.local',
    password: 'ChangeMe123!',
    role: 'staff',
  });

  const today = new Date();
  const addDays = (d) => new Date(today.getTime() + d * 86400000).toISOString().slice(0, 10);

  await seedAthlete(staff1Id, adminId, {
    athlete_code: 'ATH-0001', full_name: 'Selam Tesfaye', gender: 'female', date_of_birth: '1999-04-12',
    passport_number: 'EP1234567', sport: 'Athletics', team_federation: 'Ethiopian Athletics Federation',
    destination_country: 'France', destination_city: 'Paris', competition_name: 'World Athletics Championships',
    purpose_of_travel: 'Competition', visa_type: 'Schengen C', embassy: 'French Embassy, Addis Ababa',
    departure_date: addDays(3), return_date: addDays(10), priority: 'high',
  }, ['visa_appointment', 'visa_application_form', 'invitation_letter', 'travel_ticket', 'travel_insurance', 'bank_statement', 'eaf_letter']);

  await seedAthlete(staff1Id, adminId, {
    athlete_code: 'ATH-0002', full_name: 'Dawit Bekele', gender: 'male', date_of_birth: '2001-08-02',
    passport_number: 'EP7654321', sport: 'Boxing', team_federation: 'Ethiopian Boxing Federation',
    destination_country: 'Germany', destination_city: 'Berlin', competition_name: 'European Open Boxing Cup',
    purpose_of_travel: 'Competition', visa_type: 'Schengen C', embassy: 'German Embassy, Addis Ababa',
    departure_date: addDays(21), return_date: addDays(28), priority: 'medium',
  }, ['visa_appointment', 'visa_application_form', 'invitation_letter']);

  await seedAthlete(staff1Id, adminId, {
    athlete_code: 'ATH-0003', full_name: 'Hana Girma', gender: 'female', date_of_birth: '2000-01-20',
    passport_number: 'EP1122334', sport: 'Swimming', team_federation: 'Ethiopian Swimming Federation',
    destination_country: 'Kenya', destination_city: 'Nairobi', competition_name: 'East Africa Regional Swim Meet',
    purpose_of_travel: 'Competition', visa_type: 'East Africa Tourist Visa', embassy: 'Kenyan Embassy, Addis Ababa',
    departure_date: addDays(45), return_date: addDays(50), priority: 'low',
  }, []);

  logger.info('Seed complete', { adminEmail: env.seedAdmin.email });
  await pool.end();
}

run().catch((err) => {
  logger.error('Seed failed', { error: err.message });
  process.exit(1);
});
