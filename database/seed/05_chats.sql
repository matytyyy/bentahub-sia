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
