-- Runs only on an empty db-data volume (first start).
CREATE TABLE IF NOT EXISTS contacts (
  id INT NOT NULL AUTO_INCREMENT,
  first_name VARCHAR(255) NOT NULL,
  middle_initial VARCHAR(10) DEFAULT NULL,
  last_name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) DEFAULT NULL,
  email VARCHAR(255) DEFAULT NULL,
  personal_email VARCHAR(255) DEFAULT NULL,
  address TEXT,
  profile_picture LONGTEXT,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Fake sample data only. Never commit real contacts.
INSERT INTO contacts (first_name, middle_initial, last_name, phone, email, personal_email, address, profile_picture) VALUES
('Ana',  'M', 'Reyes', '+639171234567', 'ana.reyes@example.com', 'ana@example.org',   'Sample Street, Sample City', ''),
('Juan', 'D', 'Cruz',  '+639181234567', 'juan.cruz@example.com', '',                  'Sample Avenue, Sample City', '');
