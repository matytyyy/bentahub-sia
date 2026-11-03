INSERT INTO categories (id, category_name) VALUES (1,'Electronics'),(2,'Clothing'),(3,'Books'),(4,'Furniture');
INSERT INTO listings (id, seller_id, category_id, title, description, price, status) VALUES
(1,2,1,'Used iPhone 11','64GB, good condition',15000.00,'active'),
(2,2,NULL,'Mountain Bike','Uncategorized on purpose (RIGHT JOIN demo)',8000.00,'active'),
(3,3,3,'Calculus Textbook','Barely used',500.00,'active'),
(4,3,1,'Old Laptop','Already sold',6000.00,'sold');
INSERT INTO listing_images (listing_id, image_url, is_primary) VALUES
(1,'https://example.com/iphone-front.jpg',1),(1,'https://example.com/iphone-back.jpg',0),(3,'https://example.com/calculus.jpg',1);
