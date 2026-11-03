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
