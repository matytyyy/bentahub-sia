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
