-- Tracks each athlete's passport expiration date so staff can be warned
-- when it falls inside the common "6 months validity" requirement many
-- countries enforce at entry. Nullable so it doesn't break existing rows;
-- the app flags it as missing/expiring wherever it's shown.
ALTER TABLE athletes
  ADD COLUMN passport_expiration_date DATE NULL AFTER passport_number,
  ADD INDEX idx_athletes_passport_expiration (passport_expiration_date);
