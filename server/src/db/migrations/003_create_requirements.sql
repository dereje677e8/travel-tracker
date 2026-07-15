CREATE TABLE IF NOT EXISTS travel_requirements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  athlete_id INT NOT NULL,
  requirement_key ENUM(
    'visa_appointment', 'visa_application_form', 'invitation_letter',
    'travel_ticket', 'travel_insurance', 'bank_statement', 'eaf_letter'
  ) NOT NULL,
  status ENUM('pending', 'completed') NOT NULL DEFAULT 'pending',
  date_completed DATE NULL,
  notes VARCHAR(500),
  updated_by INT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (athlete_id) REFERENCES athletes(id) ON DELETE CASCADE,
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE KEY uniq_athlete_requirement (athlete_id, requirement_key)
) ENGINE=InnoDB;
