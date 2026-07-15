-- Tracks a *scheduled* appointment date (e.g. an upcoming visa appointment),
-- distinct from date_completed (when the item was actually finished). This
-- lets the app remind someone the day before a scheduled appointment even
-- though the requirement itself is still pending.
--
-- Combined into a single ALTER statement (column + index) because the
-- migration runner executes each file as one query without
-- multipleStatements enabled - a separate CREATE INDEX statement after a
-- semicolon fails silently-ish (see migrate.js).
ALTER TABLE travel_requirements
  ADD COLUMN appointment_date DATE NULL AFTER date_completed,
  ADD INDEX idx_requirements_appointment_date (appointment_date);
