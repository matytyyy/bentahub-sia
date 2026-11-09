CREATE DATABASE IF NOT EXISTS bentahub_db;
USE bentahub_db;
SET FOREIGN_KEY_CHECKS = 0;
-- ===== schema/01_core.sql =====
-- Ijan: Core (roles, users, user_roles)
DROP TABLE IF EXISTS user_roles;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS roles;

CREATE TABLE roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  role_name VARCHAR(30) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE user_roles (
  user_id INT NOT NULL,
  role_id INT NOT NULL,
  PRIMARY KEY (user_id, role_id),
  CONSTRAINT fk_ur_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_ur_role FOREIGN KEY (role_id) REFERENCES roles(id)
) ENGINE=InnoDB;

-- ===== schema/02_zones.sql =====
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

-- ===== schema/03_listings.sql =====
-- Dinglasan: Listings (categories, listings, listing_images)
DROP TABLE IF EXISTS listing_images;
DROP TABLE IF EXISTS listings;
DROP TABLE IF EXISTS categories;

CREATE TABLE categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category_name VARCHAR(60) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE listings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  seller_id INT NOT NULL,
  category_id INT NULL,                            -- optional: lets the RIGHT JOIN report show uncategorized items
  title VARCHAR(120) NOT NULL,
  description TEXT NULL,
  price DECIMAL(10,2) NOT NULL,
  status ENUM('active','sold','removed') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_price CHECK (price > 0),
  CONSTRAINT fk_listing_seller FOREIGN KEY (seller_id) REFERENCES users(id),
  CONSTRAINT fk_listing_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE listing_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  listing_id INT NOT NULL,
  image_url VARCHAR(255) NOT NULL,
  is_primary TINYINT(1) NOT NULL DEFAULT 0,
  CONSTRAINT fk_image_listing FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ===== schema/04_meetups.sql =====
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

-- ===== schema/05_chats.sql =====
-- Cabugnason: Chat, audit, alerts (chat_messages, audit_logs, notifications)
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS chat_messages;

CREATE TABLE chat_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  listing_id INT NOT NULL,
  sender_id INT NOT NULL,
  receiver_id INT NOT NULL,
  message VARCHAR(1000) NOT NULL,
  is_deleted TINYINT(1) NOT NULL DEFAULT 0,
  sent_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_cm_listing FOREIGN KEY (listing_id) REFERENCES listings(id),
  CONSTRAINT fk_cm_sender FOREIGN KEY (sender_id) REFERENCES users(id),
  CONSTRAINT fk_cm_receiver FOREIGN KEY (receiver_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,                                -- NULL = action done by the SYSTEM (automatic workflow)
  action VARCHAR(50) NOT NULL,
  entity VARCHAR(50) NOT NULL,
  entity_id INT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  message VARCHAR(255) NOT NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ===== schema/06_reviews.sql =====
-- Gemina: Reviews & trust (trust_tiers, reviews, seller_trust_scores)
DROP TABLE IF EXISTS seller_trust_scores;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS trust_tiers;

CREATE TABLE trust_tiers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tier_name VARCHAR(30) NOT NULL UNIQUE,
  min_score DECIMAL(3,2) NOT NULL,                 -- average rating needed
  min_reviews INT NOT NULL                         -- AND at least this many reviews
) ENGINE=InnoDB;

