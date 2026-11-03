-- Ib-Ib: Master data (zone_types, safe_meetup_zones, zone_operating_hours)
DROP TABLE IF EXISTS zone_operating_hours;
DROP TABLE IF EXISTS safe_meetup_zones;
DROP TABLE IF EXISTS zone_types;

CREATE TABLE zone_types (
  id INT AUTO_INCREMENT PRIMARY KEY,
  type_name VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE safe_meetup_zones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  zone_type_id INT NOT NULL,
  zone_name VARCHAR(100) NOT NULL,
  city VARCHAR(60) NOT NULL,
  address VARCHAR(200) NOT NULL,
  max_concurrent INT NOT NULL DEFAULT 2,           -- how many meetups may overlap here
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  CONSTRAINT chk_zone_capacity CHECK (max_concurrent BETWEEN 1 AND 20),
  CONSTRAINT fk_zone_type FOREIGN KEY (zone_type_id) REFERENCES zone_types(id)
) ENGINE=InnoDB;

CREATE TABLE zone_operating_hours (
  id INT AUTO_INCREMENT PRIMARY KEY,
  zone_id INT NOT NULL,
  day_of_week TINYINT NOT NULL,                    -- MySQL WEEKDAY(): 0 = Monday ... 6 = Sunday
  open_time TIME NOT NULL,
  close_time TIME NOT NULL,
  UNIQUE KEY uq_zone_day (zone_id, day_of_week),
  CONSTRAINT chk_day CHECK (day_of_week BETWEEN 0 AND 6),
  CONSTRAINT chk_hours CHECK (open_time < close_time),
  CONSTRAINT fk_hours_zone FOREIGN KEY (zone_id) REFERENCES safe_meetup_zones(id) ON DELETE CASCADE
) ENGINE=InnoDB;
