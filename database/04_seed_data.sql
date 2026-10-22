-- =====================================================================
-- 04_SEED_DATA.SQL: Baseline Master Dataset & Administrative Accounts
-- Target DBMS: MySQL 8.0+ / MariaDB 10.4+
-- =====================================================================

USE covid_vaccination;

-- Clear previous data
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE Vaccinations;
TRUNCATE TABLE Vaccines;
TRUNCATE TABLE VaccinationCenters;
TRUNCATE TABLE Citizens;
TRUNCATE TABLE users;
SET FOREIGN_KEY_CHECKS = 1;

-- ---------------------------------------------------------------------
-- 1. Master Citizens (8 sample citizens)
-- ---------------------------------------------------------------------
INSERT INTO Citizens (citizen_id, citizen_name, aadhaar_no, mobile) VALUES
(1, 'Aarav Sharma',  '234567890123', '9876543210'),
(2, 'Ananya Verma',  '345678901234', '9123456780'),
(3, 'Rohan Singh',   '456789012345', '9988776655'),
(4, 'Priya Patel',   '567890123456', '8877665544'),
(5, 'Aditya Kumar',  '678901234567', '7766554433'),
(6, 'Neha Gupta',    '789012345678', '9090909090'),
(7, 'Kabir Khan',    '890123456789', '8080808080'),
(8, 'Sneha Joshi',   '901234567890', '7070707070');

-- ---------------------------------------------------------------------
-- 2. Vaccination Centers (4 physical centers)
-- ---------------------------------------------------------------------
INSERT INTO VaccinationCenters (center_id, center_name, district, state) VALUES
(1, 'District Hospital Bhopal',   'Bhopal',   'Madhya Pradesh'),
(2, 'Community Health Centre',    'Indore',   'Madhya Pradesh'),
(3, 'City Primary Health Centre', 'Jaipur',   'Rajasthan'),
(4, 'Civil Hospital Ahmedabad',   'Ahmedabad','Gujarat');

-- ---------------------------------------------------------------------
-- 3. Vaccines (4 pharmaceutical brands)
-- ---------------------------------------------------------------------
INSERT INTO Vaccines (vaccine_id, vaccine_name, manufacturer, doses_required) VALUES
(1, 'Covishield',    'Serum Institute of India', 2),
(2, 'Covaxin',       'Bharat Biotech',           2),
(3, 'Corbevax',      'Biological E',             2),
(4, 'Sputnik Light', 'Gamaleya / Dr. Reddy''s',  1);

-- ---------------------------------------------------------------------
-- 4. Vaccinations (10 initial records)
-- ---------------------------------------------------------------------
INSERT INTO Vaccinations (vaccination_id, citizen_id, vaccine_id, center_id, vaccination_date) VALUES
(1,  1, 1, 1, '2021-06-10'),
(2,  1, 1, 1, '2021-09-02'),
(3,  2, 2, 2, '2021-07-15'),
(4,  2, 2, 2, '2021-08-14'),
(5,  3, 1, 3, '2021-08-01'),
(6,  4, 4, 4, '2021-10-05'),
(7,  5, 3, 1, '2022-02-20'),
(8,  5, 3, 1, '2022-03-21'),
(9,  6, 2, 2, '2021-11-11'),
(10, 7, 1, 4, '2021-12-01');

-- ---------------------------------------------------------------------
-- 5. Seed System Users (BCrypt hashes for Admin@123, Staff@123, Viewer@123)
-- ---------------------------------------------------------------------
INSERT INTO users (user_id, username, password_hash, full_name, role) VALUES
(1, 'admin',  '$2b$10$fHKvoEjwy6QC/SOnEqgPTup0obBD1irShsyiHnD8Cx/iO0DBe1X9u', 'Administrator', 'admin'),
(2, 'staff',  '$2b$10$/d7x5NIlfJ//oBvrrsNmIuSbwWrj6Iozt7WpIoD1fxJlcrPEp/Jxe', 'Healthcare Staff', 'staff'),
(3, 'viewer', '$2b$10$4D2mk4/NGnnWJzO4r2HsDuhhmpc7H2UdkQsKqUjQESawh2fbl0jfq', 'Clinical Auditor', 'viewer');
