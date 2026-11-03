INSERT INTO trust_tiers (id, tier_name, min_score, min_reviews) VALUES
(1,'Newcomer',0.00,0),(2,'Trusted',3.50,2),(3,'Gold',4.50,3);
INSERT INTO reviews (meetup_id, reviewer_id, seller_id, rating, comment) VALUES
(3,6,2,5,'Smooth and safe meetup'),
(4,4,2,4,'Item as described');
-- Dinglasan (id 2): avg 4.50 over 2 reviews -> Trusted (Gold needs 3 reviews). Ib-Ib has no score on purpose (LEFT JOIN demo).
INSERT INTO seller_trust_scores (seller_id, rating_score, total_reviews, trust_tier_id) VALUES (2,4.50,2,2);