CREATE TABLE reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  meetup_id INT NOT NULL UNIQUE,                   -- one review per completed meetup
  reviewer_id INT NOT NULL,
  seller_id INT NOT NULL,
  rating TINYINT NOT NULL,
  comment VARCHAR(500) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_rating CHECK (rating BETWEEN 1 AND 5),
  CONSTRAINT fk_rev_meetup FOREIGN KEY (meetup_id) REFERENCES meetup_schedules(id),
  CONSTRAINT fk_rev_reviewer FOREIGN KEY (reviewer_id) REFERENCES users(id),
  CONSTRAINT fk_rev_seller FOREIGN KEY (seller_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE seller_trust_scores (
  seller_id INT PRIMARY KEY,
  rating_score DECIMAL(3,2) NOT NULL DEFAULT 0,
  total_reviews INT NOT NULL DEFAULT 0,
  trust_tier_id INT NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_sts_seller FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_sts_tier FOREIGN KEY (trust_tier_id) REFERENCES trust_tiers(id)
) ENGINE=InnoDB;

SET FOREIGN_KEY_CHECKS = 1;
-- ===== seed/01_core.sql =====
INSERT INTO roles (id, role_name) VALUES (1,'admin'),(2,'seller'),(3,'buyer');
-- Every seeded account uses the password: password123
INSERT INTO users (id, username, full_name, email, password_hash) VALUES
(1,'ijan','Ijan (Admin)','ijan@bentahub.test','99d2df632a66688cf0456ee776cd0847:b07fd424f69696c96b2164782d0506ac908301bff547698d01f65517a9f95f97a1c3467fe28784f129eec91eb2d3f607222f4a107ce2bd0147af2136a7f3be19'),
(2,'dinglasan','Dinglasan','dinglasan@bentahub.test','99d2df632a66688cf0456ee776cd0847:b07fd424f69696c96b2164782d0506ac908301bff547698d01f65517a9f95f97a1c3467fe28784f129eec91eb2d3f607222f4a107ce2bd0147af2136a7f3be19'),
(3,'ibib','Ib-Ib','ibib@bentahub.test','99d2df632a66688cf0456ee776cd0847:b07fd424f69696c96b2164782d0506ac908301bff547698d01f65517a9f95f97a1c3467fe28784f129eec91eb2d3f607222f4a107ce2bd0147af2136a7f3be19'),
(4,'espiritu','Espiritu','espiritu@bentahub.test','99d2df632a66688cf0456ee776cd0847:b07fd424f69696c96b2164782d0506ac908301bff547698d01f65517a9f95f97a1c3467fe28784f129eec91eb2d3f607222f4a107ce2bd0147af2136a7f3be19'),
(5,'cabugnason','Cabugnason','cabugnason@bentahub.test','99d2df632a66688cf0456ee776cd0847:b07fd424f69696c96b2164782d0506ac908301bff547698d01f65517a9f95f97a1c3467fe28784f129eec91eb2d3f607222f4a107ce2bd0147af2136a7f3be19'),
(6,'gemina','Gemina','gemina@bentahub.test','99d2df632a66688cf0456ee776cd0847:b07fd424f69696c96b2164782d0506ac908301bff547698d01f65517a9f95f97a1c3467fe28784f129eec91eb2d3f607222f4a107ce2bd0147af2136a7f3be19'),
(7,'guest01','Guest User','guest01@bentahub.test','99d2df632a66688cf0456ee776cd0847:b07fd424f69696c96b2164782d0506ac908301bff547698d01f65517a9f95f97a1c3467fe28784f129eec91eb2d3f607222f4a107ce2bd0147af2136a7f3be19');
INSERT INTO user_roles (user_id, role_id) VALUES (1,1),(1,2),(2,2),(3,2),(4,3),(5,3),(6,3),(7,3);

-- ===== seed/02_zones.sql =====
INSERT INTO zone_types (id, type_name) VALUES (1,'Mall'),(2,'Police Station'),(3,'Barangay Hall'),(4,'Cafe');
INSERT INTO safe_meetup_zones (id, zone_type_id, zone_name, city, address, max_concurrent) VALUES
(1,1,'Mall Information Desk','Cebu City','Ground floor, main entrance',3),
(2,2,'Police Station Booth','Cebu City','Station 1 front lobby',1),
(3,3,'Barangay Hall Lobby','Cebu City','Barangay Hall, main road',2),
(4,4,'Corner Cafe Seating','Cebu City','Cafe row, near plaza',2);
-- Every zone is open 08:00-20:00, every day (seed only; new zones get hours from the API)
INSERT INTO zone_operating_hours (zone_id, day_of_week, open_time, close_time)
SELECT z.id, d.n, '08:00:00', '20:00:00'
FROM safe_meetup_zones z
JOIN (SELECT 0 AS n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6) d;

-- ===== seed/03_listings.sql =====
INSERT INTO categories (id, category_name) VALUES (1,'Electronics'),(2,'Clothing'),(3,'Books'),(4,'Furniture');
INSERT INTO listings (id, seller_id, category_id, title, description, price, status) VALUES
(1,2,1,'Used iPhone 11','64GB, good condition',15000.00,'active'),
(2,2,NULL,'Mountain Bike','Uncategorized on purpose (RIGHT JOIN demo)',8000.00,'active'),
(3,3,3,'Calculus Textbook','Barely used',500.00,'active'),
(4,3,1,'Old Laptop','Already sold',6000.00,'sold');
INSERT INTO listing_images (listing_id, image_url, is_primary) VALUES
(1,'https://example.com/iphone-front.jpg',1),(1,'https://example.com/iphone-back.jpg',0),(3,'https://example.com/calculus.jpg',1);

-- ===== seed/04_meetups.sql =====
INSERT INTO meetup_schedules (id, listing_id, buyer_id, seller_id, zone_id, scheduled_time, duration_minutes, status) VALUES
-- #1 future, confirmed, in the capacity-1 Police Station Booth: use it to demo the conflict rule
(1,1,4,2,2,TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL 3 DAY),'14:00:00'),30,'confirmed'),
-- #2 in the past and still pending: the workflow will auto-expire it
(2,3,5,3,1,DATE_SUB(NOW(), INTERVAL 2 DAY),30,'pending'),
-- #3, #4, #5 completed: eligible for reviews
(3,1,6,2,1,DATE_SUB(NOW(), INTERVAL 5 DAY),30,'completed'),
(4,2,4,2,3,DATE_SUB(NOW(), INTERVAL 6 DAY),30,'completed'),
(5,4,5,3,3,DATE_SUB(NOW(), INTERVAL 7 DAY),30,'completed');
INSERT INTO meetup_checkins (meetup_id, user_id) VALUES (3,6),(3,2),(4,4),(4,2),(5,5),(5,3);
INSERT INTO meetup_status_history (meetup_id, old_status, new_status, changed_by) VALUES
(1,NULL,'pending',4),(1,'pending','confirmed',2),(2,NULL,'pending',5),
(3,NULL,'pending',6),(3,'pending','completed',2),(4,NULL,'pending',4),(4,'pending','completed',2),
(5,NULL,'pending',5),(5,'pending','completed',3);

