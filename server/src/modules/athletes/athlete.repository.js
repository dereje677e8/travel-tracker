import { REQUIRED_ITEMS } from '../../utils/progress.js';

/**
 * All raw SQL for athletes lives here, parameterized. Nothing above this
 * layer (service/controller) should build or touch SQL directly.
 */

function nextAthleteCode(conn) {
  return conn.query(
    "SELECT athlete_code FROM athletes ORDER BY id DESC LIMIT 1"
  );
}

export async function generateAthleteCode(conn) {
  const [rows] = await nextAthleteCode(conn);
  if (!rows.length) return 'ATH-0001';
  const lastNum = parseInt(rows[0].athlete_code.split('-')[1], 10);
  return `ATH-${String(lastNum + 1).padStart(4, '0')}`;
}

export async function insertAthlete(conn, code, data, createdBy) {
  const [result] = await conn.query(
    `INSERT INTO athletes
      (athlete_code, full_name, gender, date_of_birth,
       place_of_birth_country, place_of_birth_province, place_of_birth_city,
       current_address, marital_status, national_id,
       passport_number, passport_expiration_date, passport_issue_date, passport_issue_place,
       sport, team_federation,
       destination_country, destination_city, competition_name, purpose_of_travel, visa_type,
       embassy, departure_date, return_date, assigned_officer_id, priority, notes, created_by)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      code, data.fullName, data.gender, data.dateOfBirth,
      data.placeOfBirthCountry || null, data.placeOfBirthProvince || null, data.placeOfBirthCity || null,
      data.currentAddress || null, data.maritalStatus || null, data.nationalId || null,
      data.passportNumber, data.passportExpirationDate || null, data.passportIssueDate || null, data.passportIssuePlace || null,
      data.sport, data.teamFederation || null, data.destinationCountry, data.destinationCity || null,
      data.competitionName, data.purposeOfTravel || null, data.visaType || null, data.embassy || null,
      data.departureDate, data.returnDate, data.assignedOfficerId || null, data.priority,
      data.notes || null, createdBy,
    ]
  );
  return result.insertId;
}

export async function insertBlankRequirements(conn, athleteId) {
  const values = REQUIRED_ITEMS.map((key) => [athleteId, key]);
  await conn.query(
    'INSERT INTO travel_requirements (athlete_id, requirement_key) VALUES ?',
    [values]
  );
}

export async function updateAthleteFields(conn, id, patch) {
  const columnMap = {
    fullName: 'full_name', gender: 'gender', dateOfBirth: 'date_of_birth',
    placeOfBirthCountry: 'place_of_birth_country', placeOfBirthProvince: 'place_of_birth_province',
    placeOfBirthCity: 'place_of_birth_city', currentAddress: 'current_address',
    maritalStatus: 'marital_status', nationalId: 'national_id',
    passportNumber: 'passport_number', passportExpirationDate: 'passport_expiration_date',
    passportIssueDate: 'passport_issue_date', passportIssuePlace: 'passport_issue_place',
    sport: 'sport', teamFederation: 'team_federation',
    destinationCountry: 'destination_country', destinationCity: 'destination_city',
    competitionName: 'competition_name', purposeOfTravel: 'purpose_of_travel', visaType: 'visa_type',
    embassy: 'embassy', departureDate: 'departure_date', returnDate: 'return_date',
    assignedOfficerId: 'assigned_officer_id', priority: 'priority', notes: 'notes',
  };
  const fields = [];
  const values = [];
  for (const [key, column] of Object.entries(columnMap)) {
    if (patch[key] !== undefined) { fields.push(`${column} = ?`); values.push(patch[key]); }
  }
  if (!fields.length) return;
  values.push(id);
  await conn.query(`UPDATE athletes SET ${fields.join(', ')} WHERE id = ?`, values);
}

export async function updatePhotoPath(id, photoPath) {
  const { pool } = await import('../../db/pool.js');
  await pool.query('UPDATE athletes SET photo_path = ? WHERE id = ?', [photoPath, id]);
}

export async function updateProgress(conn, id, percent, status) {
  await conn.query('UPDATE athletes SET progress_percent = ?, status = ? WHERE id = ?', [percent, status, id]);
}

export async function softDelete(conn, id) {
  await conn.query('UPDATE athletes SET deleted_at = NOW() WHERE id = ?', [id]);
}

export async function findById(id) {
  const { pool } = await import('../../db/pool.js');
  const [rows] = await pool.query(
    `SELECT a.*, u.full_name AS assigned_officer_name
     FROM athletes a
     LEFT JOIN users u ON u.id = a.assigned_officer_id
     WHERE a.id = ? AND a.deleted_at IS NULL`,
    [id]
  );
  return rows[0] || null;
}

export async function findRequirements(athleteId) {
  const { pool } = await import('../../db/pool.js');
  const [rows] = await pool.query(
    'SELECT id, requirement_key, status, date_completed, appointment_date, notes FROM travel_requirements WHERE athlete_id = ?',
    [athleteId]
  );
  return rows;
}

export async function getRequirement(athleteId, requirementKey) {
  const { pool } = await import('../../db/pool.js');
  const [rows] = await pool.query(
    'SELECT id, requirement_key, status FROM travel_requirements WHERE athlete_id = ? AND requirement_key = ?',
    [athleteId, requirementKey]
  );
  return rows[0] || null;
}

export async function updateRequirementRow(conn, athleteId, requirementKey, { status, dateCompleted, appointmentDate, notes }, updatedBy) {
  // status/date_completed are always driven by the toggle (completing clears
  // to today or the given date; un-completing clears it). appointment_date
  // and notes are independent fields - only touch them when the caller
  // actually sent a value, so toggling status doesn't silently wipe a
  // previously-set appointment date or notes.
  const fields = ['status = ?', 'date_completed = ?', 'updated_by = ?'];
  const values = [
    status,
    status === 'completed' ? (dateCompleted || new Date().toISOString().slice(0, 10)) : null,
    updatedBy,
  ];
  if (appointmentDate !== undefined) {
    fields.push('appointment_date = ?');
    values.push(appointmentDate || null);
  }
  if (notes !== undefined) {
    fields.push('notes = ?');
    values.push(notes || null);
  }
  values.push(athleteId, requirementKey);

  await conn.query(
    `UPDATE travel_requirements SET ${fields.join(', ')} WHERE athlete_id = ? AND requirement_key = ?`,
    values
  );
}

export async function list({ page, limit, search, status, destinationCountry, missing, travelWindow, passportExpiring, sortBy, sortDir }) {
  const { pool } = await import('../../db/pool.js');
  const where = ['a.deleted_at IS NULL'];
  const params = [];

  if (search) {
    where.push('(a.full_name LIKE ? OR a.passport_number LIKE ? OR a.sport LIKE ? OR a.competition_name LIKE ? OR a.destination_country LIKE ?)');
    const term = `%${search}%`;
    params.push(term, term, term, term, term);
  }
  if (status) { where.push('a.status = ?'); params.push(status); }
  if (destinationCountry) { where.push('a.destination_country = ?'); params.push(destinationCountry); }
  if (missing) {
    where.push(`EXISTS (
      SELECT 1 FROM travel_requirements tr
      WHERE tr.athlete_id = a.id AND tr.requirement_key = ? AND tr.status = 'pending'
    )`);
    params.push(missing);
  }
  if (travelWindow === 'week') {
    where.push('a.departure_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)');
  } else if (travelWindow === 'month') {
    where.push('a.departure_date BETWEEN CURDATE() AND LAST_DAY(CURDATE())');
  }
  if (passportExpiring) {
    // Flags anything already expired or expiring within 6 months - the
    // validity window many countries require at entry.
    where.push('a.passport_expiration_date IS NOT NULL AND a.passport_expiration_date <= DATE_ADD(CURDATE(), INTERVAL 6 MONTH)');
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const sortColumn = { departure_date: 'a.departure_date', created_at: 'a.created_at', full_name: 'a.full_name', progress_percent: 'a.progress_percent' }[sortBy];
  const offset = (page - 1) * limit;

  const [rows] = await pool.query(
    `SELECT a.id, a.athlete_code, a.full_name, a.photo_path, a.sport, a.destination_country, a.destination_city,
            a.competition_name, a.departure_date, a.return_date, a.priority, a.progress_percent,
            a.status, a.passport_expiration_date, u.full_name AS assigned_officer_name
     FROM athletes a
     LEFT JOIN users u ON u.id = a.assigned_officer_id
     ${whereSql}
     ORDER BY ${sortColumn} ${sortDir}
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM athletes a ${whereSql}`,
    params
  );

  return { rows, total, page, limit };
}
