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
