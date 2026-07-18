-- Adds a time-of-day alongside the existing appointment date, and makes
-- notifications.athlete_id nullable so a single consolidated reminder can
-- cover multiple athletes' same-day appointments (a batch notification
-- isn't "about" any one athlete, so it shouldn't be forced to reference one).
ALTER TABLE travel_requirements
  ADD COLUMN appointment_time TIME NULL AFTER appointment_date;

ALTER TABLE notifications
  MODIFY COLUMN athlete_id INT NULL;
