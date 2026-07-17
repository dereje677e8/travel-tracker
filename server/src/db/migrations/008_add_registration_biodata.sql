-- Registration/biodata fields beyond travel logistics: photo, extended
-- passport bio-data-page fields, place of birth, current address, marital
-- status, and national ID. All nullable so existing records aren't broken -
-- this is data staff fill in progressively, not required at creation.
ALTER TABLE athletes
  ADD COLUMN photo_path VARCHAR(255) NULL AFTER passport_expiration_date,
  ADD COLUMN passport_issue_date DATE NULL AFTER passport_expiration_date,
  ADD COLUMN passport_issue_place VARCHAR(150) NULL AFTER passport_issue_date,
  ADD COLUMN place_of_birth_country VARCHAR(100) NULL AFTER date_of_birth,
  ADD COLUMN place_of_birth_province VARCHAR(100) NULL AFTER place_of_birth_country,
  ADD COLUMN place_of_birth_city VARCHAR(100) NULL AFTER place_of_birth_province,
  ADD COLUMN current_address TEXT NULL AFTER place_of_birth_city,
  ADD COLUMN marital_status ENUM('single','married','divorced','widowed','other') NULL AFTER current_address,
  ADD COLUMN national_id VARCHAR(50) NULL AFTER marital_status;
