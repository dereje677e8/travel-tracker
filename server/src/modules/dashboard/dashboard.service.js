import { pool } from '../../db/pool.js';

export async function getSummary() {
  const [[counts]] = await pool.query(`
    SELECT
      COUNT(*) AS total_athletes,
      SUM(status = 'ready_for_travel') AS ready_for_travel,
      SUM(status IN ('preparing_documents', 'in_progress', 'almost_ready')) AS in_progress,
      SUM(status = 'new') AS action_required,
      SUM(departure_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)) AS traveling_this_week
    FROM athletes WHERE deleted_at IS NULL
  `);

  const [byDestination] = await pool.query(`
    SELECT destination_country, COUNT(*) AS count
    FROM athletes WHERE deleted_at IS NULL
    GROUP BY destination_country ORDER BY count DESC
  `);

  const [upcomingDepartures] = await pool.query(`
    SELECT id, athlete_code, full_name, destination_country, departure_date, status, progress_percent
    FROM athletes
    WHERE deleted_at IS NULL AND departure_date >= CURDATE()
    ORDER BY departure_date ASC LIMIT 8
  `);

  const [upcomingVisaAppointments] = await pool.query(`
    SELECT a.id, a.athlete_code, a.full_name, tr.status, tr.appointment_date, a.embassy
    FROM athletes a
    JOIN travel_requirements tr ON tr.athlete_id = a.id AND tr.requirement_key = 'visa_appointment'
    WHERE a.deleted_at IS NULL AND tr.status = 'pending' AND tr.appointment_date IS NOT NULL
      AND tr.appointment_date >= CURDATE()
    ORDER BY tr.appointment_date ASC LIMIT 8
  `);

  const [recentUpdates] = await pool.query(`
    SELECT al.id, al.action, al.entity_type, al.entity_id, al.created_at, u.full_name AS user_name,
           a.full_name AS athlete_name
    FROM activity_log al
    LEFT JOIN users u ON u.id = al.user_id
    LEFT JOIN athletes a ON al.entity_type = 'athlete' AND a.id = al.entity_id
    ORDER BY al.created_at DESC LIMIT 10
  `);

  const [progressBuckets] = await pool.query(`
    SELECT status, COUNT(*) AS count FROM athletes WHERE deleted_at IS NULL GROUP BY status
  `);

  return {
    totals: {
      totalAthletes: counts.total_athletes || 0,
      readyForTravel: counts.ready_for_travel || 0,
      inProgress: counts.in_progress || 0,
      actionRequired: counts.action_required || 0,
      travelingThisWeek: counts.traveling_this_week || 0,
    },
    byDestination,
    upcomingDepartures,
    upcomingVisaAppointments,
    recentUpdates,
    progressBuckets,
  };
}