-- ===== seed/05_chats.sql =====
INSERT INTO chat_messages (listing_id, sender_id, receiver_id, message) VALUES
(1,4,2,'Hi! Is the iPhone still available?'),
(1,2,4,'Yes! We can meet at the Police Station Booth.'),
(3,5,3,'Can you do 450 for the textbook?');
-- user_id NULL = SYSTEM action. guest01 (id 7) has no logs on purpose. Both feed the FULL OUTER JOIN demo.
INSERT INTO audit_logs (user_id, action, entity, entity_id) VALUES
(NULL,'SYSTEM_START','system',NULL),
(1,'LOGIN','users',1),
(2,'CREATE_LISTING','listings',1),
(4,'MEETUP_PENDING','meetup_schedules',1);
INSERT INTO notifications (user_id, message) VALUES
(2,'Meetup #1 is confirmed for the Police Station Booth'),
(4,'Your meetup #1 was confirmed by the seller');

-- ===== seed/06_reviews.sql =====
INSERT INTO trust_tiers (id, tier_name, min_score, min_reviews) VALUES
(1,'Newcomer',0.00,0),(2,'Trusted',3.50,2),(3,'Gold',4.50,3);
INSERT INTO reviews (meetup_id, reviewer_id, seller_id, rating, comment) VALUES
(3,6,2,5,'Smooth and safe meetup'),
(4,4,2,4,'Item as described');
-- Dinglasan (id 2): avg 4.50 over 2 reviews -> Trusted (Gold needs 3 reviews). Ib-Ib has no score on purpose (LEFT JOIN demo).
INSERT INTO seller_trust_scores (seller_id, rating_score, total_reviews, trust_tier_id) VALUES (2,4.50,2,2);
