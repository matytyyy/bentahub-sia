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
