-- Espiritu: Meetups (meetup_schedules, meetup_checkins, meetup_status_history)
DROP TABLE IF EXISTS meetup_status_history;
DROP TABLE IF EXISTS meetup_checkins;
DROP TABLE IF EXISTS meetup_schedules;

CREATE TABLE meetup_schedules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  listing_id INT NOT NULL,
  buyer_id INT NOT NULL,
  seller_id INT NOT NULL,
  zone_id INT NOT NULL,
  scheduled_time DATETIME NOT NULL,
  duration_minutes INT NOT NULL DEFAULT 30,
  status ENUM('pending','confirmed','completed','cancelled','expired') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_zone_time (zone_id, scheduled_time),
  CONSTRAINT chk_duration CHECK (duration_minutes BETWEEN 15 AND 120),
  CONSTRAINT chk_not_self CHECK (buyer_id <> seller_id),
  CONSTRAINT fk_ms_listing FOREIGN KEY (listing_id) REFERENCES listings(id),
  CONSTRAINT fk_ms_buyer FOREIGN KEY (buyer_id) REFERENCES users(id),
  CONSTRAINT fk_ms_seller FOREIGN KEY (seller_id) REFERENCES users(id),
  CONSTRAINT fk_ms_zone FOREIGN KEY (zone_id) REFERENCES safe_meetup_zones(id)
) ENGINE=InnoDB;

CREATE TABLE meetup_checkins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  meetup_id INT NOT NULL,
  user_id INT NOT NULL,
  checked_in_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_checkin (meetup_id, user_id),
  CONSTRAINT fk_ci_meetup FOREIGN KEY (meetup_id) REFERENCES meetup_schedules(id) ON DELETE CASCADE,
  CONSTRAINT fk_ci_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE meetup_status_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  meetup_id INT NOT NULL,
  old_status VARCHAR(20) NULL,
  new_status VARCHAR(20) NOT NULL,
  changed_by INT NULL,                             -- NULL = changed automatically by the system
  changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_msh_meetup FOREIGN KEY (meetup_id) REFERENCES meetup_schedules(id) ON DELETE CASCADE,
  CONSTRAINT fk_msh_user FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;
